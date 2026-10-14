-- Fix storage exposure: drop the broad SELECT policy on book-files.
-- All reads of paid book files go through the get-book-file-url edge function
-- (service role, purchase/admin checked server-side, short-lived signed URLs),
-- so no client-facing SELECT policy is needed on this private bucket.
DROP POLICY IF EXISTS "Secure book file access" ON storage.objects;