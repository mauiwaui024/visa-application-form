package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	HTTPHost         string
	HTTPPort         string
	HTTPReadTimeout  time.Duration
	HTTPWriteTimeout time.Duration
	DB               DBConfig
	Background       Background
	Mail             Mail
}

type DBConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type Background struct {
	Name       string
	Schedule   string
	RetryDelay time.Duration
	OutputDir  string
}

type Mail struct {
	Enabled       bool
	SMTPHost      string
	SMTPPort      int
	Username      string
	AppPassword   string
	From          string
	To            string
	SubjectPrefix string
}

func NewConfig() *Config {
	return &Config{
		HTTPHost:         getEnv("HTTP_HOST", "0.0.0.0"),
		HTTPPort:         getEnv("HTTP_PORT", "8080"),
		HTTPReadTimeout:  getDurationFromEnv("HTTP_READ_TIMEOUT_SECONDS", 15),
		HTTPWriteTimeout: getDurationFromEnv("HTTP_WRITE_TIMEOUT_SECONDS", 15),
		DB: DBConfig{
			Host:            getEnv("DB_HOST", "postgres"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", "postgres"),
			Name:            getEnv("DB_NAME", "visa_application"),
			SSLMode:         getEnv("DB_SSLMODE", "disable"),
			MaxOpenConns:    getIntFromEnv("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getIntFromEnv("DB_MAX_IDLE_CONNS", 25),
			ConnMaxLifetime: getDurationFromEnv("DB_CONN_MAX_LIFETIME_SECONDS", 300),
		},
		Background: Background{
			Name:       getEnv("BACKGROUND_NAME", "form-processor"),
			Schedule:   getEnv("BACKGROUND_SCHEDULE", "1s"),
			RetryDelay: getDurationFromEnv("BACKGROUND_RETRY_DELAY_SECONDS", 1),
			OutputDir:  getEnv("BACKGROUND_OUTPUT_DIR", "./generated-forms"),
		},
		Mail: Mail{
			Enabled:       getBoolFromEnv("MAIL_ENABLED", true),
			SMTPHost:      getEnv("MAIL_SMTP_HOST", "smtp.yandex.ru"),
			SMTPPort:      getIntFromEnv("MAIL_SMTP_PORT", 465),
			Username:      getEnv("MAIL_USERNAME", ""),
			AppPassword:   getEnv("MAIL_APP_PASSWORD", ""),
			From:          getEnv("MAIL_FROM", ""),
			To:            getEnv("MAIL_TO", ""),
			SubjectPrefix: getEnv("MAIL_SUBJECT_PREFIX", "Visa application"),
		},
	}
}

func (c *Config) Address() string {
	return c.HTTPHost + ":" + c.HTTPPort
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func getDurationFromEnv(key string, fallbackSeconds int) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return time.Duration(fallbackSeconds) * time.Second
	}

	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds <= 0 {
		return time.Duration(fallbackSeconds) * time.Second
	}

	return time.Duration(seconds) * time.Second
}

func getIntFromEnv(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}

	return value
}

func getBoolFromEnv(key string, fallback bool) bool {
	raw := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if raw == "" {
		return fallback
	}

	switch raw {
	case "1", "true", "yes", "y", "on":
		return true
	case "0", "false", "no", "n", "off":
		return false
	default:
		return fallback
	}
}
