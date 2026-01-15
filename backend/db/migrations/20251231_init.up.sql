CREATE TABLE users (
  uid BLOB PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  username TEXT NOT NULL,
  password_hash BLOB,
  name TEXT
);

CREATE UNIQUE INDEX idx_users_username ON users(username);

CREATE TABLE oidc_users (
  id INTEGER PRIMARY KEY,
  user_uid BLOB NOT NULL,
  user_sub TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_oidc_user ON oidc_users(user_uid, provider_name);

CREATE UNIQUE INDEX idx_oidc_provider ON oidc_users(user_sub, provider_name);

CREATE TABLE tree_cache (
  owner_uid BLOB PRIMARY KEY,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cache BLOB NOT NULL,
  cache_version INTEGER NOT NULL,
  FOREIGN KEY (owner_uid) REFERENCES users(uid) ON DELETE CASCADE
);
