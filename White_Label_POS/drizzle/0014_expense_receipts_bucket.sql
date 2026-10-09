INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;
