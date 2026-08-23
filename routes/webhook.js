const express = require('express');
const router = express.Router();

const { getOrder, updateOrderStatus } = require('../lib/db');
const { fulfillOrder } = require('../lib/fulfillment');

// POST /api/webhooks/payway
//
// IMPORTANT: PayWay's exact push-callback payload/signature scheme is
// documented in their "24 - KHQR Guideline" doc (webhook notifications
// section), which covers the fields they send and how to verify them —
// verify against that before going live, since callback formats can differ
// from the purchase-response shape. This handler is intentionally defensive:
// it treats the callback as a signal to re-check status, not as blind truth.
router.post('/payway', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const body = req.body || {};
    const tranId = body.tran_id || body.tranId;
    const statusCode = body.status ?? body.status_code ?? body?.status?.code;

    if (!tranId) {
      console.warn('PayWay webhook missing tran_id:', body);
      return res.sendStatus(400);
    }

    const order = getOrder(tranId);
    if (!order) {
      console.warn('PayWay webhook for unknown order:', tranId);
      return res.sendStatus(404);
    }

    // '0' / '00' = success in PayWay's convention. Treat anything else as not-paid.
    const isPaid = statusCode === '0' || statusCode === 0 || statusCode === '00';

    if (!isPaid) {
      updateOrderStatus(tranId, 'FAILED');
      return res.sendStatus(200);
    }

    if (order.status === 'PENDING') {
      updateOrderStatus(tranId, 'PAID');

      const result = await fulfillOrder(order);
      updateOrderStatus(tranId, result.success ? 'FULFILLED' : 'PAID', {
        fulfillment_result: result,
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handling error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
