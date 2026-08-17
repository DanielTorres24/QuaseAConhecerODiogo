INSERT INTO questions (prompt, answer_key, metadata)
VALUES
  ('Qual é o nome do bebé?', 'Diogo', '{"category": "identity"}'),
  ('Qual é a data prevista de nascimento?', 'agosto', '{"category": "date"}'),
  ('Qual é a comida favorita da família?', 'massa', '{"category": "food"}')
ON CONFLICT (prompt) DO NOTHING;
