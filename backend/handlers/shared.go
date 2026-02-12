package handlers

import (
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
