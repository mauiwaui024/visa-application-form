package service

import (
	"context"
	"errors"

	"visa-application-form/backend/internal/model"
)

var ErrInvalidInput = errors.New("invalid form input")
var ErrNotFound = errors.New("form not found")

type FormService interface {
	Submit(ctx context.Context, form model.SubmitFormRequest) error
	Get(ctx context.Context, id string) (model.SubmitFormRequest, error)
}
