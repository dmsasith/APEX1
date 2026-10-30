export interface ThemeConfig {
  id: string;
  name: string;
  accentHex: string;
  headerBg: string;
  headerSubBarBg: string;
  headerBorder: string;
  accentText: string;
  accentBadge: string;
  navActiveBg: string;
  navActiveText: string;
  navActiveIcon: string;
  primaryBtn: string;
  pageBg: string;
}

export const APP_THEMES: Record<string, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    accentHex: '#10b981',
    headerBg: 'bg-slate-900',
    headerSubBarBg: 'bg-slate-950/90',
    headerBorder: 'border-emerald-500/20',
    accentText: 'text-emerald-400',
    accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    navActiveBg: 'bg-emerald-950 text-white border border-emerald-600/40 shadow-xs',
    navActiveText: 'text-emerald-300',
    navActiveIcon: 'text-emerald-400',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    pageBg: 'bg-slate-50',
  },
  blue: {
    id: 'blue',
    name: 'Sapphire Blue',
    accentHex: '#2563eb',
    headerBg: 'bg-slate-950',
    headerSubBarBg: 'bg-blue-950/80',
    headerBorder: 'border-blue-500/30',
    accentText: 'text-blue-400',
    accentBadge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    navActiveBg: 'bg-blue-950 text-white border border-blue-600/50 shadow-xs',
    navActiveText: 'text-blue-300',
    navActiveIcon: 'text-blue-400',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    pageBg: 'bg-slate-100/80',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo Navy',
    accentHex: '#6366f1',
    headerBg: 'bg-[#0f132e]',
    headerSubBarBg: 'bg-[#090c21]',
    headerBorder: 'border-indigo-500/30',
    accentText: 'text-indigo-400',
    accentBadge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    navActiveBg: 'bg-indigo-950 text-white border border-indigo-600/50 shadow-xs',
    navActiveText: 'text-indigo-300',
    navActiveIcon: 'text-indigo-400',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pageBg: 'bg-indigo-50/30',
  },
  purple: {
    id: 'purple',
    name: 'Purple Royal',
    accentHex: '#9333ea',
    headerBg: 'bg-[#180e2b]',
    headerSubBarBg: 'bg-[#0f071f]',
    headerBorder: 'border-purple-500/30',
    accentText: 'text-purple-400',
    accentBadge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    navActiveBg: 'bg-purple-950 text-white border border-purple-600/50 shadow-xs',
    navActiveText: 'text-purple-300',
    navActiveIcon: 'text-purple-400',
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    pageBg: 'bg-purple-50/30',
  },
  amber: {
    id: 'amber',
    name: 'Amber Gold',
    accentHex: '#d97706',
    headerBg: 'bg-[#1c1407]',
    headerSubBarBg: 'bg-[#120c03]',
    headerBorder: 'border-amber-500/30',
    accentText: 'text-amber-400',
    accentBadge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    navActiveBg: 'bg-amber-950 text-white border border-amber-600/50 shadow-xs',
    navActiveText: 'text-amber-300',
    navActiveIcon: 'text-amber-400',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    pageBg: 'bg-amber-50/30',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Rose',
    accentHex: '#e11d48',
    headerBg: 'bg-[#200c14]',
    headerSubBarBg: 'bg-[#14060b]',
    headerBorder: 'border-rose-500/30',
    accentText: 'text-rose-400',
    accentBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    navActiveBg: 'bg-rose-950 text-white border border-rose-600/50 shadow-xs',
    navActiveText: 'text-rose-300',
    navActiveIcon: 'text-rose-400',
    primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    pageBg: 'bg-rose-50/30',
  },
  slate: {
    id: 'slate',
    name: 'Monochrome Slate',
    accentHex: '#475569',
    headerBg: 'bg-slate-900',
    headerSubBarBg: 'bg-slate-950',
    headerBorder: 'border-slate-700',
    accentText: 'text-slate-300',
    accentBadge: 'bg-slate-700/50 border-slate-600 text-slate-200',
    navActiveBg: 'bg-slate-800 text-white border border-slate-600 shadow-xs',
    navActiveText: 'text-slate-200',
    navActiveIcon: 'text-slate-300',
    primaryBtn: 'bg-slate-800 hover:bg-slate-700 text-white',
    pageBg: 'bg-slate-100',
  },
};

export function getThemeConfig(themeId?: string): ThemeConfig {
  const key = (themeId || 'emerald').toLowerCase();
  return APP_THEMES[key] || APP_THEMES['emerald'];
}
