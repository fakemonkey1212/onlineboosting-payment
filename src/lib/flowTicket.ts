/**
 * Per-tab payment flow ticket.
 *
 * A ticket is issued only when the visitor actually starts the payment flow.
 * It lives in `sessionStorage`, so a copied/shared URL opened in another tab,
 * browser or device has no ticket and is rejected by the payment guard.
 */
const TICKET_KEY = "genz_flow_ticket_v1";
const TICKET_TTL_MS = 30 * 60 * 1000;

export type FlowTicket = {
  token: string;
  amount: number;
  route: PaymentFlowRoute;
  ts: number;
};

export type PaymentFlowRoute = "bkash" | "nagad" | "rocket" | "upay" | "card" | "binance";

const randomToken = (): string => {
  try {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now()}${Math.random().toString(36).slice(2)}`;
  }
};

export const issueFlowTicket = (amount: number, route: PaymentFlowRoute): string => {
  const ticket: FlowTicket = { token: randomToken(), amount, route, ts: Date.now() };
  try {
    sessionStorage.setItem(TICKET_KEY, JSON.stringify(ticket));
  } catch {
    /* ignore */
  }
  return ticket.token;
};

export const readFlowTicket = (): FlowTicket | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TICKET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlowTicket;
    if (!parsed?.token || !parsed.ts || Date.now() - parsed.ts > TICKET_TTL_MS) {
      sessionStorage.removeItem(TICKET_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/** Ticket must exist, be unexpired and match the amount carried in the URL. */
export const hasValidFlowTicket = (amount: number, route: PaymentFlowRoute): boolean => {
  const ticket = readFlowTicket();
  if (!ticket) return false;
  if (ticket.route !== route) return false;
  if (amount > 0 && ticket.amount > 0 && ticket.amount !== amount) return false;
  return true;
};

export const clearFlowTicket = () => {
  try {
    sessionStorage.removeItem(TICKET_KEY);
  } catch {
    /* ignore */
  }
};
