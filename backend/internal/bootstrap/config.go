package bootstrap

import (
	"log/slog"

	"go.uber.org/fx"

	"visa-application-form/backend/internal/config"
)

func ProvideConfig() *config.Config {
	return config.NewConfig()
}

func ProvideBackgroundConfig(cfg *config.Config) *config.Background {
	return &cfg.Background
}

func ProvideMailConfig(cfg *config.Config) *config.Mail {
	return &cfg.Mail
}

func ProvideLogger() *slog.Logger {
	return slog.Default()
}

func ConfigModule() fx.Option {
	return fx.Options(
		fx.Provide(
			ProvideConfig,
			ProvideBackgroundConfig,
			ProvideMailConfig,
			ProvideLogger,
		),
	)
}
