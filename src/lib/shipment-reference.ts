/** Typical freight reference patterns: BCO-2024-441, FF-2026-0155, LAX-2024-332 */
export const SHIPMENT_REFERENCE_REGEX = /\b([A-Z]{2,4}-\d{4}-\d{3,})\b/g;

export function normalizeShipmentReference(ref: string): string {
  return ref.trim().toUpperCase();
}
