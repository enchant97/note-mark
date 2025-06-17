package config

import (
	"encoding/base64"
	"errors"
	"reflect"

	"github.com/caarlos0/env/v11"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/gommon/bytes"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// Load the config from OS
func (appConfig *AppConfig) ParseConfig() error {
	if err := env.Parse(appConfig); err != nil {
		return err
	}
	if reflect.DeepEqual(appConfig.OIDC, &OidcConfig{EnableUserCreation: true}) {
		appConfig.OIDC = nil
	}
	return validate.Struct(appConfig)
}

type Base64Decoded []byte

func (b *Base64Decoded) UnmarshalText(text []byte) error {
	decoded, err := base64.StdEncoding.DecodeString(string(text))
	if err != nil {
		return errors.New("cannot decode base64 string")
	}
	*b = decoded
	return nil
}

type Bytes int64

func (b *Bytes) UnmarshalText(text []byte) error {
	if v, err := bytes.Parse(string(text)); err != nil {
		return err
	} else {
		*b = Bytes(v)
		return nil
	}
}
