/** Provider-neutral contract. No WhatsApp API or AI provider is connected. */
export type SalesContext = {
  productId: string;
  checkoutUrl: string;
  customerConsent: boolean;
};
export interface WhatsAppSalesAdapter {
  sendDesigns(
    phone: string,
    context: SalesContext,
  ): Promise<{ providerMessageId: string }>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}
export const whatsappAutomationStatus = {
  connected: false,
  provider: null,
} as const;
export function checkoutLink(site: string, productId: string) {
  return new URL(`/checkout/${encodeURIComponent(productId)}`, site).toString();
}
