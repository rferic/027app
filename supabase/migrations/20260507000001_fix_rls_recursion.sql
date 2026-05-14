-- Fix infinite recursion in group_members RLS policies.
--
-- The original "group_members: member read" policy used a self-referential
-- EXISTS subquery, causing PostgreSQL to recurse infinitely when evaluating it.
-- All other policies that query group_members as a subquery also triggered
-- this recursion indirectly.
--
-- Fix: simplify "group_members: member read" to a direct self-read predicate
-- (user_id = auth.uid()). This is sufficient because:
--   - Regular users only need to read their own membership row.
--   - All admin-level reads use the service role client (bypasses RLS).
--   - All other policies that subquery group_members filter by user_id =
--     auth.uid(), so the simplified policy still returns the correct rows.

drop policy "group_members: member read" on public.group_members;

create policy "group_members: member read"
  on public.group_members for select
  using (user_id = auth.uid());
