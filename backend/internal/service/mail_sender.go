package service

import "context"

type MailSender interface {
	SendWithAttachment(ctx context.Context, subject, body, attachmentPath string) error
}
