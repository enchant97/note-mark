package services

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/tree"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

type AuthService struct {
	appConfig    config.AppConfig
	dao          *db.DAO
	tc           *tree.TreeController
	OidcProvider *oidc.Provider
	OidcVerifier *oidc.IDTokenVerifier
}

func (s AuthService) New(
	appConfig config.AppConfig,
	dao *db.DAO,
	tc *tree.TreeController,
) AuthService {
	var oidcProvider *oidc.Provider
	var oidcVerifier *oidc.IDTokenVerifier
	if appConfig.OIDC != nil {
		p, err := oidc.NewProvider(context.Background(), appConfig.OIDC.IssuerUrl)
		if err != nil {
			log.Fatal(err)
		}
		oidcProvider = p
		oidcVerifier = p.Verifier(&oidc.Config{ClientID: appConfig.OIDC.ClientID})
	}
	return AuthService{
		appConfig:    appConfig,
		dao:          dao,
		tc:           tc,
		OidcProvider: oidcProvider,
		OidcVerifier: oidcVerifier,
	}
}

func (s *AuthService) CreateAccessToken(request core.AccessTokenRequest) (core.AccessToken, error) {
	var userUid uuid.UUID
	var err error
	if request.GrantType == "password" {
		userUid, err = s.getUserForPasswordGrant(*request.PasswordGrant)
	} else {
		userUid, err = s.getUserForTokenExchangeGrant(*request.TokenExchangeGrant)
	}
	if err != nil {
		return core.AccessToken{}, err
	}
	authenticationData := core.AuthenticatedUser{
		UserUID: userUid,
	}
	if token, err := core.CreateAuthenticationToken(
		authenticationData,
		s.appConfig.AuthToken.Secret,
		time.Duration(int64(time.Second)*s.appConfig.AuthToken.Expiry),
	); err != nil {
		return core.AccessToken{}, err
	} else {
		return token, nil
	}
}

func (s *AuthService) GetUserInfoByUsername(username string) (core.UserInfoResponse, error) {
	user, err := core.WrapDbErrorWithValue(s.dao.Queries.GetUserByUsername(context.Background(), username))
	if err != nil {
		return core.UserInfoResponse{}, err
	}
	return core.UserInfoResponse{
		Sub:               user.Uid.String(),
		PreferredUsername: user.Username,
		Name:              core.NullStringToStringPtr(user.Name),
	}, nil
}

func (s *AuthService) getUserForPasswordGrant(request core.PasswordGrant) (uuid.UUID, error) {
	if !s.appConfig.EnableInternalLogin {
		return uuid.Nil, core.ErrFeatureDisabled
	}
	user, err := core.WrapDbErrorWithValue(s.dao.Queries.GetUserPassword(context.Background(), request.Username))
	if err != nil {
		// prevent CWE-208
		core.DoesPasswordMatchHashed("null", core.NullPasswordHash)
		return uuid.Nil, err
	}
	if !core.DoesPasswordMatchHashed(request.Password, user.PasswordHash) {
		return uuid.Nil, core.ErrInvalidCredentials
	}
	return user.Uid, nil
}

func (s *AuthService) getUserForTokenExchangeGrant(request core.TokenExchangeGrant) (uuid.UUID, error) {
	type Claims struct {
		PreferredUsername string `json:"preferred_username"`
	}
	if s.appConfig.OIDC == nil {
		return uuid.Nil, core.ErrFeatureDisabled
	}
	// TODO use ActorToken when available
	userInfo, err := s.OidcProvider.UserInfo(context.Background(), oauth2.StaticTokenSource(&oauth2.Token{
		AccessToken: request.SubjectToken,
	}))
	if err != nil {
		return uuid.Nil, err
	}
	var claims Claims
	if err := userInfo.Claims(&claims); err != nil {
		return uuid.Nil, err
	}
	if claims.PreferredUsername == "" {
		return uuid.Nil, errors.New("oidc 'preferred_username' is blank or missing")
	}
	return s.getOrCreateOidcUser(claims.PreferredUsername, userInfo.Subject)
}

func (s *AuthService) getOrCreateOidcUser(username string, userSub string) (uuid.UUID, error) {
	userUid, err := s.dao.Queries.GetOidcUserUid(context.Background(), db.GetOidcUserUidParams{
		UserSub:      userSub,
		ProviderName: s.appConfig.OIDC.ProviderName,
	})
	err = core.WrapDbError(err)
	if errors.Is(err, core.ErrNotFound) {
		tx, err := s.dao.DB.BeginTx(context.Background(), &sql.TxOptions{})
		if err != nil {
			return uuid.Nil, err
		}
		q := s.dao.Queries.WithTx(tx)
		defer tx.Rollback()
		userUid := core.MustNewUID()
		if _, err := q.InsertUser(context.Background(), db.InsertUserParams{
			Uid:      userUid,
			Username: username,
		}); err != nil {
			return uuid.Nil, core.WrapDbError(err)
		}
		if err := q.InsertOidcUserMapping(context.Background(), db.InsertOidcUserMappingParams{
			Username:     username,
			UserSub:      userSub,
			ProviderName: s.appConfig.OIDC.ProviderName,
		}); err != nil {
			return uuid.Nil, core.WrapDbError(err)
		}
		if err := s.tc.RegisterNewUser(core.Username(username)); err != nil && !errors.Is(err, core.ErrConflict) {
			return uuid.Nil, err
		}
		return userUid, tx.Commit()
	} else if err != nil {
		return uuid.Nil, err
	}
	return userUid, nil
}
