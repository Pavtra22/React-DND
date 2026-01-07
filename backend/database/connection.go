package database

import (
	"log"

	"backend/models" // Import your models to migrate them

	"github.com/glebarez/sqlite" // Pure Go SQLite driver
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
	// Connect to SQLite DB file
	db, err := gorm.Open(sqlite.Open("forms.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate the Form model
	if err := db.AutoMigrate(&models.Form{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	return db
}