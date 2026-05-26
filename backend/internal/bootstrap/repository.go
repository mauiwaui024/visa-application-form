package bootstrap

import (
	"context"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	"go.uber.org/fx"

	"visa-application-form/backend/internal/config"
	"visa-application-form/backend/internal/repository"
	form_processor_background "visa-application-form/backend/internal/repository/form-processor-background"
	form_sender "visa-application-form/backend/internal/repository/form-repository"
)

func ProvideDB(lifecycle fx.Lifecycle, cfg *config.Config) (*sqlx.DB, error) {
	connString := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DB.Host,
		cfg.DB.Port,
		cfg.DB.User,
		cfg.DB.Password,
		cfg.DB.Name,
		cfg.DB.SSLMode,
	)

	db, err := sqlx.Open("pgx", connString)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	db.SetMaxOpenConns(cfg.DB.MaxOpenConns)
	db.SetMaxIdleConns(cfg.DB.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.DB.ConnMaxLifetime)

	lifecycle.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return db.Close()
		},
	})

	return db, nil
}

func ProvideRepository(db *sqlx.DB) repository.FormSenderRepository {
	return form_sender.NewSQLXFormRepository(db)
}

func ProvideFormProcessorBackgroundRepository(
	db *sqlx.DB,
	formRepository repository.FormSenderRepository,
) repository.FormProcessorBackgroundRepository {
	return form_processor_background.New(db, formRepository)
}

func RepositoryModule() fx.Option {
	return fx.Options(
		fx.Provide(
			ProvideDB,
			ProvideRepository,
			ProvideFormProcessorBackgroundRepository,
		),
	)
}
