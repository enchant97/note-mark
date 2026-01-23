package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
)

func SetupUsersHandler(
	api huma.API,
	service services.UsersService,
	appConfig config.AppConfig,
	authProvider *middleware.AuthDetailsProvider,
) {
	userHandler := UsersHandler{
		service:      service,
		appConfig:    appConfig,
		authProvider: authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/api/users",
		DefaultStatus: http.StatusCreated,
	}, userHandler.PostCreateUser)
	huma.Get(api, "/api/users/{username}", userHandler.GetUserByUsername)
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
		Method:      http.MethodPut,
		Path:        "/api/users/{username}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, userHandler.PutCurrentUser)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/users/{username}/password",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, userHandler.PutCurrentUserPassword)
}

type UsersHandler struct {
	service      services.UsersService
	appConfig    config.AppConfig
	authProvider *middleware.AuthDetailsProvider
}

type PostCreateUserInput struct {
	Body core.CreateUserWithPassword
}

type PostCreateUserOutput struct {
	Body core.User
}

type GetUserOutput struct {
	Body core.User
}

type GetUserByUsername struct {
	Username string `path:"username"`
}

type PutUserInput struct {
	GetUserByUsername
	Body core.UpdateUser
}

type PutUserPasswordInput struct {
	GetUserByUsername
	Body core.UpdateUserPassword
}

type GetSearchForUserInput struct {
	Username string `query:"username" required:"true"`
}

type GetSearchForUserOutput struct {
	Body []string
}

func (h UsersHandler) PostCreateUser(ctx context.Context, input *PostCreateUserInput) (*PostCreateUserOutput, error) {
	if user, err := h.service.CreateUserWithPassword(input.Body); err != nil {
		if errors.Is(err, core.ErrFeatureDisabled) {
			return nil, huma.Error403Forbidden("user signup has been disabled by the administrator")
		} else if errors.Is(err, core.ErrConflict) {
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

func (h UsersHandler) GetUserByUsername(ctx context.Context, input *GetUserByUsername) (*GetUserOutput, error) {
	if user, err := h.service.GetUserByUsername(input.Username); err != nil {
		if errors.Is(err, core.ErrNotFound) {
			return nil, huma.Error404NotFound("user does not exist")
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
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != input.Username {
		return nil, huma.Error403Forbidden("you do not have permission to update another users account")
	}
	if err := h.service.UpdateUserByUsername(input.Username, input.Body); err != nil {
		return nil, err
	} else {
		return nil, nil
	}
}

func (h UsersHandler) PutCurrentUserPassword(ctx context.Context, input *PutUserPasswordInput) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != input.Username {
		return nil, huma.Error403Forbidden("you do not have permission to update another users account")
	}
	if err := h.service.UpdateUserPasswordByUsername(input.Username, input.Body); err != nil {
		if errors.Is(err, core.ErrFeatureDisabled) {
			return nil, huma.Error403Forbidden("password changes have been disabled by the administrator")
		} else if errors.Is(err, core.ErrInvalidCredentials) {
			return nil, huma.Error403Forbidden("current password invalid")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h UsersHandler) GetSearchForUser(ctx context.Context, input *GetSearchForUserInput) (*GetSearchForUserOutput, error) {
	if users, err := h.service.GetUsernameSearch(input.Username); err != nil {
		return nil, err
	} else {
		return &GetSearchForUserOutput{
			Body: users,
		}, nil
	}
}
