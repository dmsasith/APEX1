import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, ChevronDown, Check, Search, MapPin, Star } from 'lucide-react';
import { Site } from '../../types';
import { sortSitesHierarchically, isSubSite, getParentSite } from '../../types';

interface SiteSelectorProps {
  value: string;
  onChange: (siteId: string) => void;
  sites: Site[];
  allSites: Site[];
  includeAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({
  value,
  onChange,
  sites,
  allSites,
  includeAllOption = true,
  allOptionLabel = '🏢 All Branches & Yards (All Sites)',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hierarchicalSites = useMemo(() => {
    return sortSitesHierarchically(sites);
  }, [sites]);

  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return hierarchicalSites;
    return hierarchicalSites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q))
    );
  }, [hierarchicalSites, searchQuery]);

  const selectedSite = useMemo(() => {
    if (!value || value === 'all' || value === 'ALL_AREAS') return null;
    return allSites.find((s) => s.id === value) || sites.find((s) => s.id === value);
  }, [value, allSites, sites]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const renderSelectedDisplay = () => {
    if (value === 'all' || value === 'ALL_AREAS' || !value) {
      return (
        <span className="flex items-center gap-2 truncate font-bold text-slate-800">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{allOptionLabel}</span>
        </span>
      );
    }
    if (!selectedSite) {
      return <span className="text-slate-500 font-medium">Select Branch / Yard...</span>;
    }

    const isMain = selectedSite.isMainWarehouse;
    const isSub = isSubSite(selectedSite);
    const parent = isSub ? getParentSite(selectedSite, allSites) : undefined;

    return (
      <span className="flex items-center gap-2 truncate">
        {isMain ? (
          <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
        ) : isSub ? (
          <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
        ) : (
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span className="font-extrabold truncate text-slate-900">
          {isSub ? `↳ 🏬 ${selectedSite.name}` : isMain ? `⭐ ${selectedSite.name} [Main HQ]` : `🏢 ${selectedSite.name}`}
        </span>
        {selectedSite.location && (
          <span className="text-[11px] font-medium text-slate-500 truncate">({selectedSite.location})</span>
        )}
        {isSub && parent && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
            Under {parent.name}
          </span>
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer ${
          disabled
            ? 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed opacity-90'
            : 'bg-white hover:bg-slate-50/80 border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 truncate">{renderSelectedDisplay()}</div>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search branch name, location, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {includeAllOption && (
              <div
                onClick={() => {
                  onChange('all');
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  value === 'all' || value === 'ALL_AREAS'
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-black">🌐</span>
                  <span>{allOptionLabel}</span>
                </div>
                {(value === 'all' || value === 'ALL_AREAS') && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
            )}

            {filteredSites.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400">No matching branches found</div>
            ) : (
              filteredSites.map((s) => {
                const isMain = s.isMainWarehouse;
                const isSub = isSubSite(s);
                const parent = isSub ? getParentSite(s, allSites) : undefined;
                const isSelected = value === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      onChange(s.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? isSub
                          ? 'bg-sky-100 text-sky-950 border border-sky-400 shadow-2xs font-extrabold'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-400 shadow-2xs font-extrabold'
                        : isSub
                        ? 'bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 border-l-4 border-sky-400 font-bold'
                        : isMain
                        ? 'bg-amber-50/60 hover:bg-amber-100/80 text-amber-950 font-extrabold border-l-4 border-amber-400'
                        : 'hover:bg-slate-100 text-slate-900 font-bold border-l-4 border-emerald-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isMain ? (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      ) : isSub ? (
                        <span className="text-sky-600 font-black text-xs shrink-0 pl-1">↳ 🏬</span>
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <div className="flex flex-col truncate">
                        <span className="truncate">
                          {isSub ? `Sub-Site: ${s.name}` : isMain ? `${s.name} [Main HQ]` : `${s.name}`}
                        </span>
                        {s.location && (
                          <span className={`text-[10px] font-medium truncate ${isSub ? 'text-sky-700/80' : 'text-slate-500'}`}>
                            Location: {s.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSub && parent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-900 border border-sky-300">
                          {parent.name}
                        </span>
                      )}
                      {!isSub && !isMain && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300">
                          Regional
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
