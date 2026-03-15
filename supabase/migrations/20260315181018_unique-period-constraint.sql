ALTER TABLE utility_payments
  DROP CONSTRAINT utility_payments_apartment_id_period_start_key,
  ADD CONSTRAINT utility_payments_apartment_id_period_key UNIQUE (apartment_id, period_start, period_end);
