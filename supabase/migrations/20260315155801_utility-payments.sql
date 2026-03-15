CREATE TABLE utility_payments (
  id           bigserial    PRIMARY KEY,
  apartment_id bigint       NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  period_start date         NOT NULL,
  period_end   date         NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, period_start)
);

CREATE INDEX utility_payments_apartment_id_idx ON utility_payments(apartment_id);

CREATE TABLE payment_line_items (
  id           bigserial       PRIMARY KEY,
  payment_id   bigint          NOT NULL REFERENCES utility_payments(id) ON DELETE CASCADE,
  tariff_name  text            NOT NULL,
  tariff_type  text            NOT NULL CONSTRAINT payment_line_items_type_check CHECK (tariff_type IN ('service', 'resource')),
  unit         text,
  quantity     numeric(10,3)   NOT NULL CONSTRAINT payment_line_items_quantity_check CHECK (quantity > 0),
  unit_price   numeric(10,2)   NOT NULL CONSTRAINT payment_line_items_price_check CHECK (unit_price >= 0),
  subtotal     numeric(12,2)   NOT NULL CONSTRAINT payment_line_items_subtotal_check CHECK (subtotal >= 0),
  created_at   timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX payment_line_items_payment_id_idx ON payment_line_items(payment_id);

ALTER TABLE utility_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage utility payments"
  ON utility_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE payment_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage payment line items"
  ON payment_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
