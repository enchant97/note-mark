package core

import "errors"

var ValidationError = errors.New("input failed validation checks")
var BindError = errors.New("input failed to bind")
