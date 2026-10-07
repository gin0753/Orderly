-- Preserve every existing order number. Sequence values are deliberately not
-- transactional, so failed checkouts can leave gaps but concurrent API replicas
-- cannot allocate the same number.
CREATE SEQUENCE "Order_orderNumber_seq" AS BIGINT START WITH 10001;

DO $$
DECLARE
  latest_number NUMERIC;
BEGIN
  SELECT GREATEST(COALESCE(MAX("orderNumber"::NUMERIC), 10000), 10000)
    INTO latest_number
    FROM "Order"
   WHERE "orderNumber" ~ '^[0-9]+$';

  IF latest_number >= 9223372036854775807 THEN
    RAISE EXCEPTION 'Existing order number exceeds PostgreSQL sequence range';
  END IF;

  PERFORM setval('"Order_orderNumber_seq"', latest_number::BIGINT, true);
END $$;
