CREATE TABLE IF NOT EXISTS bookings (
  order_number TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  start_time_local TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_start_time_local
  ON bookings(start_time_local);
