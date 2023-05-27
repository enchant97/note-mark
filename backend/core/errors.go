package core

import "errors"

var ErrValidation = errors.New("input failed validation checks")
var ErrBind = errors.New("input failed to bind")
