-- Apartments table
CREATE TABLE apartments (
  id         bigserial    PRIMARY KEY,
  name       text         NOT NULL,
  address    text,
  status     text         NOT NULL DEFAULT 'active'
               CONSTRAINT apartments_status_check
               CHECK (status IN ('active', 'on_hold')),
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage apartments"
  ON apartments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
