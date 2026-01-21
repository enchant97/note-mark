-- name: InsertUser :one
INSERT INTO users (uid, username) VALUES (?,?)
RETURNING uid;

-- name: InsertUserWithPassword :one
INSERT INTO users (uid, username, password_hash) VALUES (?,?,?)
RETURNING uid;

-- name: InsertOidcUserMapping :exec
INSERT INTO oidc_users (user_uid, user_sub, provider_name) VALUES((SELECT uid FROM users WHERE username=?), ?, ?);

-- name: GetUserByUsername :one
SELECT (uid,created_at,updated_at,username,name) FROM users WHERE username = ? AND deleted_at IS NOT NULL LIMIT 1;

-- name: GetUserByUid :one
SELECT (uid,created_at,updated_at,username,name) FROM users WHERE uid = ? AND deleted_at IS NOT NULL LIMIT 1;

-- name: GetUsernamesLike :many
SELECT username FROM users WHERE username LIKE ? AND deleted_at IS NOT NULL LIMIT 6;

-- name: GetUserPassword :one
SELECT uid,password_hash FROM users where username = ? AND deleted_at IS NOT NULL LIMIT 1;

-- name: GetOidcUserUid :one
SELECT user_uid
FROM oidc_users
INNER JOIN users as u ON u.uid = user_uid
WHERE user_sub = ? AND provider_name = ? AND u.deleted_at IS NOT NULL
LIMIT 1;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = ?, updated_at=CURRENT_TIMESTAMP WHERE uid = ?;

-- name: UpdateUserPasswordByUsername :exec
UPDATE users SET password_hash = ?, updated_at=CURRENT_TIMESTAMP WHERE username = ?;

-- name: UpdateUser :exec
UPDATE users SET name = ?, updated_at=CURRENT_TIMESTAMP WHERE uid = ?;

-- name: MarkUserAsDeleted :exec
UPDATE users SET deleted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE uid = ?;

-- name: MarkUserAsDeletedByUsername :exec
UPDATE users SET deleted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE username = ?;

-- name: AdminDeleteUserByUsername :exec
DELETE FROM users WHERE username = ?;

-- name: AdminRemoveUserPassword :exec
UPDATE users SET password_hash = NULL WHERE username = ?;
