CREATE TABLE IF NOT EXISTS users (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id    BIGINT      NOT NULL UNIQUE,
    login        TEXT        NOT NULL,
    name         TEXT,
    avatar_url   TEXT,
    access_token TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watched_repos (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id BIGINT      NOT NULL,
    full_name      TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, github_repo_id)
);

CREATE INDEX IF NOT EXISTS watched_repos_user_idx ON watched_repos(user_id);
CREATE INDEX IF NOT EXISTS watched_repos_full_name_idx ON watched_repos(full_name);

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS diff_text_cache TEXT;
