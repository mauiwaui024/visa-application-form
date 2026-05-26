package controller

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"visa-application-form/backend/internal/models"
	"visa-application-form/backend/internal/service"
)

type FormController struct {
	service service.FormService
}

func NewFormController(service service.FormService) *FormController {
	return &FormController{service: service}
}

func (c *FormController) SubmitForm(ctx *gin.Context) {
	var req models.SubmitFormRequestDTO
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := c.service.Submit(ctx.Request.Context(), req); err != nil {
		if errors.Is(err, service.ErrInvalidInput) {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, models.SubmitFormResponseDTO{Status: "ok"})
}
