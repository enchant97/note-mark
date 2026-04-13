package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
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
		Security:    defaultSecurityOp,
		Tags:        []string{"Node Tree"},
		Summary:     "Get node tree for user",
		OperationID: "GetNodeTreeForUser",
	}, handler.GetNodeTreeByUsername)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/tree/content/u/{username}/*",
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
	ETag string `header:"ETag"`
	Body core.NodeTree
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

// Make a "personal" ETag.
// This ensures the client only caches the current data for their current authentication.
//
// Requires to be wrapped in "" when used in a HTTP Header.
func makePersonalETagValue(authenticatedUser *core.AuthenticatedUser, modTime time.Time) string {
	h := sha256.New()
	d, err := modTime.MarshalBinary()
	if err != nil {
		panic("failed to marshal modTime")
	}
	h.Write(d)
	if authenticatedUser != nil {
		h.Write(authenticatedUser.UserUID[:])
	}
	return fmt.Sprintf("%x", h.Sum(nil))
}

func (h TreeHandler) GetNodeTreeByUsername(
	ctx context.Context,
	input *GetNodeTreeByUsernameInput,
) (*GetNodeTreeByUsernameOutput, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	optionalAuthUser := authDetails.GetOptionalAuthenticatedUser()
	// ETag Creation & ConditionalParams handling
	treeModTime, err := h.service.GetTreeModTime(input.Username)
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	etagValue := makePersonalETagValue(optionalAuthUser, treeModTime)
	if input.HasConditionalParams() {
		if err := input.PreconditionFailed(etagValue, treeModTime); err != nil {
			return nil, err
		}
	}
	// Get actual nodeTree
	nodeTree, err := h.service.GetTreeForUser(optionalAuthUser, input.Username)
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	return &GetNodeTreeByUsernameOutput{
		ETag: fmt.Sprintf(`"%s"`, etagValue),
		Body: nodeTree,
	}, nil
}

func getValidatedNodeType(fullSlug string) (core.NodeType, error) {
	var nodeType core.NodeType
	if path.Ext(fullSlug) == "" {
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
	optionalAuthUser := authDetails.GetOptionalAuthenticatedUser()
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	// check if has permission
	// (specific permission does not matter, as all modes are "read" permitted)
	if accessMode, err := h.service.GetAvailableNodeAccessControlMode(
		optionalAuthUser,
		input.Username,
		sanitizedSlug,
		false,
	); err != nil {
		return nil, toGenericHTTPError(err)
	} else if accessMode == nil {
		return nil, huma.Error404NotFound("not found, or you don't have permission")
	}
	// try get node type
	nodeType, err := getValidatedNodeType(string(sanitizedSlug))
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	// ETag handling
	nodeModTime, err := h.service.GetNodeModTime(input.Username, sanitizedSlug)
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	etagValue := makePersonalETagValue(optionalAuthUser, nodeModTime)
	if input.HasConditionalParams() {
		if err := input.PreconditionFailed(etagValue, nodeModTime); err != nil {
			return nil, err
		}
	}
	// get node content
	r, err := h.service.GetNodeContent(input.Username, sanitizedSlug)
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	return &huma.StreamResponse{
		Body: func(ctx huma.Context) {
			defer r.Close()
			// read initial chunk of data for mime-type sniffing later
			var first512 [512]byte
			first512Length, err := io.ReadFull(r, first512[:])
			if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
				ctx.SetStatus(http.StatusInternalServerError)
				return
			}
			// set headers
			ctx.SetHeader("X-Content-Type-Options", "nosniff")
			ctx.SetHeader("ETag", fmt.Sprintf(`"%s"`, etagValue))
			if nodeType == core.NoteNode {
				ctx.SetHeader("Content-Type", "text/markdown")
			} else {
				contentType := http.DetectContentType(first512[:])
				// prevents XSS on restricted types
				if strings.HasPrefix(contentType, "text/html") || strings.HasPrefix(contentType, "image/svg+xml") {
					ctx.SetHeader("Content-Disposition", "attachment")
					contentType = "application/octet-stream"
				}
				ctx.SetHeader("Content-Type", contentType)
			}
			// send content
			w := ctx.BodyWriter()
			w.Write(first512[:first512Length])
			io.Copy(w, r)
		},
	}, nil
}

func (h TreeHandler) PutNodeContent(
	ctx context.Context,
	input *PutNodeContentInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	authenticatedUser := authDetails.MustGetAuthenticatedUser()
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	// access control check
	if acMode, err := h.service.GetAvailableNodeAccessControlMode(
		&authenticatedUser,
		input.Username,
		sanitizedSlug,
		true,
	); err != nil {
		return nil, toGenericHTTPError(err)
	} else if acMode == nil || *acMode != core.AccessControlWriteMode {
		return nil, huma.Error403Forbidden("you don't have permission")
	}
	// update node
	if _, err := getValidatedNodeType(string(sanitizedSlug)); err != nil {
		return nil, toGenericHTTPError(err)
	}
	r := bytes.NewReader(input.RawBody)
	return nil, toGenericHTTPError(h.service.UpdateNodeContent(input.Username, sanitizedSlug, r))
}

func (h TreeHandler) PutNoteNodeFrontmatter(
	ctx context.Context,
	input *PutNoteNodeFrontmatterInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	authenticatedUser := authDetails.MustGetAuthenticatedUser()
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	if nodeType, err := getValidatedNodeType(string(sanitizedSlug)); err != nil {
		return nil, toGenericHTTPError(err)
	} else if nodeType != core.NoteNode {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	// access control check
	if acMode, err := h.service.GetAvailableNodeAccessControlMode(
		&authenticatedUser,
		input.Username,
		sanitizedSlug,
		true,
	); err != nil {
		return nil, toGenericHTTPError(err)
	} else if acMode == nil || *acMode != core.AccessControlWriteMode {
		return nil, huma.Error403Forbidden("you don't have permission")
	}
	// update frontmatter
	return nil, toGenericHTTPError(
		h.service.UpdateNoteNodeFrontmatter(input.Username, sanitizedSlug, input.Body),
	)
}

func (h TreeHandler) PostRenameNode(
	ctx context.Context,
	input *PostRenameNodeInput,
) (*struct{}, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	authenticatedUser := authDetails.MustGetAuthenticatedUser()
	sanitizedSlug := core.NodeSlug(path.Clean(string(input.Slug)))
	if nodeType, err := getValidatedNodeType(string(sanitizedSlug)); err != nil {
		return nil, toGenericHTTPError(err)
	} else if nodeType != core.NoteNode {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	// access control check
	if acMode, err := h.service.GetAvailableNodeAccessControlMode(
		&authenticatedUser,
		input.Username,
		sanitizedSlug,
		false,
	); err != nil {
		return nil, toGenericHTTPError(err)
	} else if acMode == nil || *acMode != core.AccessControlWriteMode {
		return nil, huma.Error403Forbidden("you don't have permission")
	}
	// get node type
	nodeType, err := getValidatedNodeType(string(sanitizedSlug))
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	// node rename
	sanitizedNewSlug := core.NodeSlug(path.Clean(string(input.Body)))
	newNodeType, err := getValidatedNodeType(string(sanitizedNewSlug))
	if err != nil {
		return nil, toGenericHTTPError(err)
	}
	if nodeType != newNodeType {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	return nil, toGenericHTTPError(
		h.service.RenameNode(input.Username, sanitizedSlug, sanitizedNewSlug),
	)
}

func (h TreeHandler) PostMoveNodeToTrash(
	ctx context.Context,
	input *MoveNodeToTrashInput,
) (*MoveNodeToTrashOutput, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	authenticatedUser := authDetails.MustGetAuthenticatedUser()
	sanitizedSlug := path.Clean(string(input.Slug))
	if nodeType, err := getValidatedNodeType(sanitizedSlug); err != nil {
		return nil, toGenericHTTPError(err)
	} else if nodeType != core.NoteNode {
		return nil, huma.Error422UnprocessableEntity("invalid slug")
	}
	// access control check
	if acMode, err := h.service.GetAvailableNodeAccessControlMode(
		&authenticatedUser,
		input.Username,
		core.NodeSlug(sanitizedSlug),
		false,
	); err != nil {
		return nil, toGenericHTTPError(err)
	} else if acMode == nil || *acMode != core.AccessControlWriteMode {
		return nil, huma.Error403Forbidden("you don't have permission")
	}
	timestamp := time.Now().UTC()
	sanitizedNewSlug := path.Join(".trash/", timestamp.Format("20060102T150405.000Z"), sanitizedSlug)
	if err := h.service.RenameNode(
		input.Username,
		core.NodeSlug(sanitizedSlug),
		core.NodeSlug(sanitizedNewSlug),
	); err != nil {
		return nil, toGenericHTTPError(err)
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
		return nil, huma.Error403Forbidden("you don't have permission")
	}
	sanitizedSlug := path.Clean(string(input.Slug))
	sanitizedSlug = path.Join(".trash/", sanitizedSlug)
	if _, err := getValidatedNodeType(sanitizedSlug); err != nil {
		return nil, toGenericHTTPError(err)
	}
	return nil, toGenericHTTPError(
		h.service.DeleteNode(input.Username, core.NodeSlug(sanitizedSlug)),
	)
}
