package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
)

func SetupUsersHandler(
	api huma.API,
	appConfig config.AppConfig,
	authProvider middleware.AuthDetailsProvider,
) {
	userHandler := UsersHandler{
		AppConfig:    appConfig,
		AuthProvider: authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/api/users",
		DefaultStatus: http.StatusCreated,
	}, userHandler.PostCreateUser)
	huma.Get(api, "/api/slug/{username}", userHandler.GetUserByUsername)
	huma.Register(api, huma.Operation{
		Method: http.MethodGet,
		Path:   "/api/users/search",
		Middlewares: func() huma.Middlewares {
			if appConfig.EnableAnonymousUserSearch {
				return huma.Middlewares{}
			} else {
				return huma.Middlewares{authProvider.AuthRequiredMiddleware}
			}
		}(),
	}, userHandler.GetSearchForUser)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/users/me",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, userHandler.GetCurrentUser)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/users/me",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, userHandler.PutCurrentUser)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/users/me/password",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, userHandler.PutCurrentUserPassword)
}

type UsersHandler struct {
	services.UsersService
	AppConfig    config.AppConfig
	AuthProvider middleware.AuthDetailsProvider
}

type PostCreateUserInput struct {
	Body db.CreateUser
}

type PostCreateUserOutput struct {
	Body db.User
}

type GetUserOutput struct {
	Body db.User
}

type GetUserByUsername struct {
	Username string `path:"username"`
	Include  string `query:"include" enum:"books,notes"`
}

type PutUserInput struct {
	Body db.UpdateUser
}

type PutUserPasswordInput struct {
	Body db.UpdateUserPassword
}

type GetSearchForUserInput struct {
	Username string `query:"username" required:"true"`
}

type GetSearchForUserOutput struct {
	Body []string
}

func (h UsersHandler) PostCreateUser(ctx context.Context, input *PostCreateUserInput) (*PostCreateUserOutput, error) {
	if user, err := h.UsersService.CreateUser(h.AppConfig, input.Body); err != nil {
		if errors.Is(err, services.UserSignupDisabledError) {
			return nil, huma.Error403Forbidden("user signup has been disabled by the administrator")
		} else if errors.Is(err, services.ConflictError) {
			return nil, huma.Error409Conflict("user with that username already exists")
		} else {
			return nil, err
		}
	} else {
		return &PostCreateUserOutput{
			Body: user,
		}, nil
	}
}

func (h UsersHandler) GetCurrentUser(ctx context.Context, input *struct{}) (*GetUserOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if user, err := h.UsersService.GetUserProfileByID(userID); err != nil {
		return nil, err
	} else {
		return &GetUserOutput{
			Body: user,
		}, nil
	}
}

func (h UsersHandler) GetUserByUsername(ctx context.Context, input *GetUserByUsername) (*GetUserOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	includeBooks := input.Include == "books" || input.Include == "notes"
	includeNotes := input.Include == "notes"
	if user, err := h.UsersService.GetUserByUsername(
		optionalUserID,
		input.Username,
		includeBooks,
		includeNotes); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("user does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &GetUserOutput{
			Body: user,
		}, nil
	}
}

func (h UsersHandler) PutCurrentUser(ctx context.Context, input *PutUserInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.UsersService.UpdateUserProfile(userID, input.Body); err != nil {
		return nil, err
	} else {
		return nil, nil
	}
}

func (h UsersHandler) PutCurrentUserPassword(ctx context.Context, input *PutUserPasswordInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.UsersService.UpdateUserPassword(userID, input.Body); err != nil {
		if errors.Is(err, services.UserPasswordInvalid) {
			return nil, huma.Error403Forbidden("current password invalid")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h UsersHandler) GetSearchForUser(ctx context.Context, input *GetSearchForUserInput) (*GetSearchForUserOutput, error) {
	if users, err := h.UsersService.GetSearchForUser(input.Username); err != nil {
		return nil, err
	} else {
		return &GetSearchForUserOutput{
			Body: users,
		}, nil
	}
}
