package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"visa-application-form/backend/internal/models"
)

type HealthController struct{}

func NewHealthController() *HealthController {
	return &HealthController{}
}

func (c *HealthController) Health(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, models.HealthResponseDTO{Status: "ok"})
}
