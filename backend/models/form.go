package models

import "time"

type Form struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Elements  string    `gorm:"type:text" json:"elements"` // JSON string from frontend
	CreatedAt time.Time `json:"created_at"`
}