package bootstrap

import (
	"go.uber.org/fx"

	"visa-application-form/backend/internal/controller"
	"visa-application-form/backend/internal/service"
)

func ProvideFormController(formService service.FormService) *controller.FormController {
	return controller.NewFormController(formService)
}

func ProvideHealthController() *controller.HealthController {
	return controller.NewHealthController()
}

func ControllerModule() fx.Option {
	return fx.Options(
		fx.Provide(
			ProvideFormController,
			ProvideHealthController,
		),
	)
}
