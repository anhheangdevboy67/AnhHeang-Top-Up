# Nova Top-Up — Backend

Real order + payment backend using **ABA PayWay (KHQR)**. Node.js + Express + SQLite.

## What's actually wired up

- `POST /api/orders` — validates the game/package **server-side** (price never trusted
  from the browser), creates a KHQR payment request with ABA PayWay, stores the order,
  and returns a QR code the customer scans.
- `GET /api/orders/:tranId` — poll this to check if an order is `PENDING` / `PAID` /
  `FULFILLED` / `FAILED`.
- `POST /api/webhooks/payway` — receives ABA's payment confirmation and marks the order
  paid, then calls the fulfillment stub.
- `lib/fulfillment.js` — **not implemented**. This is where diamonds actually get sent
  to the player, and it requires a real business relationship with a game-credit
  supplier/reseller. See the comment in that file.

## 1. Get ABA PayWay sandbox credentials

1. Register at https://developer.payway.com.kh/
2. You'll receive a **sandbox merchant ID** and **API key** by email.
3. Copy `.env.example` to `.env` and fill them in.

```
cp .env.example .env
```

## 2. Install & run

```
npm install
npm start
```

Server starts on `http://localhost:4000` (or whatever `PORT` you set).

`PUBLIC_BASE_URL` in `.env` must be a URL PayWay can actually reach — so for local
testing you'll need a tunnel (e.g. `ngrok http 4000`) and put that URL in `.env`,
since ABA's servers need to call your `/api/webhooks/payway` endpoint over the internet.

## 3. Point the frontend at it

In `index.html`, set:

```js
const API_BASE = 'http://localhost:4000'; // or your deployed backend URL
```

(see the `API_BASE` constant near the top of the `<script>` block)

## 4. Test a payment

Use PayWay's sandbox — it gives you test KHQR flows that don't move real money.
Once an order shows `PAID` in `GET /api/orders/:tranId`, `fulfillment_result` will show
`NO_SUPPLIER_CONFIGURED` until you wire up a real supplier in `lib/fulfillment.js`.

## 5. Going to production

1. Sign a merchant agreement with ABA Bank to get **production** credentials.
2. Switch `ABA_BASE_URL` to `https://checkout.payway.com.kh`.
3. Sign up with a game-credit supplier/reseller and implement `lib/fulfillment.js`.
4. Deploy this backend somewhere persistent (Railway, Render, a VPS, etc.) — it can't
   run inside a chat sandbox.
5. Before going live, re-check the webhook payload against ABA's own **"KHQR
   Guideline"** doc (covers their webhook notification format/signature) — I built
   `routes/webhook.js` defensively but you should confirm the exact field names against
   your live sandbox responses first.

## Database

SQLite file at `data/orders.db`, created automatically on first run. Fine for low-to-
medium volume; swap `lib/db.js` for Postgres/MySQL if you outgrow it.
