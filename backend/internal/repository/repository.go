package repository

import (
	"context"
	"visa-application-form/backend/internal/model"
)

type FormSenderRepository interface {
	Save(ctx context.Context, form model.SubmitFormRequest) error
	Get(ctx context.Context, id string) (model.SubmitFormRequest, error)
}

type FormProcessorBackgroundRepository interface {
	Get(ctx context.Context) (string, model.SubmitFormRequest, error)
	Ack(ctx context.Context, id string) error
}
