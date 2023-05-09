package core

import (
	"net/http"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

const slugRegexString = "^[a-z0-9-]+$"

var slugRegex = regexp.MustCompile(slugRegexString)

func validateSlugFunc(fl validator.FieldLevel) bool {
	return slugRegex.MatchString(fl.Field().String())
}

func makeValidate() validator.Validate {
	v := validator.New()
	{
		v.RegisterValidation("slug", validateSlugFunc)
	}
	return *v
}

type Validator struct {
	validator *validator.Validate
}

func (v Validator) New() Validator {
	validate := makeValidate()
	v = Validator{
		validator: &validate,
	}
	return v
}

func (cv *Validator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}
