CREATE TABLE IF NOT EXISTS showcase_posts (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  image_key   TEXT    NOT NULL,
  caption     TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  post_type   TEXT    NOT NULL DEFAULT 'image',
  livery_key  TEXT
);

CREATE TABLE IF NOT EXISTS showcase_comments (
  id          TEXT    PRIMARY KEY,
  post_id     TEXT    NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  body        TEXT    NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id     TEXT    NOT NULL,
  user_id     TEXT    NOT NULL,
  username    TEXT    NOT NULL,
  avatar      TEXT,
  value       INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_views (
  id          TEXT    PRIMARY KEY,
  post_id     TEXT    NOT NULL,
  user_id     TEXT,
  username    TEXT,
  avatar      TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON showcase_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON showcase_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_views_post    ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post    ON post_likes(post_id);
