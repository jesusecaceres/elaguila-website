/** Prefix for all Tienda order assets in Blob storage. */
export function tiendaOrderBlobPrefix(orderId: string): string {
  return `tienda/orders/${orderId}`;
}

export function assertTiendaOrderId(orderId: string): boolean {
  return /^LX-TND-[A-Z0-9]+-[A-F0-9]{8}$/i.test(orderId.trim());
}
