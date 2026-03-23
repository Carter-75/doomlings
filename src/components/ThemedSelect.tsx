'use client';

import React from 'react';

export interface ThemedSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ThemedSelectProps {
  value: string;
  options: ThemedSelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

export default function ThemedSelect({ value, options, placeholder, onChange }: ThemedSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const selectedOption = value === '' ? undefined : options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="themed-select">
      <button
        type="button"
        className={`themed-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`themed-select-value ${selectedOption ? '' : 'placeholder'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="themed-select-arrow">▾</span>
      </button>

      {open && (
        <ul className="themed-select-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`themed-select-option ${isSelected ? 'selected' : ''}`}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) {
                      return;
                    }
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .themed-select {
          position: relative;
          width: 100%;
        }

        .themed-select-trigger {
          width: 100%;
          min-height: 38px;
          border-radius: var(--border-radius-small);
          border: 1px solid rgba(var(--primary-rgb), 0.38);
          background: linear-gradient(135deg, var(--light-bg), var(--lighter-bg));
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .themed-select-trigger:hover {
          border-color: rgba(var(--secondary-rgb), 0.7);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(var(--secondary-rgb), 0.2);
        }

        .themed-select-trigger.open {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.22);
        }

        .themed-select-value.placeholder {
          color: var(--text-muted);
          font-weight: 600;
        }

        .themed-select-arrow {
          color: var(--text-secondary);
          font-size: 0.78rem;
          transition: transform 0.2s ease;
        }

        .themed-select-trigger.open .themed-select-arrow {
          transform: rotate(180deg);
        }

        .themed-select-menu {
          position: absolute;
          z-index: 40;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          margin: 0;
          padding: 6px;
          list-style: none;
          border-radius: 10px;
          border: 1px solid rgba(var(--primary-rgb), 0.38);
          background: var(--darker-bg);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
          max-height: 220px;
          overflow-y: auto;
        }

        .themed-select-option {
          width: 100%;
          text-align: left;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          padding: 8px 10px;
          cursor: pointer;
          font-size: 0.86rem;
          font-weight: 600;
          transition: background 0.15s ease;
        }

        .themed-select-option:hover {
          background: rgba(var(--secondary-rgb), 0.18);
        }

        .themed-select-option.selected {
          background: rgba(var(--primary-rgb), 0.18);
          color: var(--primary-orange);
        }

        .themed-select-option:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
