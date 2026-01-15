-- name: InsertTreeCache :exec
INSERT INTO tree_cache (owner_uid, cache, cache_version)
VALUES ((SELECT uid FROM users WHERE username=?),?,?);

-- name: GetTreeCacheEntry :one
SELECT * FROM tree_cache WHERE owner_uid = (SELECT uid FROM users WHERE username=?) LIMIT 1;

-- name: GetTreeCacheUpdatedAt :one
SELECT updated_at FROM tree_cache WHERE owner_uid = (SELECT uid FROM users WHERE username=?) LIMIT 1;

-- name: UpdateTreeCacheEntry :exec
UPDATE tree_cache
SET cache=?, cache_version=?, updated_at=CURRENT_TIMESTAMP
WHERE owner_uid = (SELECT uid FROM users WHERE username=?);

-- name: DeleteTreeCacheEntries :exec
DELETE FROM tree_cache;

-- name: DeleteTreeCacheEntry :exec
DELETE FROM tree_cache WHERE owner_uid = (SELECT uid FROM users WHERE username=?);
