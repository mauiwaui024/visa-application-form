package bootstrap

import (
	"context"

	"go.uber.org/fx"

	"visa-application-form/backend/internal/infrastructure"
)

type Params struct {
	fx.In

	Lifecycle fx.Lifecycle
	Server    *infrastructure.Server
}

func Bootstrap(p Params) {
	p.Lifecycle.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return p.Server.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return p.Server.Stop(ctx)
		},
	})
}
