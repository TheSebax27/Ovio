-- Allow users to insert their own profile (fallback if trigger fails)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
