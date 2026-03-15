-- Tariffs table
CREATE TABLE tariffs (
  id           bigserial      PRIMARY KEY,
  apartment_id bigint         NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  name         text           NOT NULL,
  type         text           NOT NULL
                 CONSTRAINT tariffs_type_check
                 CHECK (type IN ('service', 'resource')),
  price        numeric(10,2)  NOT NULL
                 CONSTRAINT tariffs_price_check
                 CHECK (price >= 0),
  unit         text,
  created_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX tariffs_apartment_id_idx ON tariffs(apartment_id);

-- Row Level Security
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tariffs"
  ON tariffs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
