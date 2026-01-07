package handlers

import (
	"encoding/json"
	"html/template"
	"net/http"
	"path/filepath"
	"strconv"

	"backend/services" // Ensure this exists

	"github.com/go-chi/chi/v5"
)

type FormHandler struct {
	service services.FormService
}

func NewFormHandler(service services.FormService) *FormHandler {
	return &FormHandler{service: service}
}

// Helper struct for template
type FormElement struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Label       string `json:"label"`
	Required    bool   `json:"required"`
	Placeholder string `json:"placeholder"`
}

type TemplateData struct {
	ID       uint
	Name     string
	Elements []FormElement
}

// CreateForm
func (h *FormHandler) CreateForm(w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name     string `json:"name"`
		Elements string `json:"elements"`
	}
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	form, err := h.service.CreateForm(req.Name, req.Elements)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// GetForms
func (h *FormHandler) GetForms(w http.ResponseWriter, r *http.Request) {
	forms, err := h.service.GetAllForms()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forms)
}

// GetForm
func (h *FormHandler) GetForm(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	form, err := h.service.GetForm(id)
	if err != nil {
		http.Error(w, "Form not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// ServeFormHTML
func (h *FormHandler) ServeFormHTML(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	form, err := h.service.GetForm(id)
	if err != nil {
		http.Error(w, "Form not found", http.StatusNotFound)
		return
	}

	var elements []FormElement
	if err := json.Unmarshal([]byte(form.Elements), &elements); err != nil {
		http.Error(w, "Failed to parse form data", http.StatusInternalServerError)
		return
	}

	data := TemplateData{
		ID:       form.ID,
		Name:     form.Name,
		Elements: elements,
	}

	// Template path resolution
	// Try "backend/templates/view_form.html" first (running from root)
	tmplPath := filepath.Join("backend", "templates", "view_form.html")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		// Fallback for running inside backend dir
		tmpl, err = template.ParseFiles(filepath.Join("templates", "view_form.html"))
		if err != nil {
			http.Error(w, "Template error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "text/html")
	tmpl.Execute(w, data)
}

// SubmitForm
func (h *FormHandler) SubmitForm(w http.ResponseWriter, r *http.Request) {
	// Placeholder until Submission Service is added
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Submission received (Logic Pending)"})
}
