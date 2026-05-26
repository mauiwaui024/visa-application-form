package bootstrap

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"

	"visa-application-form/backend/internal/config"
	"visa-application-form/backend/internal/controller"
	"visa-application-form/backend/internal/infrastructure"
	"visa-application-form/backend/internal/router"
)

func ProvideRouter(
	formController *controller.FormController,
	healthController *controller.HealthController,
) *gin.Engine {
	return router.NewRouter(formController, healthController)
}

func ProvideHTTPServer(cfg *config.Config, router *gin.Engine) *infrastructure.Server {
	return infrastructure.NewServer(cfg, router)
}

func HTTPModule() fx.Option {
	return fx.Options(
		fx.Provide(
			ProvideRouter,
			ProvideHTTPServer,
		),
	)
}
