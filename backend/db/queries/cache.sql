-- name: InsertTreeCache :exec
INSERT INTO tree_cache (owner_uid, node_tree)
VALUES ((SELECT uid FROM users WHERE username=?),?);

-- name: GetTreeCacheEntry :one
SELECT * FROM tree_cache WHERE owner_uid = (SELECT uid FROM users WHERE username=?) LIMIT 1;
