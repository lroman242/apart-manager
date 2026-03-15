ALTER TABLE payment_line_items
  ADD COLUMN meter_value_current numeric(10,3) CONSTRAINT payment_line_items_meter_current_check CHECK (meter_value_current >= 0);