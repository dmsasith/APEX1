export interface ThemeConfig {
  id: string;
  name: string;
  tagline: string;
  accentHex: string;
  secondaryHex: string;
  swatchGradient: string;
  headerBg: string;
  headerSubBarBg: string;
  headerBorder: string;
  headerPillBg: string;
  headerInputBg: string;
  topRuleBg: string;
  logoBadgeBg: string;
  logoBadgeText: string;
  accentText: string;
  accentHoverText: string;
  subAccentText: string;
  accentBadge: string;
  primaryCtaBg: string;
  navContainerBg: string;
  navGlowPrimary: string;
  navGlowSecondary: string;
  navTitleBox: string;
  navSectionLabel: string;
  navIconInactive: string;
  navActiveBg: string;
  navActiveText: string;
  navActiveIcon: string;
  navActiveIconWell: string;
  navActiveBadge: string;
  mobileStripBg: string;
  mobileChipActive: string;
  mobileDockActive: string;
  mobileDrawerIcon: string;
  primaryBtn: string;
  pageBg: string;
}

export const APP_THEMES: Record<string, ThemeConfig> = {
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire & Gold',
    tagline: 'Royal Navy Glass · Amber Crystal',
    accentHex: '#fbbf24',
    secondaryHex: '#38bdf8',
    swatchGradient: 'from-[#091533] via-[#173678] to-[#fbbf24]',
    headerBg: 'bg-gradient-to-r from-[#060c1d]/95 via-[#091533]/92 to-[#060c1d]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#050b1a]/88',
    headerBorder: 'border-white/12',
    headerPillBg: 'bg-[#0d1d42]/80 border-white/14',
    headerInputBg: 'bg-[#060c1d]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-amber-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-amber-200/70 shadow-[0_6px_18px_-4px_rgba(251,191,36,0.4),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#071026]',
    accentText: 'text-amber-300',
    accentHoverText: 'hover:text-amber-200',
    subAccentText: 'text-sky-200/70',
    accentBadge: 'bg-amber-400/20 border-amber-400/45 text-amber-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#071026] border-amber-200/70 shadow-[0_6px_16px_-4px_rgba(251,191,36,0.4)]',
    navContainerBg: 'bg-gradient-to-b from-[#071128] via-[#091634] to-[#050c1d]',
    navGlowPrimary: 'bg-sky-400/12',
    navGlowSecondary: 'bg-amber-400/10',
    navTitleBox: 'text-amber-300 bg-[#0d1d42]/80 border-white/15',
    navSectionLabel: 'text-sky-200/65',
    navIconInactive:
      'bg-white/[0.08] text-sky-300 border-white/10 group-hover:text-amber-300 group-hover:border-amber-400/30',
    navActiveBg:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#071026] font-extrabold border border-amber-200/80 shadow-[0_8px_20px_-6px_rgba(251,191,36,0.5),inset_0_1px_0_rgba(255,255,255,0.65)]',
    navActiveText: 'text-[#071026]',
    navActiveIcon: 'text-[#071026]',
    navActiveIconWell: 'bg-[#071026]/12 text-[#071026] border-[#071026]/15',
    navActiveBadge: 'bg-[#071026] text-amber-300',
    mobileStripBg: 'bg-[#071128]/95',
    mobileChipActive:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#071026] font-extrabold border-amber-200/80 shadow-xs',
    mobileDockActive:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#071026] shadow-[0_6px_16px_-3px_rgba(251,191,36,0.5),inset_0_1px_0_rgba(255,255,255,0.65)] scale-105',
    mobileDrawerIcon: 'text-amber-600',
    primaryBtn:
      'bg-amber-400 hover:bg-amber-300 text-[#071026] border border-amber-200/80 shadow-[0_6px_20px_-4px_rgba(251,191,36,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  emerald: {
    id: 'emerald',
    name: 'Liquid Emerald',
    tagline: 'Deep Pine Glass · Crisp Mint Glow',
    accentHex: '#10b981',
    secondaryHex: '#2dd4bf',
    swatchGradient: 'from-[#041d18] via-[#059669] to-[#6ee7b7]',
    headerBg: 'bg-gradient-to-r from-[#041512]/95 via-[#072620]/92 to-[#041512]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#030f0d]/90',
    headerBorder: 'border-emerald-200/12',
    headerPillBg: 'bg-[#083028]/80 border-emerald-200/16',
    headerInputBg: 'bg-[#041512]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-emerald-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-400 border-emerald-200/70 shadow-[0_6px_18px_-4px_rgba(16,185,129,0.4),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#031c16]',
    accentText: 'text-emerald-300',
    accentHoverText: 'hover:text-emerald-200',
    subAccentText: 'text-teal-200/70',
    accentBadge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 hover:from-emerald-200 hover:to-teal-300 text-[#031c16] border-emerald-200/70 shadow-[0_6px_16px_-4px_rgba(16,185,129,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#051915] via-[#072620] to-[#03100d]',
    navGlowPrimary: 'bg-emerald-400/14',
    navGlowSecondary: 'bg-teal-400/12',
    navTitleBox: 'text-emerald-300 bg-[#083028]/80 border-emerald-200/16',
    navSectionLabel: 'text-teal-200/65',
    navIconInactive:
      'bg-white/[0.08] text-emerald-300 border-white/10 group-hover:text-teal-200 group-hover:border-emerald-400/35',
    navActiveBg:
      'bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 text-[#031c16] font-extrabold border border-emerald-200/80 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.65)]',
    navActiveText: 'text-[#031c16]',
    navActiveIcon: 'text-[#031c16]',
    navActiveIconWell: 'bg-[#031c16]/12 text-[#031c16] border-[#031c16]/15',
    navActiveBadge: 'bg-[#031c16] text-emerald-300',
    mobileStripBg: 'bg-[#051915]/95',
    mobileChipActive:
      'bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 text-[#031c16] font-extrabold border-emerald-200/80 shadow-xs',
    mobileDockActive:
      'bg-emerald-500 text-white shadow-[0_6px_16px_-3px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-emerald-600',
    primaryBtn:
      'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(16,185,129,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  teal: {
    id: 'teal',
    name: 'Oceanic Teal',
    tagline: 'Abyssal Cyan Glass · Seafoam Mint',
    accentHex: '#14b8a6',
    secondaryHex: '#06b6d4',
    swatchGradient: 'from-[#041b20] via-[#0d9488] to-[#5eead4]',
    headerBg: 'bg-gradient-to-r from-[#04161a]/95 via-[#072930]/92 to-[#04161a]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#031014]/90',
    headerBorder: 'border-cyan-200/12',
    headerPillBg: 'bg-[#09323b]/80 border-cyan-200/16',
    headerInputBg: 'bg-[#04161a]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-teal-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-400 border-teal-200/70 shadow-[0_6px_18px_-4px_rgba(45,212,191,0.4),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#041d22]',
    accentText: 'text-teal-300',
    accentHoverText: 'hover:text-teal-200',
    subAccentText: 'text-cyan-200/70',
    accentBadge: 'bg-teal-500/20 border-teal-400/40 text-teal-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 hover:from-teal-200 hover:to-cyan-300 text-[#041d22] border-teal-200/70 shadow-[0_6px_16px_-4px_rgba(45,212,191,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#04181d] via-[#072830] to-[#031115]',
    navGlowPrimary: 'bg-teal-400/14',
    navGlowSecondary: 'bg-cyan-400/12',
    navTitleBox: 'text-teal-300 bg-[#09323b]/80 border-cyan-200/16',
    navSectionLabel: 'text-cyan-200/65',
    navIconInactive:
      'bg-white/[0.08] text-cyan-300 border-white/10 group-hover:text-teal-200 group-hover:border-teal-400/35',
    navActiveBg:
      'bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 text-[#041d22] font-extrabold border border-teal-200/80 shadow-[0_8px_20px_-6px_rgba(45,212,191,0.5),inset_0_1px_0_rgba(255,255,255,0.65)]',
    navActiveText: 'text-[#041d22]',
    navActiveIcon: 'text-[#041d22]',
    navActiveIconWell: 'bg-[#041d22]/12 text-[#041d22] border-[#041d22]/15',
    navActiveBadge: 'bg-[#041d22] text-teal-300',
    mobileStripBg: 'bg-[#04181d]/95',
    mobileChipActive:
      'bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 text-[#041d22] font-extrabold border-teal-200/80 shadow-xs',
    mobileDockActive:
      'bg-teal-500 text-white shadow-[0_6px_16px_-3px_rgba(20,184,166,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-teal-600',
    primaryBtn:
      'bg-teal-600/90 hover:bg-teal-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(20,184,166,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  blue: {
    id: 'blue',
    name: 'Cobalt Azure',
    tagline: 'Marine Cobalt Glass · Ice Sky Frost',
    accentHex: '#38bdf8',
    secondaryHex: '#2563eb',
    swatchGradient: 'from-[#071636] via-[#2563eb] to-[#7dd3fc]',
    headerBg: 'bg-gradient-to-r from-[#061129]/95 via-[#0b214d]/92 to-[#061129]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#040c1f]/90',
    headerBorder: 'border-sky-200/14',
    headerPillBg: 'bg-[#0e295c]/80 border-sky-200/18',
    headerInputBg: 'bg-[#061129]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-sky-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-sky-300 via-sky-400 to-blue-400 border-sky-200/70 shadow-[0_6px_18px_-4px_rgba(56,189,248,0.42),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#06142e]',
    accentText: 'text-sky-300',
    accentHoverText: 'hover:text-sky-200',
    subAccentText: 'text-blue-200/75',
    accentBadge: 'bg-sky-500/20 border-sky-400/40 text-sky-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400 hover:from-sky-200 hover:to-blue-300 text-[#06142e] border-sky-200/70 shadow-[0_6px_16px_-4px_rgba(56,189,248,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#07132e] via-[#0b1f48] to-[#050d21]',
    navGlowPrimary: 'bg-sky-400/15',
    navGlowSecondary: 'bg-blue-400/14',
    navTitleBox: 'text-sky-300 bg-[#0e295c]/80 border-sky-200/18',
    navSectionLabel: 'text-sky-200/65',
    navIconInactive:
      'bg-white/[0.08] text-sky-300 border-white/10 group-hover:text-white group-hover:border-sky-400/35',
    navActiveBg:
      'bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400 text-[#06142e] font-extrabold border border-sky-200/80 shadow-[0_8px_20px_-6px_rgba(56,189,248,0.5),inset_0_1px_0_rgba(255,255,255,0.65)]',
    navActiveText: 'text-[#06142e]',
    navActiveIcon: 'text-[#06142e]',
    navActiveIconWell: 'bg-[#06142e]/12 text-[#06142e] border-[#06142e]/15',
    navActiveBadge: 'bg-[#06142e] text-sky-300',
    mobileStripBg: 'bg-[#07132e]/95',
    mobileChipActive:
      'bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400 text-[#06142e] font-extrabold border-sky-200/80 shadow-xs',
    mobileDockActive:
      'bg-blue-600 text-white shadow-[0_6px_16px_-3px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-blue-600',
    primaryBtn:
      'bg-blue-600/90 hover:bg-blue-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(37,99,235,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  indigo: {
    id: 'indigo',
    name: 'Liquid Indigo',
    tagline: 'Midnight Indigo · Electric Violet',
    accentHex: '#6366f1',
    secondaryHex: '#a5b4fc',
    swatchGradient: 'from-[#0c0f2b] via-[#4f46e5] to-[#a5b4fc]',
    headerBg: 'bg-gradient-to-r from-[#0b0e26]/95 via-[#161b47]/92 to-[#0b0e26]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#07091c]/90',
    headerBorder: 'border-indigo-200/14',
    headerPillBg: 'bg-[#1c2259]/80 border-indigo-200/18',
    headerInputBg: 'bg-[#0b0e26]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-indigo-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-indigo-300 via-indigo-400 to-violet-400 border-indigo-200/70 shadow-[0_6px_18px_-4px_rgba(99,102,241,0.45),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#0c0f2b]',
    accentText: 'text-indigo-300',
    accentHoverText: 'hover:text-indigo-200',
    subAccentText: 'text-violet-200/75',
    accentBadge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-400 hover:from-indigo-200 hover:to-violet-300 text-[#0c0f2b] border-indigo-200/70 shadow-[0_6px_16px_-4px_rgba(99,102,241,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#0c0f2b] via-[#131842] to-[#080a1f]',
    navGlowPrimary: 'bg-indigo-400/15',
    navGlowSecondary: 'bg-violet-400/14',
    navTitleBox: 'text-indigo-300 bg-[#1c2259]/80 border-indigo-200/18',
    navSectionLabel: 'text-indigo-200/65',
    navIconInactive:
      'bg-white/[0.08] text-indigo-300 border-white/10 group-hover:text-violet-200 group-hover:border-indigo-400/35',
    navActiveBg:
      'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white font-extrabold border border-indigo-300/60 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.55),inset_0_1px_0_rgba(255,255,255,0.5)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    navActiveIconWell: 'bg-white/20 text-white border-white/25',
    navActiveBadge: 'bg-white text-indigo-950',
    mobileStripBg: 'bg-[#0c0f2b]/95',
    mobileChipActive:
      'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white font-extrabold border-indigo-300/60 shadow-xs',
    mobileDockActive:
      'bg-indigo-600 text-white shadow-[0_6px_16px_-3px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-indigo-600',
    primaryBtn:
      'bg-indigo-600/90 hover:bg-indigo-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(99,102,241,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  purple: {
    id: 'purple',
    name: 'Liquid Amethyst',
    tagline: 'Royal Aubergine Glass · Orchid Crystal',
    accentHex: '#a855f7',
    secondaryHex: '#e879f9',
    swatchGradient: 'from-[#140926] via-[#7e22ce] to-[#d8b4fe]',
    headerBg: 'bg-gradient-to-r from-[#130824]/95 via-[#220e40]/92 to-[#130824]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#0d051a]/90',
    headerBorder: 'border-purple-200/14',
    headerPillBg: 'bg-[#2a124d]/80 border-purple-200/18',
    headerInputBg: 'bg-[#130824]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-purple-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-purple-300 via-purple-400 to-fuchsia-400 border-purple-200/70 shadow-[0_6px_18px_-4px_rgba(168,85,247,0.45),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#19072e]',
    accentText: 'text-purple-300',
    accentHoverText: 'hover:text-purple-200',
    subAccentText: 'text-fuchsia-200/75',
    accentBadge: 'bg-purple-500/20 border-purple-400/40 text-purple-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-purple-300 via-purple-400 to-fuchsia-400 hover:from-purple-200 hover:to-fuchsia-300 text-[#19072e] border-purple-200/70 shadow-[0_6px_16px_-4px_rgba(168,85,247,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#140926] via-[#1f0e3a] to-[#0e061b]',
    navGlowPrimary: 'bg-purple-400/16',
    navGlowSecondary: 'bg-fuchsia-400/12',
    navTitleBox: 'text-purple-300 bg-[#2a124d]/80 border-purple-200/18',
    navSectionLabel: 'text-purple-200/65',
    navIconInactive:
      'bg-white/[0.08] text-purple-300 border-white/10 group-hover:text-fuchsia-200 group-hover:border-purple-400/35',
    navActiveBg:
      'bg-gradient-to-r from-purple-500 via-purple-600 to-fuchsia-600 text-white font-extrabold border border-purple-300/60 shadow-[0_8px_20px_-6px_rgba(168,85,247,0.55),inset_0_1px_0_rgba(255,255,255,0.5)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    navActiveIconWell: 'bg-white/20 text-white border-white/25',
    navActiveBadge: 'bg-white text-purple-950',
    mobileStripBg: 'bg-[#140926]/95',
    mobileChipActive:
      'bg-gradient-to-r from-purple-500 via-purple-600 to-fuchsia-600 text-white font-extrabold border-purple-300/60 shadow-xs',
    mobileDockActive:
      'bg-purple-600 text-white shadow-[0_6px_16px_-3px_rgba(147,51,234,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-purple-600',
    primaryBtn:
      'bg-purple-600/90 hover:bg-purple-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(147,51,234,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  amber: {
    id: 'amber',
    name: 'Obsidian Amber',
    tagline: 'Smoked Charcoal Glass · Burnished Gold',
    accentHex: '#f59e0b',
    secondaryHex: '#fb923c',
    swatchGradient: 'from-[#161109] via-[#b45309] to-[#fcd34d]',
    headerBg: 'bg-gradient-to-r from-[#140f08]/95 via-[#241a0c]/92 to-[#140f08]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#0e0a05]/90',
    headerBorder: 'border-amber-200/14',
    headerPillBg: 'bg-[#2c200e]/80 border-amber-200/18',
    headerInputBg: 'bg-[#140f08]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-amber-400/90 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 border-amber-200/70 shadow-[0_6px_18px_-4px_rgba(245,158,11,0.45),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#1a1004]',
    accentText: 'text-amber-300',
    accentHoverText: 'hover:text-amber-200',
    subAccentText: 'text-orange-200/75',
    accentBadge: 'bg-amber-500/20 border-amber-400/40 text-amber-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:from-amber-200 hover:to-orange-300 text-[#1a1004] border-amber-200/70 shadow-[0_6px_16px_-4px_rgba(245,158,11,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#151008] via-[#21180b] to-[#0e0b05]',
    navGlowPrimary: 'bg-amber-400/14',
    navGlowSecondary: 'bg-orange-400/12',
    navTitleBox: 'text-amber-300 bg-[#2c200e]/80 border-amber-200/18',
    navSectionLabel: 'text-amber-200/65',
    navIconInactive:
      'bg-white/[0.08] text-amber-300 border-white/10 group-hover:text-orange-200 group-hover:border-amber-400/35',
    navActiveBg:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-[#1a1004] font-extrabold border border-amber-200/80 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.65)]',
    navActiveText: 'text-[#1a1004]',
    navActiveIcon: 'text-[#1a1004]',
    navActiveIconWell: 'bg-[#1a1004]/12 text-[#1a1004] border-[#1a1004]/15',
    navActiveBadge: 'bg-[#1a1004] text-amber-300',
    mobileStripBg: 'bg-[#151008]/95',
    mobileChipActive:
      'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-[#1a1004] font-extrabold border-amber-200/80 shadow-xs',
    mobileDockActive:
      'bg-amber-500 text-[#1a1004] shadow-[0_6px_16px_-3px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-amber-600',
    primaryBtn:
      'bg-amber-600/90 hover:bg-amber-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(217,119,6,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  rose: {
    id: 'rose',
    name: 'Liquid Crimson',
    tagline: 'Velvet Burgundy Glass · Ruby Rose',
    accentHex: '#e11d48',
    secondaryHex: '#fb7185',
    swatchGradient: 'from-[#1a0810] via-[#be123c] to-[#fda4af]',
    headerBg: 'bg-gradient-to-r from-[#19070f]/95 via-[#2b0c19]/92 to-[#19070f]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#12040a]/90',
    headerBorder: 'border-rose-200/14',
    headerPillBg: 'bg-[#361020]/80 border-rose-200/18',
    headerInputBg: 'bg-[#19070f]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-rose-400/85 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-rose-300 via-rose-400 to-pink-400 border-rose-200/70 shadow-[0_6px_18px_-4px_rgba(244,63,94,0.45),inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    logoBadgeText: 'text-[#240611]',
    accentText: 'text-rose-300',
    accentHoverText: 'hover:text-rose-200',
    subAccentText: 'text-pink-200/75',
    accentBadge: 'bg-rose-500/20 border-rose-400/40 text-rose-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-rose-300 via-rose-400 to-pink-400 hover:from-rose-200 hover:to-pink-300 text-[#240611] border-rose-200/70 shadow-[0_6px_16px_-4px_rgba(244,63,94,0.45)]',
    navContainerBg: 'bg-gradient-to-b from-[#1a0810] via-[#290c19] to-[#12050b]',
    navGlowPrimary: 'bg-rose-400/15',
    navGlowSecondary: 'bg-pink-400/12',
    navTitleBox: 'text-rose-300 bg-[#361020]/80 border-rose-200/18',
    navSectionLabel: 'text-rose-200/65',
    navIconInactive:
      'bg-white/[0.08] text-rose-300 border-white/10 group-hover:text-pink-200 group-hover:border-rose-400/35',
    navActiveBg:
      'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white font-extrabold border border-rose-300/60 shadow-[0_8px_20px_-6px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.5)]',
    navActiveText: 'text-white',
    navActiveIcon: 'text-white',
    navActiveIconWell: 'bg-white/20 text-white border-white/25',
    navActiveBadge: 'bg-white text-rose-950',
    mobileStripBg: 'bg-[#1a0810]/95',
    mobileChipActive:
      'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white font-extrabold border-rose-300/60 shadow-xs',
    mobileDockActive:
      'bg-rose-600 text-white shadow-[0_6px_16px_-3px_rgba(225,29,72,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] scale-105',
    mobileDrawerIcon: 'text-rose-600',
    primaryBtn:
      'bg-rose-600/90 hover:bg-rose-500 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(225,29,72,0.4)]',
    pageBg: 'liquid-glass-canvas',
  },
  slate: {
    id: 'slate',
    name: 'Liquid Titanium',
    tagline: 'Graphite Slate Glass · Platinum Chrome',
    accentHex: '#475569',
    secondaryHex: '#cbd5e1',
    swatchGradient: 'from-[#0b101b] via-[#334155] to-[#e2e8f0]',
    headerBg: 'bg-gradient-to-r from-[#0b101b]/95 via-[#182235]/92 to-[#0b101b]/95 backdrop-blur-2xl',
    headerSubBarBg: 'bg-[#070b14]/90',
    headerBorder: 'border-slate-200/14',
    headerPillBg: 'bg-[#1f2c42]/80 border-slate-200/18',
    headerInputBg: 'bg-[#0b101b]',
    topRuleBg: 'bg-gradient-to-r from-transparent via-slate-300/80 to-transparent',
    logoBadgeBg:
      'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-white/80 shadow-[0_6px_18px_-4px_rgba(203,213,225,0.35),inset_0_1.5px_0_rgba(255,255,255,0.9)]',
    logoBadgeText: 'text-[#0f172a]',
    accentText: 'text-slate-200',
    accentHoverText: 'hover:text-white',
    subAccentText: 'text-slate-300/75',
    accentBadge: 'bg-slate-700/50 border-white/25 text-slate-200 backdrop-blur-md',
    primaryCtaBg:
      'bg-gradient-to-r from-slate-100 via-white to-slate-200 hover:from-white hover:to-slate-100 text-[#0f172a] border-white/80 shadow-[0_6px_16px_-4px_rgba(226,232,240,0.35)]',
    navContainerBg: 'bg-gradient-to-b from-[#0d1320] via-[#151e30] to-[#080c15]',
    navGlowPrimary: 'bg-slate-300/12',
    navGlowSecondary: 'bg-sky-300/10',
    navTitleBox: 'text-slate-200 bg-[#1f2c42]/80 border-slate-200/18',
    navSectionLabel: 'text-slate-300/65',
    navIconInactive:
      'bg-white/[0.08] text-slate-300 border-white/10 group-hover:text-white group-hover:border-white/30',
    navActiveBg:
      'bg-gradient-to-r from-slate-100 via-white to-slate-200 text-[#0f172a] font-extrabold border border-white shadow-[0_8px_20px_-6px_rgba(226,232,240,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]',
    navActiveText: 'text-[#0f172a]',
    navActiveIcon: 'text-[#0f172a]',
    navActiveIconWell: 'bg-[#0f172a]/12 text-[#0f172a] border-[#0f172a]/15',
    navActiveBadge: 'bg-[#0f172a] text-white',
    mobileStripBg: 'bg-[#0d1320]/95',
    mobileChipActive:
      'bg-gradient-to-r from-slate-100 via-white to-slate-200 text-[#0f172a] font-extrabold border-white shadow-xs',
    mobileDockActive:
      'bg-slate-800 text-white shadow-[0_6px_16px_-3px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] scale-105',
    mobileDrawerIcon: 'text-slate-700',
    primaryBtn:
      'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/30 shadow-[0_6px_20px_-4px_rgba(15,23,42,0.35)]',
    pageBg: 'liquid-glass-canvas',
  },
};

export function getThemeConfig(themeId?: string): ThemeConfig {
  const key = (themeId || 'sapphire').toLowerCase();
  return APP_THEMES[key] || APP_THEMES['sapphire'];
}
