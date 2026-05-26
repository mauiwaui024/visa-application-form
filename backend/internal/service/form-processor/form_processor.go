package form_processor

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"visa-application-form/backend/internal/model"
	"visa-application-form/backend/internal/repository"
	"visa-application-form/backend/internal/service"
)

type Service struct {
	logger        *slog.Logger
	repo          repository.FormProcessorBackgroundRepository
	mailSender    service.MailSender
	outputDir     string
	mailTo        string
	subjectPrefix string
}

func New(
	logger *slog.Logger,
	repo repository.FormProcessorBackgroundRepository,
	mailSender service.MailSender,
	outputDir string,
	mailTo string,
	subjectPrefix string,
) service.Background {
	return &Service{
		logger:        logger,
		repo:          repo,
		mailSender:    mailSender,
		outputDir:     outputDir,
		mailTo:        mailTo,
		subjectPrefix: subjectPrefix,
	}
}

func (s *Service) Run(ctx context.Context) error {
	id, form, err := s.repo.Get(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("get form for processing: %w", err)
	}

	s.logger.InfoContext(ctx, "form picked for background processing", "id", id, "form", form)

	path, err := s.saveWordFile(id, form)
	if err != nil {
		return fmt.Errorf("save form word file: %w", err)
	}

	s.logger.InfoContext(ctx, "form word file saved", "id", id, "path", filepath.Clean(path))

	if err := s.sendMailWithAttachment(ctx, id, form, path); err != nil {
		return fmt.Errorf("send form mail: %w", err)
	}

	if err := s.repo.Ack(ctx, id); err != nil {
		return fmt.Errorf("ack processed form: %w", err)
	}

	if err := os.Remove(path); err != nil {
		return fmt.Errorf("remove generated file after ack: %w", err)
	}

	s.logger.InfoContext(ctx, "generated form file removed", "id", id, "path", filepath.Clean(path))

	return nil
}

func (s *Service) saveWordFile(id string, form model.SubmitFormRequest) (string, error) {
	return writeFormRTF(s.outputDir, id, form)
}

func (s *Service) sendMailWithAttachment(
	ctx context.Context,
	id string,
	form model.SubmitFormRequest,
	path string,
) error {
	if strings.TrimSpace(s.mailTo) == "" {
		return fmt.Errorf("mail recipient is empty")
	}

	prefix := strings.TrimSpace(s.subjectPrefix)
	if prefix == "" {
		prefix = "Visa application"
	}

	subject := fmt.Sprintf("%s - %s", prefix, formatMailName(form.PersonalDetails.FullNamePassport))
	body := fmt.Sprintf(
		"Анкета обработана в фоне.\nID: %s\nФИО: %s\nEmail: %s\nВложение: %s\nВремя: %s",
		id,
		form.PersonalDetails.FullNamePassport,
		form.PersonalDetails.Email,
		filepath.Base(path),
		time.Now().Format(time.RFC3339),
	)

	if err := s.mailSender.SendWithAttachment(ctx, subject, body, path); err != nil {
		return err
	}

	s.logger.InfoContext(ctx, "form mail sent", "id", id, "to", s.mailTo)
	return nil
}

func formatMailName(fullName string) string {
	parts := strings.Fields(strings.TrimSpace(fullName))
	if len(parts) >= 2 {
		return parts[0] + " " + parts[1]
	}
	if len(parts) == 1 {
		return parts[0]
	}
	return "unknown applicant"
}
