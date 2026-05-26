package mail_sender

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log/slog"
	"mime"
	"net"
	"net/smtp"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"visa-application-form/backend/internal/config"
	"visa-application-form/backend/internal/service"
)

type noOpSender struct{}

func (s *noOpSender) SendWithAttachment(context.Context, string, string, string) error {
	return nil
}

type smtpSender struct {
	logger *slog.Logger
	host   string
	port   int
	user   string
	pass   string
	from   string
	to     string
}

func New(cfg *config.Mail, logger *slog.Logger) service.MailSender {
	if cfg == nil || !cfg.Enabled {
		return &noOpSender{}
	}

	return &smtpSender{
		logger: logger,
		host:   cfg.SMTPHost,
		port:   cfg.SMTPPort,
		user:   cfg.Username,
		pass:   cfg.AppPassword,
		from:   cfg.From,
		to:     cfg.To,
	}
}

func (s *smtpSender) SendWithAttachment(
	ctx context.Context,
	subject string,
	body string,
	attachmentPath string,
) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if strings.TrimSpace(s.host) == "" || s.port <= 0 {
		return fmt.Errorf("smtp host/port is not configured")
	}
	if strings.TrimSpace(s.from) == "" || strings.TrimSpace(s.to) == "" {
		return fmt.Errorf("mail from/to is not configured")
	}

	payload, err := buildMessage(s.from, s.to, subject, body, attachmentPath)
	if err != nil {
		return fmt.Errorf("build mail payload: %w", err)
	}

	client, conn, err := s.dialClient(ctx)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}
	defer conn.Close()
	defer client.Quit()

	if s.user != "" || s.pass != "" {
		auth := smtp.PlainAuth("", s.user, s.pass, s.host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}

	if err := client.Mail(s.from); err != nil {
		return fmt.Errorf("smtp MAIL FROM: %w", err)
	}
	if err := client.Rcpt(s.to); err != nil {
		return fmt.Errorf("smtp RCPT TO: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp DATA: %w", err)
	}
	if _, err := writer.Write(payload); err != nil {
		_ = writer.Close()
		return fmt.Errorf("smtp write body: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("smtp close data writer: %w", err)
	}

	s.logger.Info("mail sent", "to", s.to, "subject", subject)
	return nil
}

func (s *smtpSender) dialClient(ctx context.Context) (*smtp.Client, net.Conn, error) {
	address := net.JoinHostPort(s.host, strconv.Itoa(s.port))

	if s.port == 465 {
		dialer := &net.Dialer{Timeout: 10 * time.Second}
		conn, err := tls.DialWithDialer(dialer, "tcp", address, &tls.Config{
			ServerName: s.host,
			MinVersion: tls.VersionTLS12,
		})
		if err != nil {
			return nil, nil, err
		}
		client, err := smtp.NewClient(conn, s.host)
		if err != nil {
			_ = conn.Close()
			return nil, nil, err
		}
		return client, conn, nil
	}

	conn, err := (&net.Dialer{Timeout: 10 * time.Second}).DialContext(ctx, "tcp", address)
	if err != nil {
		return nil, nil, err
	}

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		_ = conn.Close()
		return nil, nil, err
	}

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{
			ServerName: s.host,
			MinVersion: tls.VersionTLS12,
		}); err != nil {
			_ = client.Close()
			_ = conn.Close()
			return nil, nil, err
		}
	}

	return client, conn, nil
}

func buildMessage(from, to, subject, body, attachmentPath string) ([]byte, error) {
	content, err := os.ReadFile(attachmentPath)
	if err != nil {
		return nil, fmt.Errorf("read attachment: %w", err)
	}

	filename := filepath.Base(attachmentPath)
	encodedSubject := mime.BEncoding.Encode("UTF-8", subject)
	boundary := fmt.Sprintf("visa-form-%d", time.Now().UnixNano())

	var msg bytes.Buffer
	msg.WriteString(fmt.Sprintf("From: %s\r\n", from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", encodedSubject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=%q\r\n", boundary))
	msg.WriteString("\r\n")

	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 8bit\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)
	msg.WriteString("\r\n")

	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString(fmt.Sprintf("Content-Type: application/rtf; name=%q\r\n", filename))
	msg.WriteString("Content-Transfer-Encoding: base64\r\n")
	msg.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=%q\r\n", filename))
	msg.WriteString("\r\n")

	encoded := make([]byte, base64.StdEncoding.EncodedLen(len(content)))
	base64.StdEncoding.Encode(encoded, content)
	for i := 0; i < len(encoded); i += 76 {
		end := i + 76
		if end > len(encoded) {
			end = len(encoded)
		}
		msg.Write(encoded[i:end])
		msg.WriteString("\r\n")
	}

	msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	return msg.Bytes(), nil
}
