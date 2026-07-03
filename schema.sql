-- ============================================================
-- Run this once in Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  file_path text,
  created_at timestamptz not null default now()
);

alter table records enable row level security;

-- Anyone (including anonymous visitors) can read entries
create policy "Public can read records"
on records for select
to anon, authenticated
using (true);

-- Only signed-in users (your admin account) can add/edit/delete
create policy "Authenticated can insert records"
on records for insert
to authenticated
with check (true);

create policy "Authenticated can update records"
on records for update
to authenticated
using (true);

create policy "Authenticated can delete records"
on records for delete
to authenticated
using (true);

-- ============================================================
-- Storage: after running this, also create a bucket named
-- "files" via the Storage tab (see README.md, Step 3).
-- These policies make that bucket work the same way:
-- public read, authenticated-only write.
-- ============================================================

create policy "Public can read files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'files');

create policy "Authenticated can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'files');

create policy "Authenticated can update files"
on storage.objects for update
to authenticated
using (bucket_id = 'files');

create policy "Authenticated can delete files"
on storage.objects for delete
to authenticated
using (bucket_id = 'files');
