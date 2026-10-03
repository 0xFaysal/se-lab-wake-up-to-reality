-- Preserve immutable legacy entries and neutralize premature revenue recognition
-- with a balanced, auditable correction transaction.
CREATE TEMP TABLE IF NOT EXISTS legacy_booking_payment_repair AS
SELECT
  lt.id AS legacy_transaction_id,
  lt.reference_id AS payment_id,
  gen_random_uuid() AS correction_transaction_id
FROM ledger_transactions lt
WHERE lt.reference_type = 'BOOKING_PAYMENT'
  AND lt.reference_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM ledger_transactions correction
    WHERE correction.reference_type = 'LEGACY_BOOKING_PAYMENT_CORRECTION'
      AND correction.reference_id = lt.reference_id
  );

INSERT INTO ledger_transactions (
  id, reference_type, reference_id, description, actor_user_id, created_at
)
SELECT
  repair.correction_transaction_id,
  'LEGACY_BOOKING_PAYMENT_CORRECTION',
  repair.payment_id,
  CONCAT('Accounting correction for legacy payment on booking ', booking.booking_code),
  legacy.actor_user_id,
  NOW()
FROM legacy_booking_payment_repair repair
JOIN ledger_transactions legacy ON legacy.id = repair.legacy_transaction_id
JOIN payments payment ON payment.id = repair.payment_id
JOIN bookings booking ON booking.id = payment.booking_id;

-- Reverse every premature credit exactly as originally posted.
INSERT INTO ledger_entries (
  id, ledger_transaction_id, wallet_account_id, account_code,
  entry_side, amount_paisa, created_at
)
SELECT
  gen_random_uuid(),
  repair.correction_transaction_id,
  entry.wallet_account_id,
  entry.account_code,
  'DEBIT'::ledger_entry_side,
  entry.amount_paisa,
  NOW()
FROM legacy_booking_payment_repair repair
JOIN ledger_entries entry ON entry.ledger_transaction_id = repair.legacy_transaction_id
WHERE entry.entry_side = 'CREDIT'
  AND entry.account_code IN (
    'CUSTOMER_DEPOSIT_LIABILITY',
    'PLATFORM_REVENUE',
    'PROVIDER_PAYABLE'
  );

-- The full payment should have remained held until cancellation or settlement.
INSERT INTO ledger_entries (
  id, ledger_transaction_id, wallet_account_id, account_code,
  entry_side, amount_paisa, created_at
)
SELECT
  gen_random_uuid(),
  repair.correction_transaction_id,
  NULL,
  'BOOKING_HELD_FUNDS',
  'CREDIT'::ledger_entry_side,
  SUM(entry.amount_paisa)::bigint,
  NOW()
FROM legacy_booking_payment_repair repair
JOIN ledger_entries entry ON entry.ledger_transaction_id = repair.legacy_transaction_id
WHERE entry.entry_side = 'CREDIT'
  AND entry.account_code IN (
    'CUSTOMER_DEPOSIT_LIABILITY',
    'PLATFORM_REVENUE',
    'PROVIDER_PAYABLE'
  )
GROUP BY repair.correction_transaction_id;

-- The old application also cached Provider income as pending at payment time.
WITH provider_reversal AS (
  SELECT
    entry.wallet_account_id,
    SUM(entry.amount_paisa)::bigint AS amount_paisa
  FROM legacy_booking_payment_repair repair
  JOIN ledger_entries entry ON entry.ledger_transaction_id = repair.legacy_transaction_id
  WHERE entry.account_code = 'PROVIDER_PAYABLE'
    AND entry.entry_side = 'CREDIT'
    AND entry.wallet_account_id IS NOT NULL
  GROUP BY entry.wallet_account_id
)
UPDATE wallet_accounts wallet
SET
  pending_balance_paisa = GREATEST(0, wallet.pending_balance_paisa - reversal.amount_paisa),
  balance_version = wallet.balance_version + 1,
  updated_at = NOW()
FROM provider_reversal reversal
WHERE wallet.id = reversal.wallet_account_id;

DROP TABLE IF EXISTS legacy_booking_payment_repair;
