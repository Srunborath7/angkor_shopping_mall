import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Globe,
  Palette,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Check,
  RotateCcw,
  Shield,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Users,
  KeyRound,
  Layers,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import { useTranslation } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { RolesApi, createRoleApi, deleteRoleApi } from "../services/customerService";
import "./SettingsModal.css";

function SettingsModal({ isOpen, onClose }) {
  const { language, setLanguage, isKhmer } = useTranslation();
  const { theme, setTheme } = useTheme();

  // Tab State: "appearance" | "roles"
  const [activeTab, setActiveTab] = useState("appearance");

  // Role Form & List States
  const [rolesList, setRolesList] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: ""
  });

  // Fetch Roles from Backend API (/api/roles)
  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const res = await RolesApi();
      if (res && res.data) {
        setRolesList(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn("Error fetching roles from API:", err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, fetchRoles]);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setLanguage("km");
    setTheme("system");
  };

  // Handle Create Role via POST /api/roles
  const handleCreateRole = async (e) => {
    e.preventDefault();
    const roleName = roleForm.name.trim();
    if (!roleName) {
      Swal.fire({
        title: isKhmer ? "សូមបញ្ចូលឈ្មោះតួនាទី" : "Role Name Required",
        text: isKhmer ? "សូមបញ្ចូលឈ្មោះតួនាទីថ្មីមុនពេលរក្សាទុក" : "Please enter a title for the new role.",
        icon: "warning",
        confirmButtonColor: "#1c7e48"
      });
      return;
    }

    try {
      setCreatingRole(true);
      const payload = {
        name: roleName,
        description: roleForm.description.trim() || undefined
      };

      const res = await createRoleApi(payload);

      // Trigger Confetti
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      Swal.fire({
        title: isKhmer ? "បង្កើតតួនាទីជោគជ័យ!" : "Role Created Successfully!",
        text: isKhmer
          ? `តួនាទី "${roleName}" ត្រូវបានរក្សាទុកក្នុងប្រព័ន្ធតាមរយៈ API (/api/roles)។`
          : `Role "${roleName}" has been created and saved to database via /api/roles.`,
        icon: "success",
        timer: 2200,
        showConfirmButton: false
      });

      // Clear Form & Reload List
      setRoleForm({ name: "", description: "" });
      fetchRoles();
    } catch (err) {
      console.error("Create role error:", err);
      Swal.fire({
        title: isKhmer ? "បរាជ័យក្នុងការបង្កើត" : "Creation Failed",
        text: err?.response?.data?.message || err.message || "Failed to create role via API.",
        icon: "error",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setCreatingRole(false);
    }
  };

  // Handle Delete Role via DELETE /api/roles/:id
  const handleDeleteRole = async (role) => {
    const isProtected =
      String(role.name).toLowerCase().includes("admin") ||
      String(role.name).toLowerCase().includes("super");

    if (isProtected) {
      Swal.fire({
        title: isKhmer ? "មិនអាចលុបបានទេ" : "Action Restricted",
        text: isKhmer
          ? "តួនាទី Admin សំខាន់ៗនៃប្រព័ន្ធមិនអាចលុបបានទេ។"
          : "System administrator roles are core and protected from deletion.",
        icon: "info",
        confirmButtonColor: "#1c7e48"
      });
      return;
    }

    const confirm = await Swal.fire({
      title: isKhmer ? `លុបតួនាទី "${role.name}"?` : `Delete Role "${role.name}"?`,
      text: isKhmer
        ? "តួនាទីនេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធតាមរយៈ API (/api/roles)។"
        : "This role will be deleted permanently via /api/roles.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "បាទ/ចាស លុប" : "Yes, Delete",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteRoleApi(role.id);
      Swal.fire({
        title: isKhmer ? "បានលុបជោគជ័យ!" : "Deleted!",
        text: isKhmer ? `តួនាទី "${role.name}" ត្រូវបានលុបរួចរាល់។` : `Role "${role.name}" removed.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false
      });
      fetchRoles();
    } catch (err) {
      Swal.fire({
        title: isKhmer ? "បរាជ័យ" : "Error",
        text: err?.response?.data?.message || err.message || "Could not delete role.",
        icon: "error"
      });
    }
  };

  // Filtered Roles
  const filteredRoles = rolesList.filter((r) => {
    if (!roleSearch.trim()) return true;
    const q = roleSearch.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      String(r.id)?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div className="settings-title-group">
            <div className="settings-header-icon">
              {activeTab === "appearance" ? <Palette size={20} /> : <Shield size={20} />}
            </div>
            <div>
              <h3>
                {activeTab === "appearance"
                  ? isKhmer
                    ? "ការកំណត់គេហទំព័រ & រូបរាង"
                    : "Website Appearance & Settings"
                  : isKhmer
                  ? "ការគ្រប់គ្រងតួនាទី & បង្កើតថ្មី"
                  : "Role Management & Create Role"}
              </h3>
              <p>
                {activeTab === "appearance"
                  ? isKhmer
                    ? "កំណត់ភាសា និងពណ៌ស្បែកគេហទំព័រ"
                    : "Customize language, theme modes & display"
                  : isKhmer
                  ? "បង្កើតតួនាទីថ្មី និងគ្រប់គ្រងសិទ្ធិតាមរយៈ API (/api/roles)"
                  : "Create new roles and manage permissions via /api/roles"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="settings-modal-nav-tabs">
          <button
            type="button"
            className={`settings-nav-tab ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <Palette size={15} />
            <span>{isKhmer ? "រូបរាង & ភាសា" : "Theme & Language"}</span>
          </button>
          <button
            type="button"
            className={`settings-nav-tab ${activeTab === "roles" ? "active" : ""}`}
            onClick={() => setActiveTab("roles")}
          >
            <Shield size={15} />
            <span>{isKhmer ? "បង្កើត & គ្រប់គ្រងតួនាទី (Roles)" : "Role Management & API"}</span>
            <span className="nav-tab-counter-badge">{rolesList.length}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="settings-modal-body">
          {/* =========================================================================
              TAB 1: THEME & LANGUAGE APPEARANCE
             ========================================================================= */}
          {activeTab === "appearance" && (
            <>
              {/* 1. Language Section */}
              <div className="settings-section">
                <div className="settings-section-header">
                  <Globe size={18} className="section-icon text-indigo-500" />
                  <div>
                    <h4>{isKhmer ? "ភាសា / Language" : "Language"}</h4>
                    <small>
                      {isKhmer
                        ? "ជ្រើសរើសភាសាដែលអ្នកចង់ប្រើប្រាស់"
                        : "Select your preferred browsing language"}
                    </small>
                  </div>
                </div>

                <div className="settings-cards-grid grid-2">
                  {/* Khmer Option */}
                  <div
                    className={`settings-card ${language === "km" ? "active" : ""}`}
                    onClick={() => setLanguage("km")}
                  >
                    <div className="card-flag-badge">🇰🇭</div>
                    <div className="card-info">
                      <strong>ភាសាខ្មែរ (Khmer)</strong>
                      <span>ទំព័រដើម ផលិតផល និងសារជាភាសាខ្មែរ</span>
                    </div>
                    {language === "km" && (
                      <div className="card-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* English Option */}
                  <div
                    className={`settings-card ${language === "en" ? "active" : ""}`}
                    onClick={() => setLanguage("en")}
                  >
                    <div className="card-flag-badge">🇺🇸</div>
                    <div className="card-info">
                      <strong>English (US)</strong>
                      <span>Full English store & AI voice</span>
                    </div>
                    {language === "en" && (
                      <div className="card-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Theme & Appearance Section */}
              <div className="settings-section">
                <div className="settings-section-header">
                  <Palette size={18} className="section-icon text-emerald-500" />
                  <div>
                    <h4>{isKhmer ? "ស្បែកពណ៌ (Theme Mode)" : "Theme & Appearance"}</h4>
                    <small>
                      {isKhmer
                        ? "ប្តូររូបរាងភ្លឺ ងងឹត ឬតាមប្រព័ន្ធទូរស័ព្ទ/កុំព្យូទ័រ"
                        : "Choose between Light, Dark, or System mode"}
                    </small>
                  </div>
                </div>

                <div className="settings-cards-grid grid-3">
                  {/* System Default */}
                  <div
                    className={`settings-card theme-card ${theme === "system" ? "active" : ""}`}
                    onClick={() => setTheme("system")}
                  >
                    <div className="theme-icon-circle system-icon">
                      <Laptop size={18} />
                    </div>
                    <div className="card-info">
                      <strong>{isKhmer ? "តាមប្រព័ន្ធ" : "System"}</strong>
                      <span>{isKhmer ? "ស្វ័យប្រវត្តិតាមឧបករណ៍" : "Auto match device"}</span>
                    </div>
                    {theme === "system" && (
                      <div className="card-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* Light Mode */}
                  <div
                    className={`settings-card theme-card ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="theme-icon-circle light-icon">
                      <Sun size={18} />
                    </div>
                    <div className="card-info">
                      <strong>{isKhmer ? "ពន្លឺ (Light)" : "Light"}</strong>
                      <span>{isKhmer ? "ផ្ទៃសភ្លឺច្បាស់ត្រជាក់ភ្នែក" : "Bright clean theme"}</span>
                    </div>
                    {theme === "light" && (
                      <div className="card-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* Dark Mode */}
                  <div
                    className={`settings-card theme-card ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="theme-icon-circle dark-icon">
                      <Moon size={18} />
                    </div>
                    <div className="card-info">
                      <strong>{isKhmer ? "ងងឹត (Dark)" : "Dark"}</strong>
                      <span>{isKhmer ? "ផ្ទៃខ្មៅប្រណិតកាត់បន្ថយពន្លឺ" : "Deep luxury dark"}</span>
                    </div>
                    {theme === "dark" && (
                      <div className="card-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. AI Assistant Integration Callout */}
              <div className="settings-ai-banner">
                <div className="ai-banner-left">
                  <Sparkles size={20} className="ai-banner-sparkle" />
                  <div>
                    <strong>{isKhmer ? "ជំនួយការឆ្លាតវៃ Angkor AI 2.0" : "Angkor AI 2.0 Assistant"}</strong>
                    <p>
                      {isKhmer
                        ? "ភាសា និងស្បែកពណ៌នឹងត្រូវធ្វើសមកាលកម្មដោយស្វ័យប្រវត្តិជាមួយ ChatBot AI"
                        : "Language & appearance seamlessly sync with your AI assistant"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              TAB 2: ROLE MANAGEMENT & CREATE NEW ROLE (WITH /api/roles API)
             ========================================================================= */}
          {activeTab === "roles" && (
            <div className="settings-roles-view">
              {/* 1. Create New Role Card / Form */}
              <div className="create-role-box-card">
                <div className="create-role-header">
                  <div className="create-role-title-row">
                    <div className="create-role-icon-box">
                      <Plus size={16} />
                    </div>
                    <div>
                      <h5>{isKhmer ? "បង្កើតតួនាទីថ្មី (Create New Role)" : "Create New System Role"}</h5>
                      <p>{isKhmer ? "បង្កើតតួនាទីបុគ្គលិកថ្មីរក្សាទុកក្នុង Database តាមរយៈ API /api/roles" : "Add a custom role and persist to database via POST /api/roles"}</p>
                    </div>
                  </div>
                  <span className="api-endpoint-badge">API: POST /api/roles</span>
                </div>

                <form onSubmit={handleCreateRole} className="create-role-form">
                  <div className="role-form-inputs-grid">
                    <div className="role-input-group">
                      <label>
                        {isKhmer ? "ឈ្មោះតួនាទី *" : "Role Title / Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isKhmer ? "ឧ. Cashier, Store Manager, IT Support..." : "e.g. Cashier, Store Manager, Sales..."}
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        className="role-text-input"
                      />
                    </div>

                    <div className="role-input-group">
                      <label>
                        {isKhmer ? "ការពិពណ៌នាពីតួនាទី" : "Description / Purpose"}
                      </label>
                      <input
                        type="text"
                        placeholder={isKhmer ? "ឧ. គ្រប់គ្រងការគិតលុយ និងចេញវិក្កយបត្រ..." : "e.g. In charge of POS checkout and invoice..."}
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        className="role-text-input"
                      />
                    </div>
                  </div>

                  <div className="create-role-action-bar">
                    <div className="quick-role-suggestions">
                      <span>{isKhmer ? "គំរូតួនាទី:" : "Quick Ideas:"}</span>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ name: "Cashier", description: "Handles cashier counter and customer receipt invoicing." })}
                        className="role-chip-btn"
                      >
                        Cashier
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ name: "Inventory Specialist", description: "Monitors warehouse stock, purchase orders and goods arrivals." })}
                        className="role-chip-btn"
                      >
                        Inventory
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ name: "Sales Associate", description: "Assists customers with product specifications and recommendations." })}
                        className="role-chip-btn"
                      >
                        Sales
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingRole || !roleForm.name.trim()}
                      className="btn-create-role-submit"
                    >
                      {creatingRole ? (
                        <span>{isKhmer ? "កំពុងបង្កើត..." : "Creating..."}</span>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>{isKhmer ? "បង្កើតតួនាទីថ្មី" : "Create Role via API"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Existing Roles Directory List */}
              <div className="existing-roles-section">
                <div className="existing-roles-header">
                  <div className="existing-roles-title">
                    <Shield size={16} className="text-emerald-600" />
                    <strong>{isKhmer ? "បញ្ជីតួនាទីក្នុងប្រព័ន្ធ" : "System Roles Directory"}</strong>
                    <span className="roles-count-pill">{rolesList.length}</span>
                  </div>

                  <div className="role-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder={isKhmer ? "ស្វែងរកតួនាទី..." : "Search roles..."}
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                    />
                    {roleSearch && (
                      <button type="button" onClick={() => setRoleSearch("")} className="clear-search-btn">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {loadingRoles ? (
                  <div className="roles-loading-state">
                    <div className="roles-spinner" />
                    <span>{isKhmer ? "កំពុងទាញយកបញ្ជីតួនាទីពី API..." : "Loading roles from /api/roles..."}</span>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="roles-empty-state">
                    <AlertCircle size={28} className="text-amber-500" />
                    <p>{isKhmer ? "រកមិនឃើញតួនាទីដែលត្រូវគ្នានឹងការស្វែងរកទេ" : "No matching roles found."}</p>
                  </div>
                ) : (
                  <div className="roles-list-cards-grid">
                    {filteredRoles.map((role) => {
                      const isCoreAdmin =
                        String(role.name).toLowerCase().includes("admin") ||
                        String(role.name).toLowerCase().includes("super");
                      const isManager = String(role.name).toLowerCase().includes("manager");

                      return (
                        <div key={role.id} className="role-item-card">
                          <div className="role-item-main">
                            <div className="role-badge-icon-box">
                              {isCoreAdmin ? (
                                <KeyRound size={16} style={{ color: "#dc2626" }} />
                              ) : isManager ? (
                                <Users size={16} style={{ color: "#2563eb" }} />
                              ) : (
                                <Layers size={16} style={{ color: "#16a34a" }} />
                              )}
                            </div>
                            <div className="role-item-details">
                              <div className="role-name-row">
                                <h6>{role.name}</h6>
                                <span className={`role-type-tag ${isCoreAdmin ? "super" : isManager ? "manager" : "staff"}`}>
                                  {isCoreAdmin ? "Core System" : isManager ? "Management" : "Operational"}
                                </span>
                              </div>
                              <p className="role-desc-text">
                                {role.description || (isKhmer ? "តួនាទីប្រតិបត្តិការទូទៅក្នុងប្រព័ន្ធ" : "Operational role in Angkor Mall")}
                              </p>
                              <div className="role-item-meta">
                                <span>ID: <code className="role-id-code">{String(role.id).slice(0, 8)}...</code></span>
                                {role.created_at && (
                                  <span>• {isKhmer ? "បង្កើត:" : "Created:"} {new Date(role.created_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {!isCoreAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              className="btn-delete-role-row"
                              title={isKhmer ? "លុបតួនាទី" : "Delete Role"}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
          {activeTab === "appearance" ? (
            <>
              <button
                type="button"
                className="btn-reset-settings"
                onClick={handleResetDefaults}
              >
                <RotateCcw size={14} /> {isKhmer ? "កំណត់ដើមឡើងវិញ" : "Reset Defaults"}
              </button>
              <button
                type="button"
                className="btn-save-settings"
                onClick={onClose}
              >
                {isKhmer ? "រួចរាល់ / បិទ" : "Done / Save"}
              </button>
            </>
          ) : (
            <>
              <div className="roles-footer-info">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{isKhmer ? "ទិន្នន័យតួនាទីត្រូវបាន Sync ជាមួយ DB តាម /api/roles" : "Roles synced with database via /api/roles"}</span>
              </div>
              <button
                type="button"
                className="btn-save-settings"
                onClick={onClose}
              >
                {isKhmer ? "រួចរាល់ / បិទ" : "Close"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
