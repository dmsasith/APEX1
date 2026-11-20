import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquareText,
  Send,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Minimize2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  resolveSmartSystemSupportAnswer,
  SupportWorkspaceContext,
} from '../../utils/supportKnowledgeEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedTab?: string;
}

interface QuickPrompt {
  id: string;
  labelEn: string;
  labelSi: string;
  promptEn: string;
  promptSi: string;
  targetTab?: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'telecom-new-connection-nc',
    labelEn: '🌐 Telecom, Water, Electric & Solar Templates + "+ Add Field"?',
    labelSi: '🌐 Telecom, Water, Electric, Solar Templates සහ "+ Add Field"?',
    promptEn: 'How do the International Section Templates (Telecom New Connection, Water Project, Electrical Power, Solar PV) and the "+ Add Field" custom field builder work for registration and 3-step Daily Progress?',
    promptSi: 'Telecom New Connection, Water Project, Electric, Solar Project සඳහා International Section Templates load කරලා "+ Add Field" මගින් අලුත් fields දාලා Register සහ 1-2-3 Daily Progress කරන්නේ කොහොමද?',
    targetTab: 'projects',
  },
  {
    id: 'team-site-transfer-stock-to-return',
    labelEn: '👷‍♂️ Team Site Transfer, "Stock to Return" & Name Lock?',
    labelSi: '👷‍♂️ Team Site Transfer, "Stock to Return" සහ Name Lock?',
    promptEn: 'How do Field Team Site Transfers (Temporary Assigned vs. Permanent with Ref: Previous Site), Site-Separated Team In-Hand Stock ("Stock to Return - [Site Name]"), and Team Name locking after stock issue work?',
    promptSi: 'Team එකක් වෙන Site එකකට Transfer කිරීම (Temporary vs Permanent Ref: Old Site), Team In-Hand Stock වල "Stock to Return - [Site Name]" වෙනම පෙන්වීම සහ බඩු ගත් Team Name වෙනස් කිරීම Lock වීම වැඩ කරන්නේ කොහොමද?',
    targetTab: 'team-stock',
  },
  {
    id: 'item-lifecycle-summary',
    labelEn: '📋 Item Lifecycle & Forward Summary?',
    labelSi: '📋 Item Select කළාම Summary බලන්නේ කොහොමද?',
    promptEn: 'How do I view and print the End-to-End Item Lifecycle Summary in Central Stock and the Forward Traceability Summary in Site Branch Stock?',
    promptSi: 'Central Stock එකේ සහ Site Branch Stock එකේ Item එකක් Select කළාම යටින් පෙන්වන සම්පූර්ණ Summary එක බලලා Print කරගන්නේ කොහොමද?',
    targetTab: 'main-stock',
  },
  {
    id: 'format-signers-digital-signatures',
    labelEn: '✒️ Format Settings, Signers & Digital Signatures?',
    labelSi: '✒️ Format Settings, Signers සහ Digital Signatures හදන්නේ කොහොමද?',
    promptEn: 'How do I configure ISO 9001:2015 Format Settings, Auto Tenant Header, Signers (Prepared/Approved/Reviewed), and Digital Signatures (draw or upload) in Document Templates?',
    promptSi: 'Document Templates වල ISO Format Settings, Auto Tenant Header, Signers (අත්සන් කරන නිලධාරීන්ගේ නම්/තනතුරු) සහ Digital Signatures (අඳින හෝ Upload කරන) සකස් කරගන්නේ කොහොමද?',
    targetTab: 'templates',
  },
  {
    id: 'main-sub-projects-foc',
    labelEn: '🎁 5-Stage Free Stock Reconciliation & ALL AREAS?',
    labelSi: '🎁 පියවර 5 Free Stock Reconciliation සහ ALL AREAS?',
    promptEn: 'How do the 5-Stage Client FOC Reconciliation Flow (Central -> Site -> Team -> Usage/Wastage -> Completion Returnable Balance), Sub-Project & Full Project Reports, Central FOC tags in Site Stock, and ALL AREAS branch projects work?',
    promptSi: 'පියවර 5 Client Free Stock (FOC) Reconciliation Flow (Central -> Site -> Team -> Usage/Wastage -> Returnable Balance), Main/Sub-Project Reports, Site Stock හි Central FOC Badge සහ ALL AREAS විකල්පය වැඩ කරන්නේ කොහොමද?',
    targetTab: 'client-free-stock',
  },
  {
    id: 'new-connection-foc-hierarchy',
    labelEn: '🔌 Main Project -> New Connection FOC?',
    labelSi: '🔌 Main Project -> New Connection FOC?',
    promptEn: 'How does the Main Project -> Under New Connections structure work across Telecom, Water, Electrical, and Solar sections, and why does the FOC dropdown filter by active section?',
    promptSi: 'Telecom, Water, Electrical, Solar New Connections සඳහා Main Project -> Under New Connections ක්‍රමය සහ අදාළ Section එකට FOC ලැබුණු Main Projects පමණක් Filter වී පෙන්වන ආකාරය කියන්න.',
    targetTab: 'project-usage',
  },
  {
    id: 'project-sections-templates',
    labelEn: '🧩 New Section Templates & "+ Add Field" Builder?',
    labelSi: '🧩 අලුත් Project Sections, "+ Add Field" සහ BOM Templates?',
    promptEn: 'How do I create a new Project Section using International Industry Templates (Telecom, Water, Electric, Solar), add custom fields with "+ Add Field", and configure its Default Material Template (BOM)?',
    promptSi: 'Project & New Section Registry එකේ International Templates (Telecom, Water, Electric, Solar) තෝරලා, "+ Add Field" වලින් අලුත් Fields දාලා, Material Template (BOM) එකක් හදන්නේ කොහොමද?',
    targetTab: 'projects',
  },
  {
    id: 'grn',
    labelEn: '📦 How to add Main Stock (GRN)?',
    labelSi: '📦 Main Stock එකට GRN දාන්නේ කොහොමද?',
    promptEn: 'How do I add new stock (GRN) to the Central Main Warehouse step by step?',
    promptSi: 'Main Stock එකට අලුතින් බඩු (GRN) ඇතුළත් කරන්නේ කොහොමද? පියවරෙන් පියවර කියන්න.',
    targetTab: 'main-stock',
  },
  {
    id: 'site-transfer',
    labelEn: '🏢 How to transfer stock to a Branch?',
    labelSi: '🏢 Branch / Site එකකට බඩු යවන්නේ කොහොමද?',
    promptEn: 'How do we request and transfer stock from the Main Warehouse to a Branch Yard?',
    promptSi: 'Main Stock එකේ ඉඳන් වෙනත් Branch / Site එකකට බඩු Request කරලා Transfer කරගන්නේ කොහොමද?',
    targetTab: 'requests',
  },
  {
    id: 'team-issue',
    labelEn: '👷 How to issue items to a Team?',
    labelSi: '👷 Team එකකට බඩු Issue කරන්නේ කොහොමද?',
    promptEn: 'How do I issue materials from a Branch Yard to a Field Team?',
    promptSi: 'Branch එකේ තියෙන බඩු වැඩ කරන Field Team එකකට Issue කරන්නේ කොහොමද?',
    targetTab: 'dispatch',
  },
  {
    id: 'project-usage',
    labelEn: '🏗️ Material Usage / Daily Progress Entry?',
    labelSi: '🏗️ Material Usage / Daily Progress දාන්නේ කොහොමද?',
    promptEn: 'How do Section Filtering, Site Branch Lock, Qty Used + Wastage Qty entry, and Material Usage / Daily Progress Entry work?',
    promptSi: 'Material Usage / Daily Progress Entry හි Section අනුව Projects Filter වීම, Site Lock, Qty Used සහ Wastage Qty ඇතුළත් කරන්නේ කොහොමද?',
    targetTab: 'project-usage',
  },
  {
    id: 'wastage-full-site-report',
    labelEn: '📊 Wastage & Full Site (Project) Report?',
    labelSi: '📊 Wastage සහ Full Site (Project) Report ගන්නේ කොහොමද?',
    promptEn: 'How do I enter Wastage Qty and print or export the Full Report for This Site (Project) showing Team-by-Team Totals and the Full Grand Total?',
    promptSi: 'Wastage Qty ඇතුළත් කරලා Usage Vouchers History වලින් Teams වෙන වෙනම සහ Full Grand Total පෙන්වන Full Report for This Site (Project) ගන්නේ කොහොමද?',
    targetTab: 'project-usage',
  },
  {
    id: 'returns',
    labelEn: '🔄 Multi-Item Team & Branch Returns?',
    labelSi: '🔄 Items ගොඩක් එක සැරේ Return කරන්නේ කොහොමද?',
    promptEn: 'How do we add multiple items at once and return them together in Team Returns (RV) and Branch Returns (BRM)?',
    promptSi: 'Team Returns සහ Branch Returns දෙකේම Items ගණනාවක් එකතු කරලා එක සැරේ Return කරන්නේ කොහොමද?',
    targetTab: 'returns',
  },
  {
    id: 'setup',
    labelEn: '⚙️ Items (<200KB Photo), Sites & Teams?',
    labelSi: '⚙️ Items (200KB Photo), Sites සහ Teams ලියාපදිංචිය?',
    promptEn: 'How do I register new Items with <200KB auto-compressed photos ("Print with Image"), Branch Yards, Field Teams, and Users in Master Registrations?',
    promptSi: 'Master Registrations හරහා 200KB ට අඩු Photo සහිතව Items ("Print with Image"), Branches, Teams සහ Users ලියාපදිංචි කරන්නේ කොහොමද?',
    targetTab: 'registrations',
  },
  {
    id: 'roles',
    labelEn: '🔐 What permissions does my Role have?',
    labelSi: '🔐 මගේ Role එකේ Permissions මොනවද?',
    promptEn: 'Based on my current logged-in User Role, what actions and modules can I access?',
    promptSi: 'මම දැනට ලොග් වෙලා ඉන්න User Role එක අනුව මට මේ සිස්ටම් එකේ කරන්න පුළුවන් වැඩ මොනවද?',
    targetTab: 'manage-users',
  },
];

const MODULE_LABELS: Record<string, { en: string; si: string }> = {
  dashboard: { en: 'Open Dashboard', si: 'Dashboard වෙත යන්න' },
  'main-stock': { en: 'Open Main Central Stock', si: 'Main Central Stock වෙත යන්න' },
  'client-free-stock': { en: 'Open Client Free Stock (FOC)', si: 'Client Free Stock වෙත යන්න' },
  procurement: { en: 'Open Supplier Orders (PO)', si: 'Supplier Orders (PO) වෙත යන්න' },
  requests: { en: 'Open Stock Requisitions', si: 'Stock Requisitions වෙත යන්න' },
  'site-stock': { en: 'Open Site Branch Stock', si: 'Site Branch Stock වෙත යන්න' },
  dispatch: { en: 'Open Issue to Teams', si: 'Issue to Teams වෙත යන්න' },
  'team-stock': { en: 'Open Team In-Hand Stock', si: 'Team In-Hand Stock වෙත යන්න' },
  projects: { en: 'Open Project & New Section Registry', si: 'Project & New Section Registry වෙත යන්න' },
  'project-usage': { en: 'Open Material Usage / Daily Progress Entry', si: 'Material Usage / Daily Progress Entry වෙත යන්න' },
  returns: { en: 'Open Team Returns', si: 'Team Returns වෙත යන්න' },
  'branch-returns': { en: 'Open Branch Returns', si: 'Branch Returns වෙත යන්න' },
  registrations: { en: 'Open Master Registrations', si: 'Master Registrations වෙත යන්න' },
  items: { en: 'Open Item Catalog', si: 'Item Catalog වෙත යන්න' },
  'manage-users': { en: 'Open User Management', si: 'User Management වෙත යන්න' },
  teams: { en: 'Open Teams Registration', si: 'Teams Registration වෙත යන්න' },
  'branch-directory': { en: 'Open Branch Staff & Teams', si: 'Branch Staff & Teams වෙත යන්න' },
  templates: { en: 'Open Document Templates', si: 'Document Templates වෙත යන්න' },
  'recycle-bin': { en: 'Open Recycle Bin', si: 'Recycle Bin වෙත යන්න' },
};

const getWelcomeMessage = (lang: 'en' | 'si'): ChatMessage => ({
  id: `welcome-${lang}`,
  role: 'model',
  text:
    lang === 'en'
      ? 'Welcome to **Chat System Support**! 👋\n\nI can guide you step-by-step through the latest updates including **5-Stage Client Free Stock (FOC) Reconciliation (Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Completion Returnable Balance), Color-Coded Main & Sub-Project Reports, Site Branch "Central FOC" Highlighting, "ALL AREAS" Island-Wide Projects, Main Project -> Under New Connections (Telecom/Water/Electric/Solar with Section-Filtered FOC), Field Team Transfers, Site-Separated In-Hand Stock, Item Photos in PO/Return Dropdowns (<200KB & "Print with Image"), ISO 9001:2015 Formats, and Digital Signatures**.\n\nSelect a quick topic above or type your question below!'
      : 'ආයුබෝවන්! **Chat System Support (සිංහල අංශය)** වෙත සාදරයෙන් පිළිගනිමු! 👋\n\nමෙම පද්ධතියේ නවතම විශේෂාංග වන **පියවර 5 Client Free Stock (FOC) Reconciliation (Central -> Site -> Team -> Usage/Wastage -> Completion Returnable Balance), වර්ණ ගැන්වූ Main/Sub-Project Reports, Site Branch Stock හි "Central FOC" Badge, "ALL AREAS (All Site Branches)" විකල්පය, Main Project -> Under New Connections (Telecom/Water/Electric/Solar + Section අනුව Filter වන FOC), Team Transfers, PO/Return Dropdown වල Item Images (<200KB & "Print with Image"), ISO 9001:2015 Formats සහ Digital Signatures** ගැන **සිංහලෙන් හෝ Singlish වලින්** මගෙන් අහන්න.\n\nඉහත ඇති බටන් එකක් තෝරන්න හෝ ඔබගේ ගැටලුව පහතින් ටයිප් කරන්න!',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

export const AiSupportChatWidget: React.FC<{ currentTab?: string }> = ({ currentTab = 'dashboard' }) => {
  const { currentUser, sites, items, teams, projects, activeProjectTypes, getMainWarehouseStock, pendingRequestsCount } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  // Strictly default to 'en' (English) so Start Chat has zero Sinhala anywhere
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Separate message histories for English Section and Sinhala Section
  const [messagesByLang, setMessagesByLang] = useState<{
    en: ChatMessage[];
    si: ChatMessage[];
  }>(() => ({
    en: [getWelcomeMessage('en')],
    si: [getWelcomeMessage('si')],
  }));

  const currentMessages = messagesByLang[language];

  const clientId = useMemo(() => {
    try {
      const existing = sessionStorage.getItem('apex_support_client_id');
      if (existing) return existing;
      const generated = `cli-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('apex_support_client_id', generated);
      return generated;
    } catch {
      return 'cli-default';
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentMessages, isOpen, language]);

  const activeBranchName = useMemo(() => {
    if (!currentUser?.siteId) return 'All Branches (Central HQ)';
    const found = sites.find((s) => s.id === currentUser.siteId);
    return found ? found.name : 'Assigned Branch';
  }, [currentUser, sites]);

  const workspaceContext: SupportWorkspaceContext = useMemo(() => {
    const activeItems = items.filter((i) => !i.isDeleted);
    const activeSites = sites.filter((s) => !s.isDeleted);
    const activeTeams = teams.filter((t) => !t.isDeleted);
    const activeProjects = projects.filter((p) => !p.isDeleted);

    const lowStockItems = activeItems.filter((item) => {
      const stockInfo = getMainWarehouseStock(item.id);
      return stockInfo.isLowStock;
    });

    return {
      userName: currentUser?.fullName || currentUser?.username || 'User',
      userRole: currentUser?.role || 'Staff',
      currentTab,
      branchName: activeBranchName,
      language,
      activeItemsCount: activeItems.length,
      lowStockItemsCount: lowStockItems.length,
      lowStockItemNames: lowStockItems.map((i) => i.itemName),
      activeSitesCount: activeSites.length,
      siteNames: activeSites.map((s) => s.name),
      activeTeamsCount: activeTeams.length,
      teamNames: activeTeams.map((t) => t.teamName),
      activeProjectsCount: activeProjects.length,
      activeProjectSectionsCount: activeProjectTypes.length,
      projectSectionNames: activeProjectTypes.map((pt) => pt.name),
      pendingRequestsCount,
    };
  }, [items, sites, teams, projects, activeProjectTypes, getMainWarehouseStock, currentUser, currentTab, activeBranchName, language, pendingRequestsCount]);

  const handleNavigate = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: tabId }));
  };

  const appendMessage = (lang: 'en' | 'si', msg: ChatMessage) => {
    setMessagesByLang((prev) => ({
      ...prev,
      [lang]: [...prev[lang], msg],
    }));
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const targetLang = language;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    appendMessage(targetLang, userMsg);
    setInput('');
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const historyPayload = messagesByLang[targetLang]
        .filter((m) => !m.id.startsWith('welcome-'))
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          clientId,
          context: workspaceContext,
        }),
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && typeof data.reply === 'string' && data.reply.trim()) {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'model',
            text: data.reply.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedTab: data.suggestedTab,
          };
          appendMessage(targetLang, botMsg);
          return;
        }
      }

      // If server returned non-JSON (e.g. static deployment) or empty, use instant client-side System Expert Engine
      const localResult = resolveSmartSystemSupportAnswer(trimmed, {
        ...workspaceContext,
        language: targetLang,
      });
      appendMessage(targetLang, {
        id: `bot-local-${Date.now()}`,
        role: 'model',
        text: localResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedTab: localResult.suggestedTab,
      });
    } catch {
      clearTimeout(timeoutId);
      // Instant client-side System Expert Engine ensures every question is answered accurately without failing
      const localResult = resolveSmartSystemSupportAnswer(trimmed, {
        ...workspaceContext,
        language: targetLang,
      });
      appendMessage(targetLang, {
        id: `bot-fallback-${Date.now()}`,
        role: 'model',
        text: localResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedTab: localResult.suggestedTab,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessagesByLang((prev) => ({
      ...prev,
      [language]: [getWelcomeMessage(language)],
    }));
  };

  const renderFormattedText = (raw: string) => {
    return raw.split('\n').map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lineIdx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-extrabold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="no-print">
      {/* Floating Widget Launcher Button - 100% English ("Chat System Support") */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs shadow-[0_12px_30px_-6px_rgba(16,185,129,0.55)] border border-emerald-400/50 transition-all duration-200 hover:scale-105 cursor-pointer group"
          title="Open Chat System Support"
        >
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <MessageSquareText className="w-3.5 h-3.5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-emerald-700" />
          </span>
          <div className="text-left">
            <div className="leading-none text-[11px] font-black tracking-tight">Chat System Support</div>
            <div className="text-[9px] font-medium text-emerald-100 mt-0.5">Online Help Assistant</div>
          </div>
        </button>
      )}

      {/* Chat Support Window */}
      {isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-h-[80vh] sm:max-h-[640px] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.35)] overflow-hidden">
          {/* Top Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <MessageSquareText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                    Chat System Support
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">
                  {language === 'en'
                    ? 'Ask any question about using the system'
                    : 'සිස්ටම් එක ගැන ඕනෑම ගැටලුවක් අහන්න'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Section Tabs: English (Default) | Sinhala */}
              <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="English Instructions & Support"
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('si')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                    language === 'si'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Sinhala Instructions & Support"
                >
                  {language === 'si' ? 'සිංහල' : 'Sinhala'}
                </button>
              </div>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Reset Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Minimize */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-slate-300 hover:text-white transition cursor-pointer"
                title="Minimize Chat System Support"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Question Chips Strip */}
          <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/70 dark:border-slate-800 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-thin">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <HelpCircle className="w-3 h-3 text-emerald-600" />
              <span>{language === 'en' ? 'Quick Help:' : 'නිතර අහන:'}</span>
            </span>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                disabled={isLoading}
                onClick={() => sendMessage(language === 'en' ? qp.promptEn : qp.promptSi)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/90 dark:border-slate-700 text-[11px] font-semibold whitespace-nowrap transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {language === 'en' ? qp.labelEn : qp.labelSi}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900 dark:to-slate-900/95 min-h-[260px] max-h-[380px]">
            {currentMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const navInfo = msg.suggestedTab ? MODULE_LABELS[msg.suggestedTab] : undefined;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-slate-100/95 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                    }`}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Direct Module Jump Action Button */}
                    {!isUser && msg.suggestedTab && navInfo && msg.suggestedTab !== currentTab && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleNavigate(msg.suggestedTab!)}
                          className="w-full px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <span>{language === 'en' ? navInfo.en : navInfo.si}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>
                    {language === 'en'
                      ? 'Preparing step-by-step answer...'
                      : 'පිළිතුර සකසමින් පවතී...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Ask how to do anything in the system...'
                  : 'සිංහලෙන් හෝ Singlish වලින් ඔබගේ ගැටලුව අහන්න...'
              }
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Send Question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
