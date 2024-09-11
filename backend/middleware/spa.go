package middleware

import (
	"net/http"
	"strings"
)

type intercept404 struct {
	http.ResponseWriter
	statusCode int
}

func (w *intercept404) Write(b []byte) (int, error) {
	if w.statusCode == http.StatusNotFound {
		return len(b), nil
	}
	if w.statusCode != 0 {
		w.WriteHeader(w.statusCode)
	}
	return w.ResponseWriter.Write(b)
}

func (w *intercept404) WriteHeader(statusCode int) {
	if statusCode >= 300 && statusCode < 400 {
		w.ResponseWriter.WriteHeader(statusCode)
		return
	}
	w.statusCode = statusCode
}

func SPAMiddleware(root http.FileSystem) func(http.ResponseWriter, *http.Request) {
	fs := http.FileServer(root)
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFoundHandler().ServeHTTP(w, r)
		} else {
			wt := &intercept404{ResponseWriter: w}
			fs.ServeHTTP(wt, r)
			if wt.statusCode == http.StatusNotFound {
				r.URL.Path = "/"
				w.Header().Set("Content-Type", "text/html")
				fs.ServeHTTP(w, r)
			}
		}
	}
}
