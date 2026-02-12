-- Alter table to make content nullable
alter table messages alter column content drop not null;

-- Enable RLS
alter table messages enable row level security;

-- Create policies
create policy "Users can view messages they sent or received" on messages
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can insert their own messages" on messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can update their own messages" on messages
  for update using (auth.uid() = sender_id);