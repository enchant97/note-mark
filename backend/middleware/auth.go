package middleware

import (
	"context"
	"errors"
	"log"
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
	dao       *db.DAO
	jwtSecret []byte
	usesHTTPS bool
}

func (p AuthDetailsProvider) New(
	api huma.API,
	dao *db.DAO,
	jwtSecret []byte,
	usesHTTPS bool,
) AuthDetailsProvider {
	return AuthDetailsProvider{
		api:       api,
		dao:       dao,
		jwtSecret: jwtSecret,
		usesHTTPS: usesHTTPS,
	}
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
		// process chosen token
		if user, err := core.ParseAuthenticationToken(authValue, p.jwtSecret); err != nil {
			// token could not be parsed
			if cookieErr == nil {
				p.clearSessionCookie(ctx)
			}
			huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "invalid authentication token given")
			return
		} else {
			// token parsed, now validate user is still valid
			// TODO add in-memory caching to this query with ttl
			if _, err := p.dao.Queries.GetUserByUid(context.Background(), user.UserUID); err != nil {
				if errors.Is(core.WrapDbError(err), core.ErrNotFound) {
					if cookieErr == nil {
						p.clearSessionCookie(ctx)
					}
					huma.WriteErr(p.api, ctx, http.StatusUnauthorized, "invalid authentication token given")
				} else {
					log.Panicln(err)
				}
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

func (p *AuthDetailsProvider) getEmptyAuthCooke() http.Cookie {
	return http.Cookie{
		HttpOnly: true,
		Secure:   p.usesHTTPS,
		Name:     AuthSessionTokenCookieName,
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
	}
}

func (p *AuthDetailsProvider) clearSessionCookie(ctx huma.Context) {
	cookie := p.CreateClearSessionCookie()
	ctx.AppendHeader("Set-Cookie", cookie.String())
}

func (p *AuthDetailsProvider) CreateSessionCookie(token core.AccessToken) http.Cookie {
	cookie := p.getEmptyAuthCooke()
	cookie.Value = token.AccessToken
	cookie.MaxAge = int(token.ExpiresIn)
	return cookie
}

func (p *AuthDetailsProvider) CreateClearSessionCookie() http.Cookie {
	cookie := p.getEmptyAuthCooke()
	cookie.Value = ""
	cookie.MaxAge = 0
	return cookie
}
