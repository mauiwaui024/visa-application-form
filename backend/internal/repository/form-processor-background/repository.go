package form_processor_background

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"

	"visa-application-form/backend/internal/model"
	"visa-application-form/backend/internal/repository"
)

type Repository struct {
	db       *sqlx.DB
	formRepo repository.FormSenderRepository
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
	var id string
	err := r.db.QueryRowContext(
		ctx,
		`WITH next_row AS (
			SELECT id
			FROM form.visa_application
			WHERE processed = false
			  AND (locked_dt IS NULL OR locked_dt < localtimestamp)
			ORDER BY created_at
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		)
		UPDATE form.visa_application
		SET locked_dt = localtimestamp + interval '10 minutes'
		FROM next_row
		WHERE form.visa_application.id = next_row.id
		RETURNING form.visa_application.id;
		`,
	).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", model.SubmitFormRequest{}, sql.ErrNoRows
		}
		return "", model.SubmitFormRequest{}, fmt.Errorf("select unprocessed form id: %w", err)
	}

	form, err := r.formRepo.Get(ctx, id)
	if err != nil {
		return "", model.SubmitFormRequest{}, fmt.Errorf("load form by id: %w", err)
	}

	return id, form, nil
}

func (r *Repository) Ack(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(
		ctx,
		`UPDATE form.visa_application
		SET processed = true, updated_at = now()
		WHERE id = $1 AND processed = false`,
		id,
	)
	if err != nil {
		return fmt.Errorf("ack update form id %s: %w", id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("ack rows affected form id %s: %w", id, err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("ack form id %s: already processed", id)
	}

	return nil
}
