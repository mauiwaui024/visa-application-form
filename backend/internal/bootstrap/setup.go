package bootstrap

import (
	"go.uber.org/fx"
)

func Start() {
	fx.New(
		Setup(),
	).Run()
}

func Setup() fx.Option {
	return fx.Options(
		All(),
		fx.Invoke(
			Bootstrap,
			invokeBackgroundService,
		),
	)
}

func All() fx.Option {
	return fx.Options(
		ConfigModule(),
		RepositoryModule(),
		ServiceModule(),
		ControllerModule(),
		HTTPModule(),
	)
}
