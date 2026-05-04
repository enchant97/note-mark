package handlers

import (
	"errors"
	"log/slog"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
)

type UsernamePath struct {
	Username core.Username `path:"username" validate:"username"`
}

func (m *UsernamePath) Resolve(ctx huma.Context) []error {
	return middleware.ValidateRequestInput(ctx, m)
}

type SlugPath struct {
	Slug core.NodeSlug `path:"*" validate:"slug_full"`
}

func (m *SlugPath) Resolve(ctx huma.Context) []error {
	return middleware.ValidateRequestInput(ctx, m)
}

func toGenericHTTPError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, core.ErrNotFound) {
		return huma.Error404NotFound("not found, or you don't have permission")
	} else if errors.Is(err, core.ErrConflict) {
		return huma.Error409Conflict("conflict detected")
	} else if errors.Is(err, core.ErrParsingContent) {
		return huma.Error500InternalServerError("content parse failure")
	} else if errors.Is(err, core.ErrInvalidCredentials) {
		return huma.Error401Unauthorized("failed to authenticate")
	} else if errors.Is(err, core.ErrFeatureDisabled) {
		return huma.Error501NotImplemented("feature currently disabled")
	}
	slog.Error("unhandled error detected", "err", err)
	return huma.Error500InternalServerError("unknown error occurred")
}
