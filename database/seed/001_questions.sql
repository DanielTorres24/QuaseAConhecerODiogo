-- No reference data to seed.
--
-- The quiz content lives in lib/quiz.ts and is written into `responses` at
-- submit time, so there is no questions table to populate. This file is kept
-- as a no-op because database/seed.js reads every .sql in this directory and
-- would fail on a missing directory (an empty one cannot be tracked by git),
-- and `npm run seed` runs as part of the Render build.

SELECT 1;
