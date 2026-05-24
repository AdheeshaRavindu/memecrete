DROP TABLE IF EXISTS generation_votes;
DROP TABLE IF EXISTS template_stats;
DROP TABLE IF EXISTS meme_generations;

CREATE TABLE meme_generations (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  prompt_style TEXT NOT NULL,
  caption TEXT NOT NULL,
  x_post TEXT NOT NULL,
  text_json TEXT NOT NULL,
  joke_fingerprint TEXT NOT NULL,
  meme_url TEXT NOT NULL,
  crypto_context TEXT NOT NULL,
  concrete_context TEXT NOT NULL,
  emotion TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_meme_generations_created_at ON meme_generations(created_at DESC);
CREATE INDEX idx_meme_generations_template_id ON meme_generations(template_id, created_at DESC);
CREATE INDEX idx_meme_generations_joke_fingerprint ON meme_generations(joke_fingerprint, created_at DESC);
