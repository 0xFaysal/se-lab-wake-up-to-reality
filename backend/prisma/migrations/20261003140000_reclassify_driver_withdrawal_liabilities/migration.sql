BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  item RECORD;
  transaction_id UUID;
  source_count INTEGER;
  source_amount BIGINT;
BEGIN
  -- Correct the two inspected legacy Driver withdrawals without moving wallet funds.
  FOR item IN
    SELECT p.id, p.wallet_account_id, p.amount_paisa
    FROM public.payout_requests p
    JOIN public.wallet_accounts w ON w.id = p.wallet_account_id
    WHERE p.id IN (
      '4df76c5e-3c60-4c07-91af-e8fc57436c1b'::uuid,
      '603a16d3-a57d-46cb-9810-4ebeb8bab9f6'::uuid
    )
      AND p.status = 'PAID'
      AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = w.user_id AND r.role = 'DRIVER')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = w.user_id AND r.role = 'PROVIDER')
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.ledger_transactions t
      WHERE t.reference_type = 'PAYOUT_ACCOUNT_RECLASSIFICATION' AND t.reference_id = item.id
    ) THEN
      CONTINUE;
    END IF;

    PERFORM id FROM public.wallet_accounts WHERE id = item.wallet_account_id FOR UPDATE;
    SELECT COUNT(*), COALESCE(SUM(e.amount_paisa), 0)
    INTO source_count, source_amount
    FROM public.ledger_transactions t
    JOIN public.ledger_entries e ON e.ledger_transaction_id = t.id
    WHERE t.reference_type = 'PAYOUT' AND t.reference_id = item.id
      AND e.wallet_account_id = item.wallet_account_id
      AND e.account_code = 'PROVIDER_PAYABLE' AND e.entry_side = 'DEBIT';

    IF source_count <> 1 OR source_amount <> item.amount_paisa THEN
      RAISE EXCEPTION 'Legacy payout % does not match its inspected debit', item.id;
    END IF;

    transaction_id := gen_random_uuid();
    INSERT INTO public.ledger_transactions (id, reference_type, reference_id, description, created_at)
    VALUES (transaction_id, 'PAYOUT_ACCOUNT_RECLASSIFICATION', item.id,
      'Reclassify legacy Driver withdrawal from Provider payable to Driver refund liability; wallet unchanged', NOW());
    INSERT INTO public.ledger_entries
      (id, ledger_transaction_id, wallet_account_id, account_code, entry_side, amount_paisa, created_at)
    VALUES
      (gen_random_uuid(), transaction_id, item.wallet_account_id, 'PROVIDER_PAYABLE', 'CREDIT', item.amount_paisa, NOW()),
      (gen_random_uuid(), transaction_id, item.wallet_account_id, 'DRIVER_REFUND_LIABILITY', 'DEBIT', item.amount_paisa, NOW());
  END LOOP;
END $$;

COMMIT;
