package form_processor_background

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"

	"github.com/jmoiron/sqlx"

	"visa-application-form/backend/internal/model"
	"visa-application-form/backend/internal/repository"
)

type Repository struct {
	db      *sqlx.DB
	formRepo repository.FormSenderRepository

	mu       sync.Mutex
	inFlight map[string]*sqlx.Tx
}

func New(db *sqlx.DB, formRepo repository.FormSenderRepository) *Repository {
	return &Repository{
		db:       db,
		formRepo: formRepo,
		inFlight: make(map[string]*sqlx.Tx),
	}
}

func (r *Repository) Get(ctx context.Context) (string, model.SubmitFormRequest, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return "", model.SubmitFormRequest{}, fmt.Errorf("begin transaction: %w", err)
	}

	var id string
	err = tx.QueryRowxContext(
		ctx,
		`SELECT id
		FROM form.visa_application
		WHERE processed = false
		ORDER BY created_at
		FOR UPDATE SKIP LOCKED
		LIMIT 1`,
	).Scan(&id)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return "", model.SubmitFormRequest{}, sql.ErrNoRows
		}
		return "", model.SubmitFormRequest{}, fmt.Errorf("select unprocessed form id: %w", err)
	}

	form, err := r.formRepo.Get(ctx, id)
	if err != nil {
		_ = tx.Rollback()
		return "", model.SubmitFormRequest{}, fmt.Errorf("load form by id: %w", err)
	}

	r.mu.Lock()
	r.inFlight[id] = tx
	r.mu.Unlock()

	return id, form, nil
}

func (r *Repository) Ack(ctx context.Context, id string) error {
	r.mu.Lock()
	tx, ok := r.inFlight[id]
	if ok {
		delete(r.inFlight, id)
	}
	r.mu.Unlock()

	if !ok {
		return fmt.Errorf("ack form id %s: not in flight", id)
	}

	var rollback bool
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()

	result, err := tx.ExecContext(
		ctx,
		`UPDATE form.visa_application
		SET processed = true, updated_at = now()
		WHERE id = $1 AND processed = false`,
		id,
	)
	if err != nil {
		rollback = true
		return fmt.Errorf("ack update form id %s: %w", id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		rollback = true
		return fmt.Errorf("ack rows affected form id %s: %w", id, err)
	}
	if rowsAffected == 0 {
		rollback = true
		return fmt.Errorf("ack form id %s: already processed", id)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("ack commit form id %s: %w", id, err)
	}

	return nil
}
