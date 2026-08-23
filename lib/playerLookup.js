// ============================================================================
// PLAYER ID VERIFICATION — looks up the in-game nickname for a player ID
// before checkout, so customers can confirm they typed the right ID
// (exactly what that reference screenshot shows: "User ID doesn't exist").
//
// This is a STUB, same situation as fulfillment.js: there's no public API
// from Garena or Moonton for this. Real top-up stores get this from the
// SAME supplier/reseller account used for delivery — most suppliers bundle
// a "check nickname" endpoint alongside their top-up endpoint.
//
// Once you have a supplier, replace the body of verifyPlayer() with a real
// call, e.g.:
//
//   const { data } = await axios.get(`${process.env.SUPPLIER_API_URL}/check-nickname`, {
//     params: { game: gameId, user_id: playerId, zone_id: zoneId },
//     headers: { Authorization: `Bearer ${process.env.SUPPLIER_API_KEY}` },
//   });
//   return { checked: true, valid: !!data.nickname, nickname: data.nickname };
// ============================================================================

async function verifyPlayer(gameId, playerId, zoneId) {
  if (!process.env.SUPPLIER_API_URL) {
    // No supplier configured — tell the frontend verification isn't available
    // yet, rather than falsely claiming the ID is valid OR blocking checkout.
    return { checked: false, reason: 'NO_SUPPLIER_CONFIGURED' };
  }

  // TODO: replace with your real supplier's nickname-lookup call.
  throw new Error('Supplier integration not implemented yet.');
}

module.exports = { verifyPlayer };
