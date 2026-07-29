import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { FaTimes } from "react-icons/fa";
import "./Modal.css";

function Modal({ isOpen, onClose, title, children, size = "md" }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open-body");
    } else {
      document.body.classList.remove("modal-open-body");
    }
    return () => {
      document.body.classList.remove("modal-open-body");
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className={`custom-modal-container ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <h3 className="custom-modal-title">{title}</h3>
          <button className="custom-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>
        </div>
        <div className="custom-modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
