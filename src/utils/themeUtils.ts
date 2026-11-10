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
    name: 'Liquid Emerald',
    accentHex: '#10b981',
    headerBg: 'bg-slate-900/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-slate-950/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-emerald-400',
    accentBadge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 backdrop-blur-md',
    navActiveBg: 'bg-emerald-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  blue: {
    id: 'blue',
    name: 'Liquid Sapphire',
    accentHex: '#2563eb',
    headerBg: 'bg-slate-900/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-blue-950/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-blue-400',
    accentBadge: 'bg-blue-500/20 border-blue-400/40 text-blue-200 backdrop-blur-md',
    navActiveBg: 'bg-blue-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-blue-600/90 hover:bg-blue-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  indigo: {
    id: 'indigo',
    name: 'Liquid Indigo',
    accentHex: '#6366f1',
    headerBg: 'bg-[#0f132e]/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-[#090c21]/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-indigo-400',
    accentBadge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 backdrop-blur-md',
    navActiveBg: 'bg-indigo-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(99,102,241,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-indigo-600/90 hover:bg-indigo-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  purple: {
    id: 'purple',
    name: 'Liquid Amethyst',
    accentHex: '#9333ea',
    headerBg: 'bg-[#180e2b]/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-[#0f071f]/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-purple-400',
    accentBadge: 'bg-purple-500/20 border-purple-400/40 text-purple-200 backdrop-blur-md',
    navActiveBg: 'bg-purple-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(147,51,234,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-purple-600/90 hover:bg-purple-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  amber: {
    id: 'amber',
    name: 'Liquid Amber',
    accentHex: '#d97706',
    headerBg: 'bg-[#1c1407]/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-[#120c03]/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-amber-400',
    accentBadge: 'bg-amber-500/20 border-amber-400/40 text-amber-200 backdrop-blur-md',
    navActiveBg: 'bg-amber-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(217,119,6,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-amber-600/90 hover:bg-amber-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(217,119,6,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  rose: {
    id: 'rose',
    name: 'Liquid Crimson',
    accentHex: '#e11d48',
    headerBg: 'bg-[#200c14]/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-[#14060b]/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-rose-400',
    accentBadge: 'bg-rose-500/20 border-rose-400/40 text-rose-200 backdrop-blur-md',
    navActiveBg: 'bg-rose-600/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(225,29,72,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-rose-600/90 hover:bg-rose-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(225,29,72,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
  slate: {
    id: 'slate',
    name: 'Liquid Titanium',
    accentHex: '#475569',
    headerBg: 'bg-slate-900/78 backdrop-blur-2xl saturate-180',
    headerSubBarBg: 'bg-slate-950/65 backdrop-blur-xl',
    headerBorder: 'border-white/15',
    accentText: 'text-slate-300',
    accentBadge: 'bg-slate-700/50 border-white/25 text-slate-200 backdrop-blur-md',
    navActiveBg: 'bg-slate-800/90 text-white border border-white/40 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    primaryBtn: 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]',
    pageBg: 'liquid-glass-canvas',
  },
};

export function getThemeConfig(themeId?: string): ThemeConfig {
  const key = (themeId || 'emerald').toLowerCase();
  return APP_THEMES[key] || APP_THEMES['emerald'];
}

