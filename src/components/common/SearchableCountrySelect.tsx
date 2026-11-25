import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Search, ChevronDown, Check, X } from 'lucide-react';
import { ALL_WORLD_COUNTRIES, WorldCountryEntry } from '../../utils/worldCountriesData';
import { matchCountryByNameOrCode } from '../../utils/phoneCountryUtils';

interface SearchableCountrySelectProps {
  value: string;
  onChange: (country: WorldCountryEntry) => void;
  variant?: 'dark' | 'light';
  placeholder?: string;
}

export const SearchableCountrySelect: React.FC<SearchableCountrySelectProps> = ({
  value,
  onChange,
  variant = 'dark',
  placeholder = 'Select Operating Country...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedEntry = useMemo<WorldCountryEntry | null>(() => {
    if (!value) return null;
    const exact = ALL_WORLD_COUNTRIES.find(
      (c) =>
        c.name.toLowerCase() === value.trim().toLowerCase() ||
        c.code.toLowerCase() === value.trim().toLowerCase()
    );
    if (exact) return exact;
    const rule = matchCountryByNameOrCode(value);
    if (rule) {
      return (
        ALL_WORLD_COUNTRIES.find((c) => c.code === rule.code) || {
          code: rule.code,
          name: rule.name,
          dialCode: rule.dialCode,
          dialDigits: rule.dialDigits,
          flag: rule.flag,
          defaultCurrency: rule.currencies[0] || '$',
          currencyLabel: rule.currencies[0] || '$',
        }
      );
    }
    return null;
  }, [value]);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_WORLD_COUNTRIES;
    const qDigits = q.replace(/\+/g, '');
    return ALL_WORLD_COUNTRIES.filter((c) => {
      const nameLower = c.name.toLowerCase();
      const codeLower = c.code.toLowerCase();
      const dialLower = c.dialCode.toLowerCase();
      const curLower = c.defaultCurrency.toLowerCase();
      return (
        nameLower.includes(q) ||
        codeLower === q ||
        dialLower.includes(q) ||
        (qDigits.length > 0 && c.dialDigits.startsWith(qDigits)) ||
        curLower === q
      );
    });
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleSelect = (country: WorldCountryEntry) => {
    onChange(country);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredCountries.length > 0 ? Math.min(prev + 1, filteredCountries.length - 1) : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCountries[highlightedIndex];
      if (target) handleSelect(target);
    }
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 pl-9 pr-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
          isDark
            ? 'bg-slate-950/80 border border-slate-800 text-white hover:border-slate-700 focus:outline-none focus:border-emerald-500'
            : 'bg-white border border-slate-300 text-slate-900 font-medium hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900'
        }`}
      >
        <Globe
          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        />
        <span className="truncate flex items-center gap-1.5 min-w-0">
          {selectedEntry ? (
            <>
              <span className="shrink-0">{selectedEntry.flag}</span>
              <span className="truncate font-semibold">{selectedEntry.name}</span>
              <span className={`shrink-0 text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ({selectedEntry.dialCode})
              </span>
            </>
          ) : (
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {value || placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 bottom-full mb-1.5 z-50 rounded-xl shadow-2xl border overflow-hidden ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
          style={{ minWidth: '250px' }}
        >
          {/* Search Input Header */}
          <div
            className={`p-2 border-b flex items-center gap-1.5 ${
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search country, ISO, or +code..."
              className={`w-full bg-transparent text-xs focus:outline-none ${
                isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                className={`p-0.5 rounded hover:bg-slate-800/40 cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                aria-label="Clear country search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results Count Strip */}
          <div
            className={`px-3 py-1 text-[10px] font-medium border-b flex items-center justify-between ${
              isDark
                ? 'border-slate-800/80 text-slate-400 bg-slate-950'
                : 'border-slate-100 text-slate-500 bg-white'
            }`}
          >
            <span>All Countries ({ALL_WORLD_COUNTRIES.length})</span>
            {query.trim() && (
              <span>{filteredCountries.length} matched</span>
            )}
          </div>

          {/* Scrollable List */}
          <div ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-400">
                No countries matched &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredCountries.map((country, idx) => {
                const isSelected =
                  selectedEntry?.code === country.code ||
                  selectedEntry?.name.toLowerCase() === country.name.toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(country)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-left transition cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'bg-emerald-50 text-emerald-800 font-bold'
                        : isHighlighted
                          ? isDark
                            ? 'bg-slate-800/90 text-white'
                            : 'bg-slate-100 text-slate-900'
                          : isDark
                            ? 'text-slate-200 hover:bg-slate-800/70'
                            : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-sm leading-none shrink-0">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {country.dialCode}
                      </span>
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
