import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Tag, ArrowRight, Loader2, X } from "lucide-react";
import { getSearchRecommendationsApi } from "../services/recommendationService";
import { useTranslation } from "../context/LanguageContext";
import "./AISearchInput.css";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#F1F1F1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text>
    </svg>`
  );

export default function AISearchInput({
  placeholder,
  initialValue = "",
  onSearchSubmit,
  className = ""
}) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const defaultPlaceholder = placeholder || (language === "km" ? "ស្វែងរកផលិតផល ម៉ាក ឬប្រភេទជាមួយ AI..." : "Search by product name, category, or brand...");

  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced AI Search Suggestion fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getSearchRecommendationsApi(trimmed, 6);
        const dataObj = res?.data || res;
        if (dataObj && typeof dataObj === "object") {
          setSuggestions(dataObj);
          setIsOpen(true);
        } else {
          setSuggestions(null);
        }
      } catch (err) {
        console.warn("AI Search recommendations fetch error:", err);
        setSuggestions(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      navigate("/shop", { state: { initialSearch: query } });
    }
  };

  const handleSelectProduct = (productId) => {
    setIsOpen(false);
    navigate(`/product/${productId}`);
  };

  const handleSelectCategory = (catName) => {
    setIsOpen(false);
    navigate("/shop", { state: { initialCategory: catName } });
  };

  const handleSelectBrand = (brandName) => {
    setIsOpen(false);
    navigate("/shop", { state: { initialSearch: brandName } });
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions(null);
    setIsOpen(false);
  };

  const hasSuggestions =
    suggestions &&
    ((suggestions.categories && suggestions.categories.length > 0) ||
      (suggestions.brands && suggestions.brands.length > 0) ||
      (suggestions.models && suggestions.models.length > 0) ||
      (suggestions.ai_suggestions && suggestions.ai_suggestions.length > 0) ||
      (suggestions.products && suggestions.products.length > 0));

  return (
    <div className={`ai-search-wrapper ${className}`} ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="ai-search-form">
        <Search className="ai-search-icon" size={18} />
        <input
          type="text"
          className="ai-search-input"
          placeholder={placeholder || defaultPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (suggestions && hasSuggestions) {
              setIsOpen(true);
            }
          }}
        />

        {loading ? (
          <Loader2 className="ai-search-spinner spin" size={16} />
        ) : query ? (
          <button
            type="button"
            className="ai-search-clear"
            onClick={clearQuery}
            title="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}

        <button type="submit" className="ai-search-submit-btn">
          {t("common.search", "Search")}
        </button>
      </form>

      {/* Real-time AI Recommendation Autocomplete Dropdown */}
      {isOpen && (
        <div className="ai-search-dropdown">
          {loading && !suggestions && (
            <div className="ai-dropdown-loading">
              <Sparkles className="spin text-green" size={20} />
              <span>Fetching AI suggestions...</span>
            </div>
          )}

          {suggestions && hasSuggestions ? (
            <div className="ai-dropdown-content">
              {/* Header Badge */}
              <div className="ai-dropdown-header">
                <span className="ai-tag">
                  <Sparkles size={12} /> AI Enhanced Search
                </span>
                {suggestions.user_personalized && (
                  <span className="user-personalized-badge">
                    Trained on your activity
                  </span>
                )}
              </div>

              {/* Matching Categories & Brands */}
              {((suggestions.categories && suggestions.categories.length > 0) ||
                (suggestions.brands && suggestions.brands.length > 0)) && (
                <div className="ai-dropdown-section">
                  <div className="section-label">
                    <Tag size={13} /> Categories & Brands
                  </div>
                  <div className="chips-grid">
                    {suggestions.categories?.map((cat) => (
                      <span
                        key={`cat-${cat.id || cat.name}`}
                        className="chip-item category-chip"
                        onClick={() => handleSelectCategory(cat.name)}
                      >
                        📁 {cat.name}
                      </span>
                    ))}
                    {suggestions.brands?.map((brand) => (
                      <span
                        key={`brand-${brand.id || brand.name}`}
                        className="chip-item brand-chip"
                        onClick={() => handleSelectBrand(brand.name)}
                      >
                        🏷️ {brand.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Product Matches */}
              {suggestions.models && suggestions.models.length > 0 && (
                <div className="ai-dropdown-section">
                  <div className="section-label">📱 Matching Products</div>
                  <div className="products-list">
                    {suggestions.models.slice(0, 4).map((model) => (
                      <div
                        key={`model-${model.id}`}
                        className="product-suggestion-item"
                        onClick={() => handleSelectProduct(model.id)}
                      >
                        <img
                          src={model.primary_img || NO_IMAGE_PLACEHOLDER}
                          alt={model.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                          }}
                        />
                        <div className="suggestion-info">
                          <span className="suggestion-name">{model.name}</span>
                          <span className="suggestion-meta">
                            {model.brand ? `${model.brand} · ` : ""}
                            ${Number(model.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <ArrowRight size={14} className="arrow-icon" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Suggested Related Items */}
              {suggestions.ai_suggestions && suggestions.ai_suggestions.length > 0 && (
                <div className="ai-dropdown-section ai-recommended-box">
                  <div className="section-label text-green-label">
                    <Sparkles size={13} /> AI Suggested Related
                  </div>
                  <div className="products-list">
                    {suggestions.ai_suggestions.slice(0, 3).map((item) => {
                      const primaryImg =
                        item.images?.find((i) => i.is_primary)?.image_url ||
                        item.image_url ||
                        item.image ||
                        NO_IMAGE_PLACEHOLDER;
                      return (
                        <div
                          key={`ai-${item.id}`}
                          className="product-suggestion-item ai-item"
                          onClick={() => handleSelectProduct(item.id)}
                        >
                          <img
                            src={primaryImg}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = NO_IMAGE_PLACEHOLDER;
                            }}
                          />
                          <div className="suggestion-info">
                            <span className="suggestion-name">{item.name}</span>
                            <span className="suggestion-meta text-green">
                              ${Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <span className="ai-badge-mini">AI Match</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <div className="ai-dropdown-empty">
                <span>No instant matches found for "{query}"</span>
                <button type="button" onClick={handleSubmit}>
                  Search all catalog <ArrowRight size={14} />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
