-- ============================================================
-- Chat System Migration
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Project denials – tracks who has been denied from which project
CREATE TABLE IF NOT EXISTS project_denials (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  denied_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  denied_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  denied_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, denied_user_id)
);

-- 2. Chats – one conversation per project + pair of users
CREATE TABLE IF NOT EXISTS chats (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_title   TEXT,
  participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Messages
CREATE TABLE IF NOT EXISTS messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read       BOOLEAN DEFAULT FALSE
);

-- 4. Add reference_id to notifications (stores chat_id for 'approved' notifications)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;

-- 5. Enable Realtime on messages so the chat page gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
