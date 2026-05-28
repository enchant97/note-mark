package db

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
)

// Regression for the slug path-traversal sibling of GHSA-g49p-4qxj-88v3.
//
// huma applies `pattern` tags UNANCHORED (regexp.MatchString), so the old
// `pattern:"[a-z0-9-]+"` accepted any string merely CONTAINING a [a-z0-9-]
// substring — including `../../../../tmp/escape`. The migrate-export CLI then
// joined the stored slug into the output path, escaping the export directory.
// The fix anchors the patterns with ^...$. This test asserts a traversal slug
// is rejected while a legitimate slug is accepted.
func TestCreateBookSlugRejectsPathTraversal(t *testing.T) {
	type createBookInput struct {
		Body CreateBook
	}

	mux := http.NewServeMux()
	api := humago.New(mux, huma.DefaultConfig("test", "1.0.0"))
	huma.Register(api, huma.Operation{
		OperationID: "create-book",
		Method:      http.MethodPost,
		Path:        "/api/books",
	}, func(_ context.Context, _ *createBookInput) (*struct{}, error) {
		return &struct{}{}, nil
	})

	cases := []struct {
		name       string
		slug       string
		wantReject bool
	}{
		{"traversal", "../../../../../../tmp/escape", true},
		{"slash", "a/b", true},
		{"dot", "a.b", true},
		{"leading-dotdot", "..", true},
		{"valid", "my-note-1", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := `{"name":"x","slug":"` + tc.slug + `"}`
			req := httptest.NewRequest(http.MethodPost, "/api/books", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			// A valid slug is accepted (2xx); any invalid slug is rejected
			// with a non-2xx (huma returns 422 for pattern violations, 400
			// for malformed JSON such as bare backslashes).
			rejected := rec.Code < 200 || rec.Code > 299
			if rejected != tc.wantReject {
				t.Fatalf("slug %q: status=%d rejected=%v, want rejected=%v",
					tc.slug, rec.Code, rejected, tc.wantReject)
			}
		})
	}
}
