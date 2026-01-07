package main

import (
	"log"
	"net/http"

	"backend/database"
	"backend/handlers"
	"backend/repositories"
	"backend/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Initialize Database
	db := database.Connect()

	// 2. Initialize Layers (Dependency Injection)
	formRepo := repositories.NewFormRepository(db)
	formService := services.NewFormService(formRepo)
	formHandler := handlers.NewFormHandler(formService)

	// 3. Setup Router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Setup (for React frontend)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 4. Routes
	r.Route("/api/forms", func(r chi.Router) {
		r.Get("/", formHandler.GetForms)
		r.Post("/", formHandler.CreateForm)
		r.Get("/{id}", formHandler.GetFormByID)
	})

	// 5. Start Server
	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}