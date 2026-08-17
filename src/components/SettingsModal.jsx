import React from "react";
import {
  X,
  Globe,
  Palette,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  RotateCcw
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import "./SettingsModal.css";

function SettingsModal({ isOpen, onClose }) {
  const { language, setLanguage, isKhmer } = useTranslation();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setLanguage("km");
    setTheme("system");
  };

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
              <Palette size={20} />
            </div>
            <div>
              <h3>{isKhmer ? "ការកំណត់គេហទំព័រ" : "Website Settings"}</h3>
              <p>{isKhmer ? "កំណត់ភាសា និងពណ៌ស្បែកគេហទំព័រ" : "Customize language, appearance & preferences"}</p>
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

        {/* Modal Body */}
        <div className="settings-modal-body">
          {/* 1. Language Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Globe size={18} className="section-icon text-indigo-500" />
              <div>
                <h4>{isKhmer ? "ភាសា / Language" : "Language"}</h4>
                <small>{isKhmer ? "ជ្រើសរើសភាសាដែលអ្នកចង់ប្រើប្រាស់" : "Select your preferred browsing language"}</small>
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
                <small>{isKhmer ? "ប្តូររូបរាងភ្លឺ ងងឹត ឬតាមប្រព័ន្ធទូរស័ព្ទ/កុំព្យូទ័រ" : "Choose between Light, Dark, or System mode"}</small>
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
        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
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
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
