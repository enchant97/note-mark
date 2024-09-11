package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
)

const AuthDetailsProviderContextKey = "AuthDetails"

type AuthDetailsProvider struct {
	api       huma.API
	jwtSecret []byte
}

func (p AuthDetailsProvider) New(api huma.API, jwtSecret []byte) AuthDetailsProvider {
	p = AuthDetailsProvider{
		api:       api,
		jwtSecret: jwtSecret,
	}
	return p
}

// Use as a global middleware to process and validate given authentication
func (p AuthDetailsProvider) ProviderMiddleware(ctx huma.Context, next func(huma.Context)) {
	authHeader := ctx.Header("Authorization")
	if len(authHeader) != 0 {
		authValue := strings.TrimPrefix(authHeader, "Bearer ")
		if user, err := core.ParseAuthenticationToken(authValue, p.jwtSecret); err != nil {
			huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "invalid authentication token given")
			return
		} else {
			if allowed, err := db.CanUserAuthenticate(user.UserID); err != nil {
				return
			} else if !allowed {
				huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "invalid authentication token given")
				return
			}
			ctx = huma.WithValue(ctx, AuthDetailsProviderContextKey, core.AuthenticationDetails{}.New(&user))
			next(ctx)
			return
		}
	}
	ctx = huma.WithValue(ctx, AuthDetailsProviderContextKey, core.AuthenticationDetails{}.New(nil))
	next(ctx)
}

// Ensure a specific route(s) has been given valid authentication
func (p AuthDetailsProvider) AuthRequiredMiddleware(ctx huma.Context, next func(huma.Context)) {
	if authDetails, ok := ctx.Context().Value(AuthDetailsProviderContextKey).(core.AuthenticationDetails); !ok {
		huma.WriteErr(p.api, ctx, http.StatusInternalServerError, "cannot currently process authentication")
		return
	} else {
		if !authDetails.IsAuthenticated() {
			ctx.SetHeader("WWW-Authenticate", "Bearer")
			huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "authentication is required but none was provided")
			return
		}
	}
	next(ctx)
}

// Try and get the current authentication details from a given context
func (p AuthDetailsProvider) TryGetAuthDetails(ctx context.Context) (core.AuthenticationDetails, bool) {
	v, ok := ctx.Value(AuthDetailsProviderContextKey).(core.AuthenticationDetails)
	return v, ok
}
