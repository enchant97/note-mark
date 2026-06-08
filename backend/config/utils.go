package config

import (
	"encoding/base64"
	"errors"
	"log/slog"
	"reflect"
	"strings"

	"github.com/caarlos0/env/v11"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/gommon/bytes"
)

// Load the config from OS
func (appConfig *AppConfig) ParseConfig(validate *validator.Validate) error {
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

type LoggingLevel string

func (l *LoggingLevel) ToSlogLevel() slog.Level {
	switch strings.ToLower(string(*l)) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
