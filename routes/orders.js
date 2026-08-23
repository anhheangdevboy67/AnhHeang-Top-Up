const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { getPackage } = require('../games');
const { createOrder, getOrder } = require('../lib/db');
const { createKhqrPurchase } = require('../lib/payway');

// POST /api/orders — create an order + KHQR payment request
router.post('/', async (req, res) => {
  try {
    const { gameId, packageId, playerId, zoneId } = req.body;

    if (!gameId || !packageId || !playerId) {
      return res.status(400).json({ error: 'gameId, packageId and playerId are required.' });
    }

    // Always resolve price server-side. Never trust an amount from the client.
    const resolved = getPackage(gameId, packageId);
    if (!resolved) {
      return res.status(400).json({ error: 'Unknown game or package.' });
    }
    const { game, pkg } = resolved;

    if (game.needsZone && !zoneId) {
      return res.status(400).json({ error: 'zoneId is required for this game.' });
    }

    const tranId = 'NV' + crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 16);

    let paywayResponse;
    try {
      paywayResponse = await createKhqrPurchase({
        tranId,
        amount: pkg.amount,
        currency: 'USD',
        itemName: `${game.name} — ${pkg.label}`,
      });
    } catch (err) {
      console.error('PayWay purchase failed:', err.response?.data || err.message);
      return res.status(502).json({ error: 'Payment provider error. Please try again.' });
    }

    if (paywayResponse?.status?.code !== '00' && paywayResponse?.status?.code !== 0) {
      return res.status(402).json({ error: paywayResponse?.status?.message || 'Payment request rejected.' });
    }

    console.log('PayWay purchase response for', tranId, JSON.stringify(paywayResponse));

    createOrder({
      tran_id: tranId,
      game_id: gameId,
      package_id: packageId,
      amount: pkg.amount,
      currency: 'USD',
      player_id: playerId,
      zone_id: zoneId || null,
      status: 'PENDING',
      payway_raw_response: JSON.stringify(paywayResponse),
    });

    res.json({
      tranId,
      amount: pkg.amount,
      currency: 'USD',
      qrString: paywayResponse.qr_string,
      checkoutQrUrl: paywayResponse.checkout_qr_url,
      abapayDeeplink: paywayResponse.abapay_deeplink,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// GET /api/orders/:tranId — poll for payment/fulfillment status
router.get('/:tranId', (req, res) => {
  const order = getOrder(req.params.tranId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({
    tranId: order.tran_id,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    gameId: order.game_id,
    packageId: order.package_id,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
});

// GET /api/orders/:tranId/cancelled — PayWay cancel_url redirect target
router.get('/:tranId/cancelled', (req, res) => {
  const feUrl = process.env.FRONTEND_URL || '/';
  res.redirect(`${feUrl}?order=${req.params.tranId}&status=cancelled`);
});

module.exports = router;
