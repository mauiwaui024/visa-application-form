package bootstrap

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	background_service "visa-application-form/backend/internal/infrastructure/background-service"

	"go.uber.org/fx"

	"visa-application-form/backend/internal/config"
	"visa-application-form/backend/internal/service"
)

func invokeBackgroundService(
	logger *slog.Logger,
	lc fx.Lifecycle,
	cfg *config.Background,
	backgroundService service.Background,
) error {
	return launchBackgroundService(
		logger,
		lc,
		cfg.Name,
		cfg.Schedule,
		cfg.RetryDelay,
		backgroundService.Run,
	)
}

func launchBackgroundService(
	logger *slog.Logger,
	lc fx.Lifecycle,
	name string,
	schedule string,
	retryDelay time.Duration,
	backgroundFunc background_service.BackgroundFunc,
) error {
	if backgroundFunc == nil {
		return fmt.Errorf("background %q function is nil", name)
	}

	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("background name is required")
	}

	interval, err := time.ParseDuration(schedule)
	if err != nil || interval <= 0 {
		return fmt.Errorf("background %q invalid schedule %q", name, schedule)
	}

	if retryDelay <= 0 {
		retryDelay = time.Second
	}

	var (
		cancel context.CancelFunc
		wg     sync.WaitGroup
	)

	execute := func(ctx context.Context) {
		if err := backgroundFunc(ctx); err != nil {
			logger.ErrorContext(
				ctx,
				"background iteration failed",
				"name",
				name,
				"error",
				err,
			)

			timer := time.NewTimer(retryDelay)
			defer timer.Stop()
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
				return
			}
		}
	}

	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			runCtx, runCancel := context.WithCancel(context.Background())
			cancel = runCancel

			wg.Add(1)
			go func() {
				defer wg.Done()

				ticker := time.NewTicker(interval)
				defer ticker.Stop()

				logger.Info("background worker started", "name", name, "schedule", interval.String())

				execute(runCtx)

				for {
					select {
					case <-runCtx.Done():
						logger.Info("background worker stopped", "name", name)
						return
					case <-ticker.C:
						execute(runCtx)
					}
				}
			}()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			if cancel != nil {
				cancel()
			}

			done := make(chan struct{})
			go func() {
				wg.Wait()
				close(done)
			}()

			select {
			case <-done:
				return nil
			case <-ctx.Done():
				return ctx.Err()
			}
		},
	})

	return nil
}
