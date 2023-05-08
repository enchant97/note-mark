package config

import (
	"encoding/base64"
	"errors"

	"github.com/caarlos0/env/v6"
)

// Load the config from OS
func (appConfig *AppConfig) ParseConfig() error {
	if err := env.Parse(appConfig); err != nil {
		return err
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
