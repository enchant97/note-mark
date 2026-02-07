package handlers

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/enchant97/note-mark/backend/storage"
)

func SetupTreeHandler(
	api huma.API,
	service services.TreeService,
	authProvider *middleware.AuthDetailsProvider,
) {
	handler := TreeHandler{
		service:      service,
		authProvider: authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/tree/u/{username}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.GetNodeTreeByUsername)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/tree/content/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.GetNodeContent)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/tree/content/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.PutNodeContent)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/tree/frontmatter/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.PutNoteNodeFrontmatter)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPost,
		Path:        "/api/tree/rename/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.PostRenameNode)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/tree/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, handler.DeleteNode)
}

type TreeHandler struct {
	service      services.TreeService
	authProvider *middleware.AuthDetailsProvider
}

type GetNodeTreeByUsernameInput struct {
	Username core.Username `path:"username"`
}

type GetNodeTreeByUsernameOutput struct {
	Username     core.Username `path:"username"`
	LastModified time.Time     `header:"Last-Modified"`
	Body         core.NodeTree
}

type GetNodeContentInput struct {
	Username core.Username `path:"username"`
	Slug     core.NodeSlug `path:"*"`
}

type PutNodeContentInput struct {
	Username core.Username `path:"username"`
	Slug     core.NodeSlug `path:"*"`
	RawBody  []byte
}

type PutNoteNodeFrontmatterInput struct {
	Username core.Username `path:"username"`
	Slug     core.NodeSlug `path:"*"`
	Body     core.FrontMatter
}

type PostRenameNodeInput struct {
	Username core.Username `path:"username"`
	Slug     core.NodeSlug `path:"*"`
	Body     string
}

type DeleteNodeInput struct {
	Username core.Username `path:"username"`
	Slug     core.NodeSlug `path:"*"`
}

func (h TreeHandler) GetNodeTreeByUsername(
	ctx context.Context,
	input *GetNodeTreeByUsernameInput,
) (*GetNodeTreeByUsernameOutput, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	tree, treeModTime, err := h.service.GetTreeForUser(input.Username)
	if err != nil {
		return nil, err
	}
	return &GetNodeTreeByUsernameOutput{
		LastModified: treeModTime,
		Body:         tree,
	}, nil
}

func validateNodeType(username core.Username, slug string) (core.NodeType, error) {
	if !core.IsValidFullSlug(slug) {
		return "", huma.Error422UnprocessableEntity("invalid slug")
	}
	var nodeType core.NodeType
	if path.Ext(string(slug)) == "" {
		nodeType = core.NoteNode
	} else {
		nodeType = core.AssetNode
	}
	if valid := storage.IsValidNodeSlug(path.Join(string(username), slug), nodeType); !valid {
		return "", huma.Error422UnprocessableEntity("invalid slug")
	}
	return nodeType, nil
}

func (h TreeHandler) GetNodeContent(
	ctx context.Context,
	input *GetNodeContentInput,
) (*huma.StreamResponse, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	nodeType, err := validateNodeType(input.Username, string(sanitizedSlug))
	if err != nil {
		return nil, err
	}
	nodeModTime, err := h.service.GetNodeModTime(input.Username, sanitizedSlug)
	if err != nil {
		return nil, err
	}
	r, err := h.service.GetNodeContent(input.Username, sanitizedSlug)
	if err != nil {
		return nil, err
	}
	return &huma.StreamResponse{
		Body: func(ctx huma.Context) {
			if nodeType == core.NoteNode {
				ctx.SetHeader("Content-Type", "text/markdown")
			} else {
				ctx.SetHeader("Content-Type", "application/octet-stream")
			}
			ctx.SetHeader("Last-Modified", core.TimeIntoHTTPFormat(nodeModTime))
			w := ctx.BodyWriter()
			io.Copy(w, r)
			r.Close()
		},
	}, nil
}

func (h TreeHandler) PutNodeContent(
	ctx context.Context,
	input *PutNodeContentInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	if _, err := validateNodeType(input.Username, string(sanitizedSlug)); err != nil {
		return nil, err
	}
	r := bytes.NewReader(input.RawBody)
	return nil, h.service.UpdateNodeContent(input.Username, sanitizedSlug, r)
}

func (h TreeHandler) PutNoteNodeFrontmatter(
	ctx context.Context,
	input *PutNoteNodeFrontmatterInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	if nodeType, err := validateNodeType(input.Username, string(sanitizedSlug)); err != nil {
		return nil, err
	} else if nodeType != core.NoteNode {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	return nil, h.service.UpdateNoteNodeFrontmatter(input.Username, sanitizedSlug, input.Body)
}

func (h TreeHandler) PostRenameNode(
	ctx context.Context,
	input *PostRenameNodeInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	nodeType, err := validateNodeType(input.Username, string(sanitizedSlug))
	if err != nil {
		return nil, err
	}
	sanitizedNewSlug := core.NodeSlug(path.Clean(string(input.Body)))
	newNodeType, err := validateNodeType(input.Username, string(sanitizedNewSlug))
	if err != nil {
		return nil, err
	}
	if nodeType != newNodeType {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	return nil, h.service.RenameNode(input.Username, sanitizedSlug, sanitizedNewSlug)
}

func (h TreeHandler) DeleteNode(
	ctx context.Context,
	input *DeleteNodeInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	if _, err := validateNodeType(input.Username, string(sanitizedSlug)); err != nil {
		return nil, err
	}
	if !strings.HasPrefix(string(sanitizedSlug), ".trash/") {
		return nil, huma.Error422UnprocessableEntity("invalid slug, must have '.trash/' prefix")
	}
	return nil, h.service.DeleteNode(input.Username, sanitizedSlug)
}
