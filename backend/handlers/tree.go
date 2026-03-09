package handlers

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"path"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/conditional"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
)

func SetupTreeHandler(
	api huma.API,
	service services.TreeService,
	fileSizeLimitBytes int64,
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
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Get node tree for user",
		OperationID: "GetNodeTreeForUser",
	}, handler.GetNodeTreeByUsername)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/tree/content/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Get node content by slug",
		OperationID: "GetNodeContentBySlug",
	}, handler.GetNodeContent)
	huma.Register(api, huma.Operation{
		Method:       http.MethodPut,
		Path:         "/api/tree/content/u/{username}/*",
		Middlewares:  huma.Middlewares{authProvider.AuthRequiredMiddleware},
		MaxBodyBytes: fileSizeLimitBytes,
		Security:     defaultSecurityOp,
		Tags:         []string{"Node Tree"},
		Summary:      "Update node content by slug",
		OperationID:  "UpdateNodeContentBySlug",
	}, handler.PutNodeContent)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/tree/frontmatter/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Update note frontmatter by slug",
		OperationID: "UpdateNoteFrontmatterBySlug",
	}, handler.PutNoteNodeFrontmatter)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPost,
		Path:        "/api/tree/rename/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Rename node by slug",
		OperationID: "RenameNodeBySlug",
	}, handler.PostRenameNode)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPost,
		Path:        "/api/tree/move-to-trash/u/{username}/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Move node to trash",
		OperationID: "MoveToTrashByNodeBySlug",
	}, handler.PostMoveNodeToTrash)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/tree/u/{username}/.trash/*",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Delete node by slug",
		OperationID: "DeleteNodeBySlug",
	}, handler.DeleteNode)
}

type TreeHandler struct {
	service      services.TreeService
	authProvider *middleware.AuthDetailsProvider
}

type GetNodeTreeByUsernameInput struct {
	conditional.Params
	UsernamePath
}

type GetNodeTreeByUsernameOutput struct {
	UsernamePath
	LastModified time.Time `header:"Last-Modified"`
	Body         core.NodeTree
}

type GetNodeContentInput struct {
	conditional.Params
	UsernamePath
	SlugPath
}

type PutNodeContentInput struct {
	UsernamePath
	SlugPath
	RawBody []byte
}

type PutNoteNodeFrontmatterInput struct {
	UsernamePath
	SlugPath
	Body core.FrontMatter
}

type PostRenameNodeInput struct {
	UsernamePath
	SlugPath
	Body string `validate:"slug_full"`
}

func (m *PostRenameNodeInput) Resolve(ctx huma.Context) []error {
	return middleware.ValidateRequestInput(ctx, m)
}

type MoveNodeToTrashInput struct {
	UsernamePath
	SlugPath
}

type MoveNodeToTrashOutput struct {
	Body string `doc:"Slug to where it is now located in trash" example:"\".trash/20060102T150405.000Z/my-note\""`
}

type DeleteNodeInput struct {
	UsernamePath
	SlugPath
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
	// TODO run separate tree mod check before getting the tree into memory
	if input.HasConditionalParams() {
		if err := input.PreconditionFailed("", treeModTime); err != nil {
			return nil, err
		}
	}
	return &GetNodeTreeByUsernameOutput{
		LastModified: treeModTime,
		Body:         tree,
	}, nil
}

func getValidatedNodeType(fullSlug string) (core.NodeType, error) {
	var nodeType core.NodeType
	if path.Ext(string(fullSlug)) == "" {
		nodeType = core.NoteNode
	} else {
		nodeType = core.AssetNode
	}
	if valid := core.IsValidNodeSlug(fullSlug, nodeType); !valid {
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
	nodeType, err := getValidatedNodeType(string(sanitizedSlug))
	if err != nil {
		return nil, err
	}
	nodeModTime, err := h.service.GetNodeModTime(input.Username, sanitizedSlug)
	if err != nil {
		return nil, err
	}
	if input.HasConditionalParams() {
		if err := input.PreconditionFailed("", nodeModTime.Truncate(time.Second)); err != nil {
			return nil, err
		}
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
				// TODO set actual content-type if possible
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
	if _, err := getValidatedNodeType(string(sanitizedSlug)); err != nil {
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
	if nodeType, err := getValidatedNodeType(string(sanitizedSlug)); err != nil {
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
	nodeType, err := getValidatedNodeType(string(sanitizedSlug))
	if err != nil {
		return nil, err
	}
	sanitizedNewSlug := core.NodeSlug(path.Clean(string(input.Body)))
	newNodeType, err := getValidatedNodeType(string(sanitizedNewSlug))
	if err != nil {
		return nil, err
	}
	if nodeType != newNodeType {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	return nil, h.service.RenameNode(input.Username, sanitizedSlug, sanitizedNewSlug)
}

func (h TreeHandler) PostMoveNodeToTrash(
	ctx context.Context,
	input *MoveNodeToTrashInput,
) (*MoveNodeToTrashOutput, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	if currentUsername != string(input.Username) {
		return nil, huma.Error403Forbidden("you do not permission to view other users content")
	}
	sanitizedSlug := path.Clean(string(input.Slug))
	nodeType, err := getValidatedNodeType(string(sanitizedSlug))
	if err != nil {
		return nil, err
	}
	timestamp := time.Now().UTC()
	sanitizedNewSlug := path.Join(".trash/", timestamp.Format("20060102T150405.000Z"), sanitizedSlug)
	newNodeType, err := getValidatedNodeType(sanitizedNewSlug)
	if err != nil {
		return nil, err
	}
	if nodeType != newNodeType {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	if h.service.RenameNode(
		input.Username,
		core.NodeSlug(sanitizedSlug),
		core.NodeSlug(sanitizedNewSlug),
	) != nil {
		return nil, err
	}
	return &MoveNodeToTrashOutput{
		Body: sanitizedNewSlug,
	}, nil
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
	sanitizedSlug := path.Clean(string(input.Slug))
	sanitizedSlug = path.Join(".trash/", sanitizedSlug)
	if _, err := getValidatedNodeType(sanitizedSlug); err != nil {
		return nil, err
	}
	return nil, h.service.DeleteNode(input.Username, core.NodeSlug(sanitizedSlug))
}
