package models

import (
	"time"
)

type Form struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Elements  string    `gorm:"type:text" json:"elements"` // JSON string
	CreatedAt time.Time `json:"created_at"`
}

// Ensure this struct exists for the Submit handler
type FormSubmission struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	FormSchemaID uint      `json:"form_schema_id"`
	Data         string    `json:"data"` // JSON string
	CreatedAt    time.Time `json:"created_at"`
}
