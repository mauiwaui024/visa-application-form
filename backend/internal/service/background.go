package service

import "context"

type Background interface {
	Run(ctx context.Context) error
}
