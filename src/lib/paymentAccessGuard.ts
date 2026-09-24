import type { PaymentFlowRoute } from "@/lib/flowTicket";

/**
 * Access is enforced server-side by FlowTokenGate (token validated, unexpired,
 * unused, browser-bound and platform-bound) before any payment page renders.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const usePaymentAccessGuard = (_route: PaymentFlowRoute) => {};
