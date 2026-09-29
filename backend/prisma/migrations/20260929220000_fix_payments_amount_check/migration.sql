-- Allow payments with 0 gateway charge when funded 100% by internal wallet / refund balance
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_amount_check";
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount_paisa" >= 0);
