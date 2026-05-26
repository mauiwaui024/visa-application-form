package models

import "visa-application-form/backend/internal/model"

type SubmitFormRequestDTO = model.SubmitFormRequest

type SubmitFormResponseDTO struct {
	Status string `json:"status"`
}

type HealthResponseDTO struct {
	Status string `json:"status"`
}
