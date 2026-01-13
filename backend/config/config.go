package config

import "fmt"

type BindConfig struct {
	Host       string `env:"HOST" envDefault:"127.0.0.1"`
	Port       uint   `env:"PORT" envDefault:"8080" validate:"gt=0,lte=65535"`
	UnixSocket string `env:"UNIX_SOCKET" validate:"unix_addr"`
}

func (c *BindConfig) AsAddress() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

type DBConfig struct {
	URI  string `env:"URI,notEmpty"`
	Type string `env:"TYPE,notEmpty" validate:"oneof=sqlite postgres"`
}

type OidcConfig struct {
	DisplayName        string `env:"DISPLAY_NAME" validate:"required"`
	ProviderName       string `env:"PROVIDER_NAME" validate:"required"`
	IssuerUrl          string `env:"ISSUER_URL" validate:"required,http_url"`
	ClientID           string `env:"CLIENT_ID" validate:"required"`
	EnableUserCreation bool   `env:"ENABLE_USER_CREATION,notEmpty" envDefault:"true"`
}

type AppConfig struct {
	Bind                      BindConfig    `envPrefix:"BIND__"`
	DB                        DBConfig      `envPrefix:"DB__"`
	JWTSecret                 Base64Decoded `env:"JWT_SECRET,notEmpty"`
	TokenExpiry               int64         `env:"TOKEN_EXPIRY" envDefault:"259200"`
	DataPath                  string        `env:"DATA_PATH,notEmpty"`
	StaticPath                string        `env:"STATIC_PATH"`
	PublicUrl                 string        `env:"PUBLIC_URL,notEmpty" validate:"http_url,endsnotwith=/,required"`
	EnableInternalSignup      bool          `env:"ENABLE_INTERNAL_SIGNUP,notEmpty" envDefault:"true"`
	EnableInternalLogin       bool          `env:"ENABLE_INTERNAL_LOGIN,notEmpty" envDefault:"true"`
	EnableAnonymousUserSearch bool          `env:"ENABLE_ANONYMOUS_USER_SEARCH,notEmpty" envDefault:"true"`
	NoteSizeLimit             Bytes         `env:"NOTE_SIZE_LIMIT,notEmpty" envDefault:"1M"`
	AssetSizeLimit            Bytes         `env:"ASSET_SIZE_LIMIT,notEmpty" envDefault:"12M"`
	OIDC                      *OidcConfig   `envPrefix:"OIDC__" env:",init" validate:"omitempty,required"`
}
