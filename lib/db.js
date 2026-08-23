const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'orders.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    tran_id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    package_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    player_id TEXT NOT NULL,
    zone_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',   -- PENDING | PAID | FULFILLED | FAILED | EXPIRED
    payway_raw_response TEXT,
    fulfillment_result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function createOrder(order) {
  db.prepare(`
    INSERT INTO orders (tran_id, game_id, package_id, amount, currency, player_id, zone_id, status, payway_raw_response)
    VALUES (@tran_id, @game_id, @package_id, @amount, @currency, @player_id, @zone_id, @status, @payway_raw_response)
  `).run(order);
}

function updateOrderStatus(tranId, status, extra = {}) {
  const fields = ['status = @status', "updated_at = datetime('now')"];
  const params = { tran_id: tranId, status };
  if (extra.fulfillment_result !== undefined) {
    fields.push('fulfillment_result = @fulfillment_result');
    params.fulfillment_result = JSON.stringify(extra.fulfillment_result);
  }
  db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE tran_id = @tran_id`).run(params);
}

function getOrder(tranId) {
  return db.prepare('SELECT * FROM orders WHERE tran_id = ?').get(tranId);
}

module.exports = { db, createOrder, updateOrderStatus, getOrder };
