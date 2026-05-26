package bootstrap

import (
	"log/slog"

	"go.uber.org/fx"

	"visa-application-form/backend/internal/config"
	mail_sender "visa-application-form/backend/internal/infrastructure/mail-sender"
	"visa-application-form/backend/internal/repository"
	form_processor "visa-application-form/backend/internal/service/form-processor"
	"visa-application-form/backend/internal/service"
	form_service "visa-application-form/backend/internal/service/form-service"
)

func ProvideFormService(repo repository.FormSenderRepository) service.FormService {
	return form_service.New(repo)
}

func ProvideBackgroundService(
	logger *slog.Logger,
	backgroundCfg *config.Background,
	mailCfg *config.Mail,
	mailSender service.MailSender,
	repo repository.FormProcessorBackgroundRepository,
) service.Background {
	return form_processor.New(
		logger,
		repo,
		mailSender,
		backgroundCfg.OutputDir,
		mailCfg.To,
		mailCfg.SubjectPrefix,
	)
}

func ProvideMailSender(cfg *config.Mail, logger *slog.Logger) service.MailSender {
	return mail_sender.New(cfg, logger)
}

func ServiceModule() fx.Option {
	return fx.Options(
		fx.Provide(
			ProvideFormService,
			ProvideMailSender,
			ProvideBackgroundService,
		),
	)
}
