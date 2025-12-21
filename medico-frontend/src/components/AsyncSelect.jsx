import React, { useState, useEffect, useRef } from "react";
import "./AsyncSelect.css";

/**
 * AsyncSelect - A searchable dropdown component for foreign key fields
 * 
 * @param {string} value - The selected value (PK)
 * @param {function} onChange - Callback when selection changes (receives PK value)
 * @param {function} fetchOptions - Async function that returns options array
 * @param {function} getOptionLabel - Function to format option label: (option) => string
 * @param {function} getOptionValue - Function to get PK from option: (option) => string
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Is field required
 * @param {boolean} disabled - Is field disabled
 * @param {string} className - Additional CSS classes
 */
const AsyncSelect = ({
  value,
  onChange,
  fetchOptions,
  getOptionLabel,
  getOptionValue,
  placeholder = "Select...",
  required = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load initial options and selected label
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // If we have a value, search for it specifically first
        if (value) {
          const searchOptions = await fetchOptions(value);
          const found = searchOptions.find(opt => getOptionValue(opt) === value);
          if (found) {
            setSelectedLabel(getOptionLabel(found));
            setOptions(searchOptions || []);
            setLoading(false);
            return;
          }
        }
        
        // Otherwise, load initial options
        const fetchedOptions = await fetchOptions("");
        setOptions(fetchedOptions || []);
        
        // Find and set selected label if value exists
        if (value) {
          const selected = fetchedOptions.find(opt => getOptionValue(opt) === value);
          if (selected) {
            setSelectedLabel(getOptionLabel(selected));
          }
        }
      } catch (error) {
        console.error("Error loading options:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [value, fetchOptions, getOptionLabel, getOptionValue]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!isOpen) return;

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const fetchedOptions = await fetchOptions(searchTerm);
        setOptions(fetchedOptions || []);
      } catch (error) {
        console.error("Error searching options:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen, fetchOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    onChange(optionValue);
    setSelectedLabel(optionLabel);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm) return true;
    const label = getOptionLabel(opt).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  return (
    <div className={`async-select-container ${className}`} ref={containerRef}>
      <div
        className={`async-select ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedLabel ? (
          <span className="async-select-value">{selectedLabel}</span>
        ) : (
          <span className="async-select-placeholder">{placeholder}</span>
        )}
        {value && !disabled && (
          <button
            type="button"
            className="async-select-clear"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        <span className="async-select-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="async-select-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="async-select-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="async-select-options">
            {loading ? (
              <div className="async-select-loading">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="async-select-no-results">No options found</div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const isSelected = value === optionValue;
                return (
                  <div
                    key={optionValue || index}
                    className={`async-select-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(option)}
                  >
                    {optionLabel}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {required && !value && (
        <span className="async-select-error">This field is required</span>
      )}
    </div>
  );
};

export default AsyncSelect;
