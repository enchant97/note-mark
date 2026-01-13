package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
)

const (
	AuthDetailsProviderContextKey = "AuthDetails"
	AuthSessionTokenCookieName    = "Auth-Session-Token"
)

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

// Use as a global middleware to process and validate given authentication.
//
// Handles both Bearer token given in Authorization header or token given as Cookie.
func (p AuthDetailsProvider) ProviderMiddleware(ctx huma.Context, next func(huma.Context)) {
	authSessionTokenCookie, cookieErr := huma.ReadCookie(ctx, AuthSessionTokenCookieName)
	authHeader := ctx.Header("Authorization")
	if (cookieErr == nil && authSessionTokenCookie.Value != "") || len(authHeader) != 0 {
		var authValue string
		if len(authHeader) == 0 {
			authValue = authSessionTokenCookie.Value
		} else {
			authValue = strings.TrimPrefix(authHeader, "Bearer ")
		}
		if user, err := core.ParseAuthenticationToken(authValue, p.jwtSecret); err != nil {
			if cookieErr == nil {
				p.clearSessionCookie(ctx)
			}
			huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "invalid authentication token given")
			return
		} else {
			if allowed, err := db.CanUserAuthenticate(user.UserID); err != nil {
				return
			} else if !allowed {
				if cookieErr == nil {
					p.clearSessionCookie(ctx)
				}
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

func (p *AuthDetailsProvider) clearSessionCookie(ctx huma.Context) {
	// XXX make sure to enable secure if running on https
	cookie := http.Cookie{
		HttpOnly: true,
		Name:     AuthSessionTokenCookieName,
		Value:    "",
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
		MaxAge:   0,
	}
	ctx.AppendHeader("Set-Cookie", cookie.String())
}

func (p *AuthDetailsProvider) CreateSessionCookie(token core.AccessToken) http.Cookie {
	// XXX make sure to enable secure if running on https
	return http.Cookie{
		HttpOnly: true,
		Name:     AuthSessionTokenCookieName,
		Value:    token.AccessToken,
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(token.ExpiresIn),
	}
}

func (p *AuthDetailsProvider) CreateClearSessionCookie() http.Cookie {
	// XXX make sure to enable secure if running on https
	return http.Cookie{
		HttpOnly: true,
		Name:     AuthSessionTokenCookieName,
		Value:    "",
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
		MaxAge:   0,
	}
}
