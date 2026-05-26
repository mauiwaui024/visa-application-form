package infrastructure

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"visa-application-form/backend/internal/config"
)

type Server struct {
	server *http.Server
}

func NewServer(cfg *config.Config, router *gin.Engine) *Server {
	return &Server{
		server: &http.Server{
			Addr:         cfg.Address(),
			Handler:      router,
			ReadTimeout:  cfg.HTTPReadTimeout,
			WriteTimeout: cfg.HTTPWriteTimeout,
		},
	}
}

func (s *Server) Start(_ context.Context) error {
	go func() {
		if err := s.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			// no-op
		}
	}()

	return nil
}

func (s *Server) Stop(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}
