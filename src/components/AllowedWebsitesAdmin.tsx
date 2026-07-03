import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check, X, Globe, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AllowedWebsite {
  id: string;
  url: string;
  created_at: string;
}

interface BlockedLog {
  id: string;
  referrer: string;
  blocked_at: string;
}

const AllowedWebsitesAdmin = () => {
  const [websites, setWebsites] = useState<AllowedWebsite[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [logs, setLogs] = useState<BlockedLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchWebsites = async () => {
    const { data } = await supabase.from("allowed_websites").select("*").order("created_at", { ascending: true });
    if (data) setWebsites(data as AllowedWebsite[]);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from("blocked_access_logs").select("*").order("blocked_at", { ascending: false }).limit(50);
    if (data) setLogs(data as BlockedLog[]);
  };

  useEffect(() => {
    fetchWebsites();
    fetchLogs();

    const channel = supabase
      .channel("admin_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "allowed_websites" },
        () => fetchWebsites()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_access_logs" },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPw = () => sessionStorage.getItem("admin_pw") || "";

  const addWebsite = async () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    await supabase.rpc("admin_add_allowed_website", { _password: getPw(), _url: trimmed });
    setNewUrl("");
    fetchWebsites();
  };

  const deleteWebsite = async (id: string) => {
    await supabase.rpc("admin_delete_allowed_website", { _password: getPw(), _id: id });
    fetchWebsites();
  };

  const startEdit = (site: AllowedWebsite) => {
    setEditingId(site.id);
    setEditUrl(site.url);
  };

  const saveEdit = async () => {
    if (!editingId || !editUrl.trim()) return;
    await supabase.rpc("admin_update_allowed_website", { _password: getPw(), _id: editingId, _url: editUrl.trim() });
    setEditingId(null);
    setEditUrl("");
    fetchWebsites();
  };

  const clearLogs = async () => {
    const pw = getPw();
    if (!pw) {
      toast({
        title: "Session expired",
        description: "Please log out and log back in to clear logs.",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase.rpc("admin_clear_blocked_logs", { _password: pw });
    if (error) {
      toast({
        title: "Failed to clear logs",
        description: error.message.includes("unauthorized")
          ? "Password changed. Please log out and log back in."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Blocked access logs cleared" });
    fetchLogs();
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Allowed Websites</h3>
      </div>

      {/* Add new URL */}
      <div className="flex gap-2">
        <Input
          placeholder="https://example.com"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWebsite()}
          className="text-xs h-8"
        />
        <Button size="sm" onClick={addWebsite} className="h-8 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Website list */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }}>
        {websites.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No websites added. All referrers allowed.</p>
        )}
        {websites.map((site) => (
          <div key={site.id} className="flex items-center gap-1.5 bg-secondary/50 rounded px-2 py-1">
            {editingId === site.id ? (
              <>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="text-xs h-6 flex-1"
                />
                <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-foreground flex-1 truncate">{site.url}</span>
                <button onClick={() => startEdit(site)} className="text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => deleteWebsite(site.id)} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Blocked access logs toggle */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Blocked Access Logs ({logs.length})
        </button>

        {showLogs && (
          <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No blocked attempts.</p>
            ) : (
              <>
                {logs.map((log) => (
                  <div key={log.id} className="text-[10px] bg-destructive/5 rounded px-2 py-1 flex justify-between">
                    <span className="truncate flex-1 text-foreground">{log.referrer}</span>
                    <span className="text-muted-foreground ml-2 whitespace-nowrap">
                      {new Date(log.blocked_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={clearLogs} className="text-xs h-6 mt-1">
                  Clear Logs
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllowedWebsitesAdmin;
