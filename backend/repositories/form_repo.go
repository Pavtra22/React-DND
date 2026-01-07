package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

// FormRepository defines the interface for database operations
type FormRepository interface {
	Create(form *models.Form) error
	FindAll() ([]models.Form, error)
	FindByID(id int) (*models.Form, error)
	CreateSubmission(submission *models.FormSubmission) error // New method
}

// formRepository is the concrete implementation
type formRepository struct {
	db *gorm.DB
}

// NewFormRepository creates a new instance
func NewFormRepository(db *gorm.DB) FormRepository {
	return &formRepository{db: db}
}

func (r *formRepository) Create(form *models.Form) error {
	return r.db.Create(form).Error
}

func (r *formRepository) FindAll() ([]models.Form, error) {
	var forms []models.Form
	// Sort by creation date (newest first) to match frontend expectation
	err := r.db.Order("created_at desc").Find(&forms).Error
	return forms, err
}

func (r *formRepository) FindByID(id int) (*models.Form, error) {
	var form models.Form
	err := r.db.First(&form, id).Error
	if err != nil {
		return nil, err
	}
	return &form, nil
}

// CreateSubmission saves a new form submission to the database
func (r *formRepository) CreateSubmission(submission *models.FormSubmission) error {
	return r.db.Create(submission).Error
}
