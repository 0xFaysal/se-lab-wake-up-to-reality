BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- This amount was confirmed by the owner as a demo opening balance, not cash.
-- Preserve the wallet and account for the missing opening entry separately.
DO $$
DECLARE
  target_wallet UUID := 'cf12ca9d-ab26-44be-bd4c-754d9dedade1';
  correction_id UUID;
  difference BIGINT;
BEGIN
  PERFORM 1 FROM wallet_accounts WHERE id = target_wallet FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM ledger_transactions
    WHERE reference_type = 'DEMO_OPENING_BALANCE' AND reference_id = target_wallet)
  THEN RETURN; END IF;

  SELECT w.available_balance_paisa + w.pending_balance_paisa + w.held_balance_paisa
    - COALESCE((SELECT SUM(CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_paisa
      ELSE -e.amount_paisa END) FROM ledger_entries e WHERE e.wallet_account_id = w.id), 0)
  INTO difference FROM wallet_accounts w WHERE w.id = target_wallet;
  IF difference <> 40000 THEN
    RAISE EXCEPTION 'Demo opening difference changed; manual reconciliation required';
  END IF;

  correction_id := gen_random_uuid();
  INSERT INTO ledger_transactions (id, reference_type, reference_id, description, created_at)
  VALUES (correction_id, 'DEMO_OPENING_BALANCE', target_wallet,
    'Owner-confirmed legacy BDT 400 demo opening balance; no gateway funds or platform revenue', NOW());
  INSERT INTO ledger_entries
    (id, ledger_transaction_id, wallet_account_id, account_code, entry_side, amount_paisa, created_at)
  VALUES
    (gen_random_uuid(), correction_id, NULL, 'DEMO_OPENING_BALANCE_OFFSET', 'DEBIT', 40000, NOW()),
    (gen_random_uuid(), correction_id, target_wallet, 'DRIVER_REFUND_LIABILITY', 'CREDIT', 40000, NOW());
END $$;

-- The old application credited these settlements directly to available.
-- Only acknowledge a release when both its ledger credit and wallet match.
UPDATE booking_settlements s SET provider_released_at = s.completed_at
FROM bookings b, wallet_accounts w
WHERE b.id = s.booking_id AND w.id = b.settlement_wallet_account_id
  AND s.status = 'COMPLETED' AND s.provider_released_at IS NULL
  AND s.completed_at < TIMESTAMPTZ '2026-10-03 00:45:28+00'
  AND w.pending_balance_paisa = 0
  AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.booking_id = b.id
    AND d.status IN ('OPEN', 'UNDER_REVIEW'))
  AND EXISTS (SELECT 1 FROM ledger_transactions t JOIN ledger_entries e
    ON e.ledger_transaction_id = t.id
    WHERE t.reference_type = 'BOOKING_SETTLEMENT' AND t.reference_id = s.id
      AND e.account_code = 'PROVIDER_PAYABLE' AND e.entry_side = 'CREDIT'
      AND e.wallet_account_id = w.id AND e.amount_paisa = s.provider_net_paisa)
  AND w.available_balance_paisa + w.held_balance_paisa =
    (SELECT SUM(CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_paisa ELSE -e.amount_paisa END)
      FROM ledger_entries e WHERE e.wallet_account_id = w.id);

COMMIT;
