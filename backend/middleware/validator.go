package middleware

import (
	"errors"

	"github.com/danielgtaylor/huma/v2"
	"github.com/go-playground/validator/v10"
)

const ValidatorContextKey = "Validator"

type ValidatorMiddleware struct {
	validate *validator.Validate
}

func (p ValidatorMiddleware) New(
	validate *validator.Validate,
) ValidatorMiddleware {
	return ValidatorMiddleware{
		validate: validate,
	}
}

func (m ValidatorMiddleware) Provider(ctx huma.Context, next func(huma.Context)) {
	newCtx := huma.WithValue(ctx, ValidatorContextKey, m.validate)
	next(newCtx)
}

func MustGetValidator(ctx huma.Context) *validator.Validate {
	return ctx.Context().Value(ValidatorContextKey).(*validator.Validate)
}

func ValidateRequestInput(ctx huma.Context, input any) []error {
	validate := MustGetValidator(ctx)
	if err := validate.Struct(input); err != nil {
		fieldErrors := err.(validator.ValidationErrors)
		errs := make([]error, len(fieldErrors))
		for i, fieldErr := range fieldErrors {
			errs[i] = errors.New(fieldErr.Error())
		}
		return errs
	}
	return nil
}
