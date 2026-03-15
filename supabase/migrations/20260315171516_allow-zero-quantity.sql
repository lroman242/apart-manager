ALTER TABLE payment_line_items
  DROP CONSTRAINT payment_line_items_quantity_check,
  ADD CONSTRAINT payment_line_items_quantity_check CHECK (quantity >= 0);
