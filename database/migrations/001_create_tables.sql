-- Schema for the baby shower quiz.
-- The quiz questions themselves are NOT stored here: they are defined in
-- lib/quiz.ts and denormalized into responses.question_text on submit, so a
-- question can be reworded later without rewriting past answers.

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  -- Accent- and case-folded form of name, produced by normalizeParticipantName
  -- in lib/quiz.ts. This is what enforces "one guess per person".
  name_key VARCHAR(255) NOT NULL UNIQUE,
  relationship VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  question_key VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses (participant_id);
