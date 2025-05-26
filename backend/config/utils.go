package config

import (
	"encoding/base64"
	"errors"

	"github.com/caarlos0/env/v11"
	"github.com/labstack/gommon/bytes"
)

// Load the config from OS
func (appConfig *AppConfig) ParseConfig() error {
	if err := env.Parse(appConfig); err != nil {
		return err
	}
	if appConfig.OIDC.DisplayName == "" || appConfig.OIDC.ProviderName == "" || appConfig.OIDC.IssuerUrl == "" || appConfig.OIDC.ClientID == "" {
		appConfig.OIDC = nil
	}
	return nil
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
