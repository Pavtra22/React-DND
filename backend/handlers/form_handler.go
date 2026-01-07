package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/services"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type FormHandler struct {
	service services.FormService
}

func NewFormHandler(service services.FormService) *FormHandler {
	return &FormHandler{service: service}
}

// GET /api/forms
func (h *FormHandler) GetForms(w http.ResponseWriter, r *http.Request) {
	forms, err := h.service.GetAllForms()
	if err != nil {
		http.Error(w, "Failed to fetch forms", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forms)
}

// POST /api/forms
func (h *FormHandler) CreateForm(w http.ResponseWriter, r *http.Request) {
	// Define a temporary struct for decoding request body
	type CreateRequest struct {
		Name     string `json:"name"`
		Elements string `json:"elements"`
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	form, err := h.service.CreateForm(req.Name, req.Elements)
	if err != nil {
		if err.Error() == "name and elements are required" {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, "Failed to create form", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// GET /api/forms/{id}
func (h *FormHandler) GetFormByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	form, err := h.service.GetForm(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Form not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}