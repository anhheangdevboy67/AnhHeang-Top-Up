require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const ordersRouter = require('./routes/orders');
const webhookRouter = require('./routes/webhook');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/verify-player', require('./routes/verify'));

// Serve the frontend from the same origin as the API. Put index.html in a
// "public" folder next to server.js. This avoids file:// fetch() problems —
// open http://localhost:4000 instead of double-clicking index.html.
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Nova Top-Up backend running on :${PORT}`);
  if (!process.env.ABA_MERCHANT_ID || !process.env.ABA_API_KEY) {
    console.warn('⚠️  ABA_MERCHANT_ID / ABA_API_KEY not set — payment requests will fail. See .env.example');
  }
});
