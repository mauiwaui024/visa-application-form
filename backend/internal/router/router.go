package router

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"visa-application-form/backend/internal/controller"
)

func NewRouter(
	formController *controller.FormController,
	healthController *controller.HealthController,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(corsMiddleware())

	ConfigureRouter(r, formController, healthController)

	return r
}

func ConfigureRouter(
	r *gin.Engine,
	formController *controller.FormController,
	healthController *controller.HealthController,
) {
	r.GET("/health", healthController.Health)
	r.POST("/api/v1/form", formController.SubmitForm)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "http://localhost:5173" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
