package background_service

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
)

const (
	initialized = iota
	starting
	started
	stopping
	stopped
)

type (
	BackgroundFunc            func(ctx context.Context) error
	BackgroundFuncInterceptor func(ctx context.Context, f BackgroundFunc) error
)

func (e BackgroundFunc) Intercept(i BackgroundFuncInterceptor) BackgroundFunc {
	interceptor := i

	return func(ctx context.Context) error {
		return interceptor(ctx, e)
	}
}

type BackgroundService struct {
	ctx      context.Context
	cancel   context.CancelFunc
	ctxFunc  BackgroundFunc
	wg       sync.WaitGroup
	finished chan bool
	state    atomic.Int32
}

func NewBackgroundService(
	ctxFunc BackgroundFunc,
	interceptors ...BackgroundFuncInterceptor,
) (*BackgroundService, error) {
	if ctxFunc == nil {
		return nil, fmt.Errorf("BackgroudServices: BackgroundFunc cannot be nil")
	}

	for i := range interceptors {
		ctxFunc = ctxFunc.Intercept(interceptors[len(interceptors)-1-i])
	}

	ctx, cancel := context.WithCancel(context.Background())

	b := &BackgroundService{
		ctxFunc:  ctxFunc,
		ctx:      ctx,
		cancel:   cancel,
		finished: make(chan bool, 1),
	}

	return b, nil
}

func (s *BackgroundService) Start(ctx context.Context) error {
	if !s.state.CompareAndSwap(int32(initialized), int32(starting)) {
		return fmt.Errorf("background start failed")
	}

	select {
	case <-s.ctx.Done():
		return s.ctx.Err()
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	_ = s.state.CompareAndSwap(starting, started)

	go s.run()

	return nil
}

func (s *BackgroundService) Stop(ctx context.Context) error {
	if !s.state.CompareAndSwap(started, stopping) {
		return fmt.Errorf("background stop failed")
	}

	s.cancel()
	<-s.ctx.Done()

	defer s.state.CompareAndSwap(stopping, stopped)

	go func() {
		s.wg.Wait()
		s.finished <- true
	}()

	var err error

	select {
	case <-s.finished:
		err = nil
	case <-ctx.Done():
		err = ctx.Err()
	}

	return err
}

func (s *BackgroundService) run() {
	defer s.wg.Done()

	s.wg.Add(1)

	for {
		select {
		case <-s.ctx.Done():
			return
		default:
		}

		_ = s.ctxFunc(s.ctx)
	}
}
