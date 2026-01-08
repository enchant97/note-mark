-- name: InsertUser :one
INSERT INTO users (uid, username) VALUES (?,?)
RETURNING uid;
