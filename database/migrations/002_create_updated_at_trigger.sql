CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS players_set_updated_at ON players;

CREATE TRIGGER players_set_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
