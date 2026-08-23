// ============================================================================
// FULFILLMENT — the piece that actually delivers diamonds to the player.
//
// This is a STUB. There is no public API from Garena (Free Fire) or Moonton
// (Mobile Legends) for third parties to credit diamonds directly. Real
// top-up stores buy credit stock from a reseller/distributor and call
// *their* API here — that requires signing up with a supplier as a business,
// not something that can be faked or reverse-engineered.
//
// Once you have a supplier account, replace the body of fulfillOrder()
// with a real call, e.g.:
//
//   const { data } = await axios.post(`${process.env.SUPPLIER_API_URL}/topup`, {
//     sku: mapToSupplierSku(order.game_id, order.package_id),
//     player_id: order.player_id,
//     zone_id: order.zone_id,
//   }, { headers: { Authorization: `Bearer ${process.env.SUPPLIER_API_KEY}` } });
//
// and return { success: true, supplierRef: data.id } (or false + reason).
// ============================================================================

async function fulfillOrder(order) {
  if (!process.env.SUPPLIER_API_URL) {
    // No supplier configured yet — order stays PAID but not FULFILLED.
    // Surface this to an admin (dashboard, Telegram bot, email — your call)
    // so a human can deliver the credits manually in the meantime.
    return {
      success: false,
      reason: 'NO_SUPPLIER_CONFIGURED',
      message: 'Payment succeeded but no fulfillment supplier is wired up yet. Deliver manually.',
    };
  }

  // TODO: replace with your real supplier call once you have one.
  throw new Error('Supplier integration not implemented yet.');
}

module.exports = { fulfillOrder };
