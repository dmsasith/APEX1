export interface SupportWorkspaceContext {
  userName?: string;
  userRole?: string;
  currentTab?: string;
  branchName?: string;
  language: 'en' | 'si';
  activeItemsCount?: number;
  lowStockItemsCount?: number;
  lowStockItemNames?: string[];
  activeSitesCount?: number;
  siteNames?: string[];
  activeTeamsCount?: number;
  teamNames?: string[];
  activeProjectsCount?: number;
  activeProjectSectionsCount?: number;
  projectSectionNames?: string[];
  pendingRequestsCount?: number;
}

export interface SupportAnswerResult {
  reply: string;
  suggestedTab?: string;
}

interface KnowledgeTopic {
  id: string;
  suggestedTab?: string;
  keywords: string[];
  phrases: string[];
  answerEn: (ctx: SupportWorkspaceContext) => string;
  answerSi: (ctx: SupportWorkspaceContext) => string;
}

// Detect if the user typed in Sinhala script or Singlish
export function detectSinhalaOrSinglishInput(text: string): boolean {
  if (/[\u0D80-\u0DFF]/.test(text)) return true;
  const singlishWords = [
    'kohomada',
    'mokakda',
    'monawada',
    'badu',
    'danne',
    'karanne',
    'yawanne',
    'ganne',
    'ekata',
    'eken',
    'puluwanda',
    'pennanne',
    'naha',
    'makuna',
    'aluth',
    'hadanne',
    'balanne',
    'udaw',
    'wisthara',
    'kiyanna',
    'hadala',
    'widiyath',
    'widiya',
  ];
  const lower = ` ${text.toLowerCase()} `;
  return singlishWords.some((w) => lower.includes(` ${w} `) || lower.includes(`${w}?`));
}

const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'sub-site-branch-hierarchy',
    suggestedTab: 'site-stock',
    keywords: [
      'sub-site',
      'subsite',
      'sub site',
      'parent site',
      'parent branch',
      'regional branch',
      'sub branch',
      '3-tier',
      'three tier',
      'issue stock to sub-site',
      'sub-site stock',
      'parent avl',
      'upstream return',
      'sub-site lock',
      'delete sub-site',
      'change parent',
      'damaged returns tab',
    ],
    phrases: [
      'sub site branch',
      'sub-site branch',
      'create sub-site',
      'issue stock to sub-site',
      'parent site branch',
      'regional site branch',
      'sub site ekata',
      'sub-site ekak hadanne',
      'sub site ekata badu',
      '3-tier warehouse',
      'delete sub site',
      'cannot delete sub-site',
      'damaged returns tab',
    ],
    answerEn: () =>
      `**How the 3-Tier Hierarchy, Sub-Site Stock/FOC Lock & Site "Damaged Returns" Tab Work:**\n\n` +
      `**1. Regional Branches, Nested Sub-Sites & Custody Lock:**\n` +
      `• In **Master Registrations -> Sites / Branches**, select **🏢 Regional Site Branch** (under Central HQ) OR **↳ Sub-Site Branch** (under a **Parent Regional Site Branch ***).\n` +
      `• **Sub-Site Stock & FOC Lock:** Once even a single stock dispatch, Client FOC allocation, team issue, usage, or return exists for a Sub-Site, **deleting that Sub-Site OR changing its Parent Regional Branch / Hierarchy Tier is strictly locked** so branch balances and Client FOC custody never get corrupted.\n` +
      `• Both Regional Site Branches and Sub-Site Branches support **Field Teams** normally inside their own tier.\n\n` +
      `**2. Supplying Stock to a Sub-Site Branch:**\n` +
      `• **Direct Parent Dispatch ("Issue Stock to Sub-Site"):** In **Site Branch Stock**, select the Parent Regional Site Branch and click **Issue Stock to Sub-Site** to send usable stock straight down to a child Sub-Site.\n` +
      `• **Parent-Routed Stock Requisition (RN):** Sub-Site requisitions automatically route to their **Parent Regional Site Branch** (showing live **Parent Avl:**) instead of Central HQ.\n\n` +
      `**3. Site Branch Stock "Damaged Returns" Tab & Upstream BRM Returns:**\n` +
      `• Inside **Site Branch Stock**, switch to the dedicated **Damaged Returns** tab to view all **Damaged / Scrap** items returned by Field Teams (and child Sub-Sites on Regional sites) quarantined separately from usable stock.\n` +
      `• Right inside the **Damaged Returns** tab (or in **Branch Returns**), click **Return Selected** / **Return All Damaged** to dispatch printable **BRM** vouchers upstream: **Sub-Sites** automatically return to their **Parent Regional Branch**, and **Regional Sites** return to **Central Main Warehouse (Damaged / Scrap Yard)**.`,
    answerSi: () =>
      `**3-Tier ශාඛා ව්‍යුහය, Sub-Site ආරක්ෂණ Lock එක සහ Site "Damaged Returns" ටැබ් එක ක්‍රියාත්මක වන ආකාරය:**\n\n` +
      `**1. Regional & Sub-Site Branches සහ Sub-Site Stock/FOC Lock:**\n` +
      `• **Master Registrations -> Sites / Branches** හි **🏢 Regional Site Branch** හෝ **↳ Sub-Site Branch (Parent Regional Site එකක් යටතේ)** සාදාගත හැක.\n` +
      `• **Sub-Site Stock / FOC Lock:** Sub-Site එකක් Register කළ පසු එයට **එක් භාණ්ඩයක් හෝ Client FOC තොගයක් ලබා දී ඇත්නම්**, FOC සහ තොග ගණනය කිරීම් අවුල් වීම වැළැක්වීම සඳහා **එම Sub-Site එක Delete කිරීම හෝ වෙනත් Parent Regional Branch එකකට මාරු කිරීම ස්වයංක්‍රීයව Lock කෙරේ**.\n` +
      `• Regional සහ Sub-Site දෙකේම සාමාන්‍ය පරිදි **Field Teams** ක්‍රියාත්මක වේ.\n\n` +
      `**2. Sub-Site එකකට බඩු නිකුත් කරන ක්‍රම 2:**\n` +
      `• **Site Branch Stock -> "Issue Stock to Sub-Site":** Parent Regional Site තොගයෙන් කෙලින්ම Sub-Site එකට බඩු යැවීම.\n` +
      `• **Parent-Routed Requisition (RN):** Sub-Site එකක් දමන Stock Requisition ඉබේම එහි **Parent Regional Branch** වෙත යොමු වේ (**Parent Avl:** සමඟ).\n\n` +
      `**3. Site Branch Stock හි "Damaged Returns" ටැබ් එක සහ Upstream BRM Return:**\n` +
      `• **Site Branch Stock** ඇතුළත ඇති **Damaged Returns** ටැබ් එක මගින් Field Teams සහ Sub-Sites වෙතින් **Damaged / Scrap** ලෙස Return වූ භාණ්ඩ සාමාන්‍ය තොගයෙන් වෙන්ව බලාගත හැක.\n` +
      `• එතැනින්ම **Return Selected** / **Return All Damaged** මගින් Sub-Site භාණ්ඩ එහි **Parent Regional Branch** වෙතත්, Regional Site භාණ්ඩ **Central Main Warehouse** වෙතත් **BRM** වවුචර මගින් කෙලින්ම Return කළ හැක.`,
  },
  {
    id: 'super-admin-first-name-accountability',
    suggestedTab: 'manage-users',
    keywords: [
      'first name',
      'as super admin',
      'accountability',
      'super admin name',
      'full name',
      '20 site',
      '20 branches',
      'extra site',
      '$10',
      '10$',
      'pricing limit',
      'branch limit',
    ],
    phrases: [
      'super admin login',
      'first name verification',
      'as super admin',
      '20 site branches',
      '20 sites',
      'extra site',
      'admin password name',
      'admin login wenakota',
      'first name eka',
      'site 20',
    ],
    answerEn: () =>
      `**Super Admin Personal Accountability Login (Mandatory Full Name + First-Name Verification) & Default 20 Site Branches Allowance:**\n\n` +
      `**1. Mandatory Super Admin Personal Full Name & First-Name Login Verification:**\n` +
      `• When registering a new company workspace, entering the Super Admin's real **Full Name** is **mandatory** (generic placeholders like "Admin" or "Super Admin" are blocked).\n` +
      `• Whenever logging into the workspace using the **Super Admin Password**, the person logging in enters their personal name — the system verifies their **First Name** against the registered Super Admin profile and stamps every Audit Trail entry and Voucher as **[Entered Name] (as Super Admin)** for 100% personal accountability.\n\n` +
      `**2. Default Allowance — Unlimited Users & Teams + 20 Site Branches + HQ (+$10/mo Extra Site):**\n` +
      `• Every workspace includes **Unlimited Users**, **Unlimited Field Teams**, **1 Central HQ Warehouse**, and **20 Regional / Sub-Site Branches** included by default.\n` +
      `• Need more than 20 sites? Extra Site Branches can be added anytime for just **+$10/month per extra site**.`,
    answerSi: () =>
      `**Super Admin පුද්ගලික වගකීම් පද්ධතිය (Mandatory Full Name + First-Name Verification) සහ මූලික Site Branches 20 පහසුකම:**\n\n` +
      `**1. Super Admin අනිවාර්ය Full Name සහ Login වීමේදී First Name පරීක්ෂාව:**\n` +
      `• නව ආයතන ගිණුමක් (Tenant Registry) සෑදීමේදී ප්‍රධාන Super Admin හිමි පුද්ගලයාගේ සැබෑ **Full Name** ඇතුළත් කිරීම **අනිවාර්ය** වේ ("Admin" / "Super Admin" වැනි පොදු නම් භාර නොගනී).\n` +
      `• **Super Admin Password** ගසා ලොග් වන සෑම විටම ලොග් වන පුද්ගලයාගේ නමේ **First Name** එක නිවැරදිව ගැළපේදැයි පද්ධතිය පරීක්ෂා කරන අතර, Audit Trail සහ වවුචර්වල **[නම] (as Super Admin)** ලෙස පැහැදිලිව සටහන් වේ.\n\n` +
      `**2. මූලික පැකේජයේ ධාරිතාව — Unlimited Users & Teams + Site Branches 20 + HQ (+$10/mo Extra Site):**\n` +
      `• සෑම ආයතනයකටම **Unlimited Users**, **Unlimited Field Teams**, **1 Central HQ** සහ **Site Branches 20ක්** මූලික පැකේජයටම නොමිලේ ලැබේ.\n` +
      `• ශාඛා 20කට වඩා අවශ්‍ය නම් අමතර එක් Site Branch එකකට මසකට **$10** බැගින් ඕනෑම ගණනක් එක් කරගත හැක.`,
  },
  {
    id: 'telecom-new-connection-nc-workflow',
    suggestedTab: 'projects',
    keywords: [
      'new connection',
      'telecom new connection',
      'nc',
      'ftth',
      'ont',
      'ont serial',
      'exchange area',
      'nc number',
      'nc line',
      'lock team',
      'team lock',
      'restore telecom',
      'water project',
      'electric project',
      'electrical',
      'solar project',
      'solar pv',
      'add field',
      'custom field',
      'international',
    ],
    phrases: [
      'telecom new connection',
      'new connection',
      'water project',
      'electric project',
      'solar project',
      'add field',
      'international section templates',
      'nc line',
      'nc number',
      'ont serial',
      'register new connection',
      'select nc line',
      'confirm & lock team',
      'restore telecom new connection',
      'new connection section',
      'nc section',
    ],
    answerEn: () =>
      `**How International Industry Section Templates (Telecom, Water, Electric, Solar), "Main Project -> Under New Connections" & Section-Filtered FOC Work:**\n\n` +
      `**1. Ready-to-Load International Section Templates & "+ Add Field":**\n` +
      `In **Project & New Section Registry -> New Section Registry & Material Templates**, load presets for **Telecom New Connection (ITU-T G.984)**, **Water Supply (ISO 4064)**, **Electrical Power (IEC 60364)**, **Solar PV (IEC 62446)**, or **Standard EPC**, and add unlimited custom technical fields via **+ Add Field**.\n\n` +
      `**2. Main Project -> Under New Connections (All 4 Utility Sections) & Section-Filtered FOC:**\n` +
      `• In Telecom, Water, Electrical, and Solar sections, you can register a **Standalone New Connection**, an umbrella **🏢 Main Project (For New Connections)** (for bulk Client FOC), or a connection **↳ Under Main Project (New Connection)**.\n` +
      `• In **Material Usage / Daily Progress Entry**, FOC Main Project dropdowns **ONLY appear if Client FOC stock actually exists for that specific active section** (e.g., Telecom NC only shows Telecom NC FOC Main Projects; normal Company Stock remains completely clutter-free).\n\n` +
      `**3. Daily Progress Entry (Simple 1, 2, 3 Steps with Team & Area Lock):**\n` +
      `• **Step 1 — Team & Area Selection (Locked Until Refresh):** Pick Site Branch, Field Team, and Working Area and click **Confirm & Lock Team / Area**.\n` +
      `• **Step 2 — Select Connection or "+ Register New Connection":** Pick an existing line or register a new connection right inside Step 2.\n` +
      `• **Step 3 — Enter Material Usage:** Log **Qty Used** + **Wastage Qty** (automatically deducts from Parent Main Project FOC balance when linked).`,
    answerSi: () =>
      `**International Section Templates (Telecom, Water, Electric, Solar), "Main Project -> Under New Connections" සහ Section-Filtered FOC:**\n\n` +
      `**1. International Templates සහ "+ Add Field":**\n` +
      `**Project & New Section Registry -> New Section Registry & Material Templates** තුළ **Telecom New Connection**, **Water Project**, **Electrical Power**, සහ **Solar PV** Templates එක ක්ලික් එකෙන් Load කර **"+ Add Field"** මගින් අලුත් Fields එකතු කළ හැක.\n\n` +
      `**2. සියලුම New Connection Section 4 සඳහා "Main Project -> Under New Connections" සහ FOC Filter වීම:**\n` +
      `• Telecom, Water, Electrical, සහ Solar යන ඕනෑම New Connection Section එකක **Standalone New Connection**, **🏢 Main Project (For New Connections)**, හෝ **↳ Under Main Project (New Connection)** ලෙස Register කළ හැක.\n` +
      `• **Material Usage / Daily Progress Entry** හිදී Client FOC තොග ලැබී ඇති **එම අදාළ Section එකේ Main Projects පමණක්** Dropdown එකට Filter වී පෙන්වයි (Company Stock පමණක් නම් අනවශ්‍ය FOC Options පෙන්වන්නේ නැත).\n\n` +
      `**3. Daily Progress Enter කරන පියවර 1, 2, 3:**\n` +
      `• **පියවර 1:** Field Team සහ Area එක තෝරා Confirm කළ පසු Page එක Refresh කරනකම් Lock වී පවතී.\n` +
      `• **පියවර 2:** Connection එක Select කරන්න හෝ **"+ Register New Connection"** මගින් අලුත් Connection එකක් එතැනම Register කරන්න.\n` +
      `• **පියවර 3:** **Qty Used** සහ **Wastage Qty** ඇතුළත් කර Submit කරන්න (Main Project එකට අදාළ නම් FOC තොගයෙන් ඉබේම අඩු වේ).`,
  },
  {
    id: 'field-team-site-transfer-and-site-separated-stock',
    suggestedTab: 'team-stock',
    keywords: [
      'team transfer',
      'transfer team',
      'temporary assigned',
      'permanent',
      'ref:',
      'previous site',
      'stock to return',
      'assigned sites',
      'team history',
      'site transfer',
      'team name lock',
      'rename team',
      'delete team',
      'maru',
      'hitapu site',
      'bara nodipu',
    ],
    phrases: [
      'transfer team',
      'team transfer',
      'temporary assigned to',
      'stock to return',
      'team inhand stock',
      'team in-hand stock',
      'promote to permanent',
      'assigned sites history',
      'transfer karapu team',
      'hitapu site ekata',
      'bara nodipu badu',
      'team eka wena site ekakata',
      'team name wenas',
    ],
    answerEn: () =>
      `**Field Team Site Transfer Workflow (Temporary vs. Permanent with "Ref:"), Site-Separated Team In-Hand Stock ("Stock to Return - [Site Name]") & Team Name Lock:**\n\n` +
      `**1. Transferring a Field Team to a New Site ("Temporary Assigned to - [New Site]"):**\n` +
      `• In **Master Registrations -> Field Teams** or **Team In-Hand Stock**, click **Transfer / Site History** on any team.\n` +
      `• Whether the team still has unreturned stock on their current site OR has zero stock, the transfer initially places the team in a **Temporary** state labeled:\n` +
      `  **"Temporary Assigned to - [New Site Name]"**\n` +
      `• **If Previous-Site Stock Is Pending:** Once all pending stock from the previous site is returned/cleared, the system automatically promotes the assignment on the new site to **Permanent** and updates the team display name with a permanent prior-site reference:\n` +
      `  **"[Team Name] (Ref: [Previous Site Name])"**\n` +
      `• **If Zero Stock Was Held on Previous Site:** **Branch Admin** or **System Admin** can click **Confirm / Promote to Permanent** right inside the Team Transfer & Details modal to promote the assignment to **Permanent** with **(Ref: [Previous Site Name])**.\n\n` +
      `**2. Site-Separated Team In-Hand Stock ("Stock to Return - [Previous Site Name]"):**\n` +
      `• In **Team In-Hand Stock**, the system **NEVER combines or sums** a transferred team's materials across different sites:\n` +
      `  - **Amber Section — "Stock to Return - [Previous Site Name]":** Lists unreturned materials/tools still owed to a previous site. These items **must be returned to that specific previous site** and **cannot be used** for projects on the new site.\n` +
      `  - **Emerald Section — "[Current Site Name] — Active Site Stock":** Lists materials issued at the team's current assigned site.\n\n` +
      `**3. Strict Active-Site Material Usage & Team Name Integrity Lock:**\n` +
      `• In **Material Usage / Daily Progress Entry**, a team can **ONLY consume stock issued under their current project's Site Branch**.\n` +
      `• **Team Name Lock After Stock Issue:** Once a team has received at least one stock item, its **Team Name** is locked against renaming in **Master Registrations -> Teams** (while Leader, Phone, and Crew Members remain editable) so historical vouchers and custody balances never lose accountability.`,
    answerSi: () =>
      `**Field Team Site Transfer ක්‍රියාවලිය (Temporary vs. Permanent "Ref:"), Site අනුව වෙන් කළ Team In-Hand Stock ("Stock to Return - [Site Name]") සහ Team Name ආරක්ෂාව:**\n\n` +
      `**1. Team එකක් වෙනත් Site එකකට Transfer කිරීම ("Temporary Assigned to - [New Site]"):**\n` +
      `• **Master Registrations -> Teams** හෝ **Team In-Hand Stock** හි ඕනෑම Team එකක **"Transfer / Site History"** බටන් එක ක්ලික් කරන්න.\n` +
      `• කලින් Site එකේ භාර නොදුන් බඩු තිබුණත් නැතත්, මුලින්ම අලුත් Site එකට මාරු කළ විට එම Team එක පෙන්වන්නේ:\n` +
      `  **"Temporary Assigned to - [New Site Name]"** ලෙසයි.\n` +
      `• **කලින් Site එකේ බඩු Clear වූ පසු (හෝ බඩු නොගත් Team එකක් නම් Branch/System Admin විසින් Confirm කළ පසු):** එම Team එක අලුත් Site එකේ **Permanent** තත්ත්වයට පත් වන අතර කලින් සිටි Site එකේ නම සමඟ:\n` +
      `  **"[Team Name] (Ref: [Previous Site Name])"** ලෙස පැහැදිලිව පෙන්වයි.\n\n` +
      `**2. Team In-Hand Stock බැලීමේදී Site අනුව බඩු වෙන් කර පෙන්වීම (ඔක්කොම බඩු එකතුව පෙන්වන්නේ නැත):**\n` +
      `• Transfer කරපු Team එකක In-Hand Stock බැලීමේදී පරණ Site එකේ බඩු සහ අලුත් Site එකේ බඩු **කිසිවිටෙක එකට එකතු කර (Combine කර) පෙන්වන්නේ නැත**:\n` +
      `  - **"Stock to Return - [කලින් හිටපු Site එකේ නම]" (Amber Section):** කලින් හිටපු Site එකට භාර නොදුන් බඩු තොගය අදාළ පරණ Site එකේ නම යටතේ වෙනමම පෙන්වයි. එම බඩු අදාළ පරණ Site එකටම Return කළ යුතුය.\n` +
      `  - **"[අලුතින් ගිය Site එකේ නම] — Active Site Stock" (Emerald Section):** අලුතින් ගිය Site එකෙන් නිකුත් කළ බඩු එම අලුත් Site එකේ නම යටතේ වෙනම පෙන්වයි.\n\n` +
      `**3. අලුත් Site එකේ බඩු පමණක් භාවිතා කිරීම සහ බඩු ලබාගත් Team Name වෙනස් කිරීම Lock කිරීම:**\n` +
      `• **Material Usage / Daily Progress Entry** හිදී එම Team එකට අලුත් Site එකේ වැඩවලට පාවිච්චි කළ හැක්කේ **එම අලුත් Site එකෙන් ගත් බඩු පමණි**.\n` +
      `• **බඩු ලබාගෙන ඇති Team Name Lock වීම:** එක භාණ්ඩයක් හෝ ලබාගෙන ඇති Team එකක නම (**Team Name**) වෙනස් කළ නොහැකි ලෙස Lock කර ඇත (Leader සහ Members වෙනස් කළ හැක).`,
  },
  {
    id: 'team-project-section-isolation',
    suggestedTab: 'teams',
    keywords: [
      'project section',
      'team section',
      'assign project section',
      'alex nc',
      'alex civil',
      'civil team',
      'cable team',
      'nc team',
      'section locked',
      'change section',
      'switch section',
      'section maru',
      'team maru',
      'badu balance',
      'in-hand balance',
      '0 balance',
    ],
    phrases: [
      'team project section',
      'assign project section',
      'same team different section',
      'change team section',
      'section locked',
      'alex nc team 1',
      'alex civil team 1',
      'ekama team eka',
      'team eke section',
      'section maru karanna',
      'team pennanne naththe',
      'executing field team',
    ],
    answerEn: () =>
      `**Mandatory Team Project Section Assignment, Separate Multi-Section Naming & 0-Balance Section Change Lock:**\n\n` +
      `**1. Mandatory Project Section When Registering Teams:**\n` +
      `• In **Master Registrations -> Field Teams**, choosing an **Assigned Project Section / Department *** (e.g., New Connection, Cable, Civil, Water, Electrical, Solar) is **mandatory** for every new or edited Field Team.\n` +
      `• Each team displays its **[CODE] Section Name** badge in Master Registrations and **Branch Staff & Teams** (any legacy team without one shows an **Assign Project Section** alert button).\n\n` +
      `**2. Deploying the Same Crew Across Multiple Sections (Separate Team Names):**\n` +
      `• If the same crew needs to work across different sections, register a separate team profile under each section with section-specific names — e.g., **\`Alex NC Team 1\`** under *New Connection* and **\`Alex Civil Team 1\`** under *Civil*.\n\n` +
      `**3. 0 In-Hand Stock Rule to Change a Team's Section ("Section Locked"):**\n` +
      `• An existing team's **Project Section cannot be changed** while it holds any unconsumed or unreturned In-Hand Stock (**> 0 units**).\n` +
      `• Balance all In-Hand Stock to **0** first via **Material Usage** or **Team Returns**, and the section selector unlocks automatically!\n\n` +
      `**4. Strict Section-Filtered Team Dropdown in Material Usage:**\n` +
      `• Inside **Material Usage / Daily Progress Entry**, selecting any Project Section strictly filters **Executing Field Team *** to show **ONLY** teams registered under that section — completely eliminating accidental NC/Cable/Civil team mix-ups.`,
    answerSi: () =>
      `**Team ලියාපදිංචියේදී Project Section අනිවාර්ය කිරීම, වෙනම නම් භාවිතය සහ Section මාරු කිරීමේ 0 Balance නීතිය:**\n\n` +
      `**1. Team Register කිරීමේදී අනිවාර්ය Project Section එක:**\n` +
      `• **Master Registrations -> Field Teams** හි සෑම Team එකක්ම Register හෝ Edit කිරීමේදී එම Team එකට අදාළ **Assigned Project Section / Department *** (උදා: New Connection, Cable, Civil) තේරීම **අනිවාර්ය** වේ.\n` +
      `• Section එකක් නොමැති පැරණි Teams මත **"Assign Project Section"** බටන් එක පෙන්වයි.\n\n` +
      `**2. එකම කණ්ඩායම වෙනත් Section වල වැඩට යැවීම:**\n` +
      `• එකම කණ්ඩායම Section කිහිපයක වැඩට යැවීමට අවශ්‍ය නම් අලුත් Team නමකින් අදාළ Section එක යටතේ වෙනම Register කළ යුතුය — උදාහරණයක් ලෙස **\`Alex NC Team 1\`** (*New Connection* යටතේ) සහ **\`Alex Civil Team 1\`** (*Civil* යටතේ).\n\n` +
      `**3. වැඩ කරන Team එකක Section මාරු කිරීමේ නීතිය (Section Locked):**\n` +
      `• දැනට වැඩ කරන Team එකක් අතේ බඩු (**In-Hand Stock > 0**) තිබේ නම් එම Team එකේ Project Section එක **වෙනස් කළ නොහැක**.\n` +
      `• කලින් Section එකේ බඩු **Material Usage** හෝ **Team Returns** මගින් **0 දක්වා Balance කළ පසුව පමණක්** Section මාරු කිරීම Unlock වේ!\n\n` +
      `**4. Material Usage හි Teams Filter වීම:**\n` +
      `• **Material Usage / Daily Progress Entry** හි අදාළ Project Section එක Select කළ විට **Executing Field Team *** තුළ පෙන්වන්නේ **එම Section එක යටතේ Register වූ Teams පමණි** (NC, Cable, Civil කණ්ඩායම් කිසිවිටෙක මාරු නොවේ).`,
  },
  {
    id: 'item-lifecycle-traceability-summary',
    suggestedTab: 'main-stock',
    keywords: [
      'item summary',
      'lifecycle',
      'traceability',
      'forward summary',
      'central stock summary',
      'in hand summary',
      'bedila giye',
      'kocharak',
    ],
    phrases: [
      'item lifecycle',
      'traceability summary',
      'forward summary',
      'select item summary',
      'item ekak select',
      'central stock eke item',
      'site branch stock eken item',
    ],
    answerEn: () =>
      `**How to View & Print Item Lifecycle & Forward Traceability Summaries (Central Stock & Site Branch Stock):**\n\n` +
      `**1. Central Stock Item Selection — Full End-to-End Lifecycle Summary:**\n` +
      `• Open **Main Central Stock** and click on any item row (or click its **Summary** button).\n` +
      `• Directly underneath that item, an interactive **End-to-End Material Lifecycle & Custody Summary** expands showing:\n` +
      `  - **Inbound Sources:** How much arrived from each Supplier via **PO / GRN**, **Manual / Spot Entries**, **Client Free Stock (FOC)**, and **Site Good Returns**.\n` +
      `  - **Site Branch Distribution:** How much was dispatched to each Site Branch, returned, used/wasted, and each site's current **Site Store In-Hand**.\n` +
      `  - **Field Team Allocation:** How much each Site Branch issued to each Field Team, returned, used, wasted, and each team's current **Team In-Hand**.\n` +
      `  - **Project Consumption & Wastage:** Every project/NC line where the item was consumed.\n` +
      `  - **Live Custody KPI Strip:** Central Stock In-Hand, All Sites In-Hand, All Teams In-Hand, Total Used, and Total Wasted/Damaged.\n` +
      `• Click **Print A4 Summary** or **Download PDF** to print an official report.\n\n` +
      `**2. Site Branch Stock Item Selection — Forward Traceability Summary:**\n` +
      `• Open **Site Branch Stock (Site Inventories)**, pick a Site Branch, and click any item row (or **Forward Summary**).\n` +
      `• It displays everything that happened to that item forward from that branch: HQ/FOC transfers received, quantities issued to each Field Team at that site, Project Used & Wastage, **Site Store In-Hand**, and **Site Teams In-Hand** — with **Print A4 Summary** and **Download PDF**.`,
    answerSi: () =>
      `**Central Stock සහ Site Branch Stock හි ඕනෑම Item එකක් Select කළ විට පෙන්වන සම්පූර්ණ Summary (Printable A4/PDF):**\n\n` +
      `**1. Central Stock හි Item එකක් Select කළ විට (Full End-to-End Lifecycle Summary):**\n` +
      `• **"Main Central Stock"** වගුවේ ඕනෑම Item පේළියක් මත ක්ලික් කරන්න (හෝ **"Summary"** බටන් එක ඔබන්න).\n` +
      `• එතැනට යටින් එම භාණ්ඩයේ සම්පූර්ණ විස්තරය විවෘත වේ:\n` +
      `  - **භාණ්ඩ ලැබුණු ආකාරය (Inbound):** කවර සැපයුම්කරුවන්ගෙන් PO / GRN මගින් හෝ Manual / Client FOC මගින් කොපමණ බඩු ආවාද යන්න.\n` +
      `  - **Site වලට බෙදී ගිය ආකාරය:** එක් එක් Site Branch එකට කොපමණ බෙදී ගියාද සහ දැනට **Site In-Hand** කොපමණ තිබේද යන්න.\n` +
      `  - **Site වලින් Team වලට බෙදුණු ආකාරය:** එක් එක් Field Team එකට නිකුත් කළ ප්‍රමාණය, Used/Wasted සහ දැනට **Team In-Hand** ප්‍රමාණය.\n` +
      `  - **මුළු තොග සාරාංශය:** **Central Stock In-Hand**, **Site In-Hand**, **Team In-Hand**, **Total Used** සහ **Total Wasted/Damaged**.\n` +
      `• **"Print A4 Summary"** හෝ **"Download PDF"** මගින් මෙම සම්පූර්ණ වාර්තාව මුද්‍රණය කරගත හැක.\n\n` +
      `**2. Site Branch Stock හි Item එකක් Select කළ විට (Forward Traceability Summary):**\n` +
      `• **"Site Branch Stock"** වෙත ගොස් ඕනෑම Item එකක් මත ක්ලික් කළ විට (හෝ **"Forward Summary"** එබූ විට) එම Site එකට ලැබුණු බඩු එතැන් සිට ඉදිරියට Teams වලට බෙදුණු ආකාරය, Projects වල Used/Waste ගිය ආකාරය සහ Site/Team In-Hand තොග පෙන්වන අතර එයද Print හා PDF කළ හැක.`,
  },
  {
    id: 'project-sections-and-templates',
    suggestedTab: 'projects',
    keywords: [
      'section',
      'sections',
      'template',
      'templates',
      'bom',
      'new section',
      'section registry',
      'project type',
      'suggested qty',
      'default material',
      'water',
      'electric',
      'solar',
      'add field',
    ],
    phrases: [
      'new section registry',
      'project section',
      'project sections',
      'material template',
      'material templates',
      'bom template',
      'create new section',
      'create section',
      'configure material template',
      'section hadala',
      'sections hadala',
      'template hadana',
      'templates hadana',
      'aluth project section',
      'add field',
    ],
    answerEn: (ctx) =>
      `**How to Create Project Sections Using International Templates (Telecom, Water, Electric, Solar), Add Custom Fields ("+ Add Field") & Configure Material Templates (BOM):**\n\n` +
      `**Part 1 — Create a Project Section with International Industry Templates & "+ Add Field":**\n` +
      `1. Open **Project & New Section Registry** -> **New Section Registry & Material Templates** tab and click **+ Add New Section** (or click any of the 1-click Quick-Load Template buttons at the top).\n` +
      `2. Under **1. Load International Industry Standard Section Template**, select:\n` +
      `   • **Telecom New Connection (ITU-T G.984 / FTTH)**\n` +
      `   • **Water Supply & Utility Project (ISO 4064 / AWWA)**\n` +
      `   • **Electrical Power & Service Connection (IEC 60364 / IEEE)**\n` +
      `   • **Solar PV & Net-Metering Project (IEC 62446 / UL 1741)**\n` +
      `   • **Standard / Custom Engineering Project (ISO 21500 / EPC)**\n` +
      `3. Selecting any template automatically loads its Section Name, Code, Theme Color, 6 Core Field Labels, and pre-configured International Technical Fields.\n` +
      `4. Click **+ Add Field** inside the modal to add as many custom fields as you need (Field Label, Placeholder/Example, Required toggle), or click **Configure Fields / + Add Field** on any existing section card anytime.\n\n` +
      `**Part 2 — Configure a Default Material Template (BOM) for that Section:**\n` +
      `1. Click **Configure Material Template** (or **Edit Material Template (BOM)**) on your section card.\n` +
      `2. Select standard items routinely used in this section, enter optional **Suggested Qty**, and click **Save Material Template**.\n` +
      `3. Whenever a user selects this section in **Material Usage / Daily Progress Entry**, these template items load automatically!${
        ctx.activeProjectSectionsCount
          ? `\n\n📌 *Current Workspace Status:* **${ctx.activeProjectSectionsCount} project section(s)** configured${
              ctx.projectSectionNames && ctx.projectSectionNames.length > 0
                ? ` (${ctx.projectSectionNames.slice(0, 5).join(', ')})`
                : ''
            }.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**International Templates (Telecom, Water, Electric, Solar) සහ "+ Add Field" භාවිතා කර අලුත් Project Section එකක් සහ Material Template (BOM) එකක් සකස් කරන ආකාරය:**\n\n` +
      `**1 වන පියවර — International Template එකක් තෝරා "+ Add Field" මගින් අලුත් Fields එකතු කිරීම:**\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත ගොස් **"New Section Registry & Material Templates"** ටැබ් එකෙහි **"+ Add New Section"** ක්ලික් කරන්න (නැතිනම් උඩින්ම ඇති Telecom, Water, Electric, Solar Quick-Load බටන් එකක් ඔබන්න).\n` +
      `2. **"1. Load International Industry Standard Section Template"** යටතේ අවශ්‍ය ක්ෂේත්‍රය තෝරන්න:\n` +
      `   • **Telecom New Connection (ITU-T G.984 / FTTH)**\n` +
      `   • **Water Supply & Utility Project (ISO 4064 / AWWA)**\n` +
      `   • **Electrical Power & Service Connection (IEC 60364 / IEEE)**\n` +
      `   • **Solar PV & Net-Metering Project (IEC 62446 / UL 1741)**\n` +
      `   • **Standard / Custom Engineering Project (ISO 21500 / EPC)**\n` +
      `3. එවිට එම ක්ෂේත්‍රයට අදාළ ජාත්‍යන්තර Core Fields 6 සහ අමතර Technical Fields සියල්ල ස්වයංක්‍රීයව Load වේ.\n` +
      `4. **"+ Add Field"** බටන් එක එබීමෙන් ඔබට අවශ්‍ය තවත් ඕනෑම අලුත් Field එකක් (Field Name, Placeholder, Required) එතැනට එකතු කර **"Create Section"** ක්ලික් කරන්න.\n\n` +
      `**2 වන පියවර — එම Section එකට Default Material Template (BOM) එකක් සෑදීම:**\n` +
      `1. Section Card එක මත ඇති **"Configure Material Template"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. එම Section එකට නිතර වැය වන Items සහ සාමාන්‍ය ප්‍රමාණය (**Suggested Qty**) ඇතුළත් කර **"Save Material Template"** ක්ලික් කරන්න.${
        ctx.activeProjectSectionsCount
          ? `\n\n📌 *දැනට පද්ධතියේ Project Sections **${ctx.activeProjectSectionsCount}ක්** සකස් කර ඇත.*`
          : ''
      }`,
  },
  {
    id: 'main-sub-individual-projects-foc-reconciliation',
    suggestedTab: 'projects',
    keywords: [
      'main project',
      'major project',
      'sub project',
      'sub-project',
      'sub projects',
      'sub-projects',
      'individual project',
      'under main project',
      'reconciliation',
      'reconcile',
      'umbrella',
      'parent project',
      'all areas',
      'returnable',
      'completion',
    ],
    phrases: [
      'major project',
      'main project',
      'sub project',
      'sub-project',
      'under main project',
      'individual project',
      'project reconciliation',
      'sub project hadanne',
      'main project eken adu',
      'free stock reconciliation',
      'all areas',
      'reconciliation flow',
    ],
    answerEn: (ctx) =>
      `**5-Stage Standard Free Stock (FOC) Reconciliation Flow, Main/Sub-Projects & "ALL AREAS" Multi-Site Support:**\n\n` +
      `**1. Register Projects with Branch OR "🌐 ALL AREAS (All Site Branches)":**\n` +
      `• In **Project & New Section Registry -> Register Project**, select **Major/Main Project**, **Sub-Project**, **Individual Project**, or **New Connection**.\n` +
      `• Pick a specific **Assigned Site Branch *** OR choose **🌐 ALL AREAS (All Site Branches)** for island-wide contracts (e.g., *"ISLAND WIDE FTTH NEW CONNECTION"*) so **any Site Branch** can request its FOC stock and log material usage without a branch lock.\n\n` +
      `**2. Clear 5-Stage Standard FOC Reconciliation Flow:**\n` +
      `All Client FOC summaries and reports follow one clear, chronological sequence:\n` +
      `   1) **Initial FOC Receipt at Central** (Total received at HQ Central Stock)\n` +
      `   2) **Site Issue** (Dispatched from Central HQ to Site Branches)\n` +
      `   3) **Team Issue** (Issued from Site Branches to Field Teams)\n` +
      `   4) **Usage & Wastage** (Installed Qty & Wastage logged on site/connections)\n` +
      `   5) **Balance / Returnable Stock on Project Completion** (Central + Site + Team In-Hand returnable to Client)\n\n` +
      `**3. Color-Coded Main Project Cards, Sub-Project Flows & Central A4/PDF Reports:**\n` +
      `• Selecting a **Sub-Project** shows its dedicated flow. Selecting a **Main Project** displays **color-coded Main Project cards**, each linked **Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506)** in its own flow section below, and a **Full Usage & Client Balance Summary Report** at the bottom.\n` +
      `• In **Client Free Stock / Central Stock**, print clean A4/PDF reports either **per individual issued item** OR as **one consolidated report for all items in a project**.${
        ctx.activeProjectsCount ? `\n\n📌 *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**පියවර 5 Client Free Stock (FOC) Reconciliation Flow, Main/Sub-Projects සහ "ALL AREAS" පහසුකම:**\n\n` +
      `**1. Project ලියාපදිංචිය — Site Branch හෝ "🌐 ALL AREAS (All Site Branches)":**\n` +
      `• **Project & New Section Registry -> Register Project** තුළ Project එක අදාළ Site Branch එකට හෝ **🌐 ALL AREAS (All Site Branches)** ලෙස Register කළ හැක.\n` +
      `• **ALL AREAS** ලෙස Register කළ විට එම Project එකට ලැබෙන FOC බඩු **ඕනෑම Site Branch එකකින්** Request කර භාවිත කළ හැක (Site Lock බාධාවක් නැත).\n\n` +
      `**2. පැහැදිලි පියවර 5 Standard FOC Reconciliation Flow එක:**\n` +
      `   1) **Initial FOC Receipt at Central:** මුලින්ම Central Stock එකට ලැබුණු FOC ප්‍රමාණය.\n` +
      `   2) **Site Issue:** Central එකෙන් අදාළ Site එකට (හෝ Sites වලට) නිකුත් කළ ප්‍රමාණය.\n` +
      `   3) **Team Issue:** Site එකෙන් Field Teams වලට නිකුත් කළ ප්‍රමාණය.\n` +
      `   4) **Usage & Wastage:** වැඩබිමේදී සිදු වූ භාවිතය (Usage) සහ නාස්තිය (Wastage).\n` +
      `   5) **Balance / Returnable Stock on Project Completion:** Project අවසන් වූ පසු Client වෙත ආපසු භාර දිය හැකි ඉතිරි ප්‍රමාණය.\n\n` +
      `**3. වර්ණ ගැන්වූ Main Project Cards, Sub-Project Flow සහ Central Reports:**\n` +
      `• **Sub-Project** එකක් තේරූ විට එම Sub-Project එකේ Usage Flow එක වෙනම පෙන්වයි. **Main Project** එකක් තේරූ විට වෙනස් වර්ණ Cards යටතේ ඒ යටතේ ඇති හැම **Sub-Project (උදා: KT-RGL-0505, KT-ABK-0506)** එකකම Flow එක පහළට වෙන වෙනම පෙන්වා අවසානයේ **Full Usage & Client Balance Summary Report** එක ලබාදෙයි.\n` +
      `• Central Stock හරහා සෑම Issued Item එකකටම **වෙන වෙනම Report** මෙන්ම Project එකේ **සියලු Items එකට ගත් Consolidated A4/PDF Report** එකක්ද ලබාගත හැක.${
        ctx.activeProjectsCount ? `\n\n📌 *දැනට සක්‍රීය Projects **${ctx.activeProjectsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'project-registry-management',
    suggestedTab: 'projects',
    keywords: [
      'project registry',
      'register project',
      'customer phone',
      'site id',
      'connection id',
      'import csv',
      'sample csv',
      'district',
      'sub area',
      'assigned site branch',
      'all areas',
    ],
    phrases: [
      'how to register a project',
      'register new project',
      'import projects',
      'project master list',
      'project ekak hadanne',
      'project register karanne',
      'all areas branch',
    ],
    answerEn: (ctx) =>
      `**How to Register & Manage Projects (Main, Sub-Project, Individual, New Connections & "ALL AREAS"):**\n\n` +
      `1. **Open Project Registry:** Click **Project & New Section Registry** in the left sidebar and click **Register Project**.\n` +
      `2. **Choose Project Structure Type:** Select **🏢 Major / Main Project** (or **Main Project for New Connections**), **↳ Sub-Project** (or **Under Main Project**), or **📄 Individual / Standalone**.\n` +
      `3. **Select Assigned Site Branch * (or "🌐 ALL AREAS"):** Choose the project's Site Branch, OR select **🌐 ALL AREAS (All Site Branches)** if the contract runs across multiple branches so any site can request its FOC stock and log field usage.\n` +
      `4. **Enter Project Details & Save:** Fill in Project ID (0001 sequential), Reference No, Name, Client, District, and section technical fields.${
        ctx.activeProjectsCount ? `\n\n📌 *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**අලුත් Project එකක් (Main, Sub, Individual, New Connection සහ "ALL AREAS") ලියාපදිංචි කරන ආකාරය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry" -> "Register Project"** ක්ලික් කරන්න.\n` +
      `2. ව්‍යාපෘති වර්ගය (**🏢 Major / Main Project**, **↳ Sub-Project**, හෝ **📄 Individual / Standalone**) තෝරන්න.\n` +
      `3. **"Assigned Site Branch *" තේරීම (හෝ "🌐 ALL AREAS"):** අදාළ Site Branch එක තෝරන්න; නැතිනම් ලංකාවේම / ඕනෑම Site එකක භාවිත වන Project එකක් නම් **"🌐 ALL AREAS (All Site Branches)"** තෝරන්න.\n` +
      `4. Project ID (0001 සිට ඉබේම සෑදේ), නම, Client සහ Section Fields පුරවා Save කරන්න.${
        ctx.activeProjectsCount ? `\n\n📌 *දැනට සක්‍රීය Projects **${ctx.activeProjectsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'project-usage',
    suggestedTab: 'project-usage',
    keywords: [
      'usage',
      'daily progress',
      'consume',
      'consumption',
      'boq',
      'bill of quantities',
      'project material',
      'override',
      'reserved project',
      'waya',
      'section filter',
      'site lock',
      'branch lock',
      'locked',
    ],
    phrases: [
      'record project usage',
      'project material usage',
      'material usage / daily progress entry',
      'daily progress entry',
      'log material usage',
      'cross project override',
      'project ekata',
      'material usage danne',
      'section eka maru karama',
      'site ekakata newei',
    ],
    answerEn: () =>
      `**How to Record Material Usage / Daily Progress Entry (Strict Section-Filtered Teams & Workflows):**\n\n` +
      `1. **Select Project Section (Strict Team Filter):** Open **Material Usage / Daily Progress Entry** and select your **Project Section** (e.g., New Connection, Cable, Civil, Water, Electrical, Solar). The **Executing Field Team *** dropdown immediately filters to **ONLY Field Teams registered under that selected section** — preventing cross-section mix-ups.\n` +
      `2. **If a Utility New Connection Section is Selected (Simple 1-2-3 Workflow):**\n` +
      `   • **Step 1 — Team & Area Selection (Locked Until Refresh):** Select Site Branch, Section-Filtered Field Team, and Working Area and click **Confirm & Lock Team / Area**.\n` +
      `   • **Step 2 — Select NC Line or "+ Register New Connection":** Search existing lines or register a new connection right inside Step 2.\n` +
      `   • **Step 3 — Material Usage:** Enter consumed materials (**Qty Used** + **Wastage Qty**) and submit.\n` +
      `3. **If a Standard Section is Selected (Main / Sub / Individual Projects):**\n` +
      `   • Filters strictly to **ONLY projects & teams registered under that section**. Non-matching branch projects safely lock Step 4.\n` +
      `   • Enter **Qty Used (Installed)** and **Wastage Qty** per material (validated live against **Team In-Hand**).\n` +
      `4. **Usage Vouchers History -> "Full Report for This Site (Project)":** Select any project to print/export separate **Team-by-Team Subtotals** + **Full Site Grand Total**.`,
    answerSi: () =>
      `**Material Usage / Daily Progress Entry හරහා භාවිතය සටහන් කිරීම (Section අනුව Filter වන Teams සමඟ):**\n\n` +
      `1. **Project Section තේරීම (Strict Team Filter):** **"Material Usage / Daily Progress Entry"** වෙත ගොස් ඉහළින් අදාළ **Project Section** එක (උදා: New Connection, Cable, Civil) තෝරන්න. එවිට **Executing Field Team *** තුළ පෙන්වන්නේ **එම Section එක යටතේ Register කළ Teams පමණි** (කිසිදාක Teams මාරු නොවේ)!\n` +
      `2. **New Connection Section තේරූ විට (සරල 1, 2, 3 පියවර):**\n` +
      `   • **පියවර 1 — Team & Area Selection:** අදාළ Section එකේ Field Team එක සහ Area එක තෝරා Confirm කළ පසු Page එක Refresh කරන තුරු Lock වේ.\n` +
      `   • **පියවර 2 — Select NC Line හෝ "+ Register New Connection":** Connection line එක තෝරන්න නැතිනම් එතැනම register කරන්න.\n` +
      `   • **පියවර 3 — Material Usage:** වැය වූ Materials (**Qty Used** + **Wastage Qty**) ඇතුළත් කර Submit කරන්න.\n` +
      `3. **සාමාන්‍ය Section එකක් තේරූ විට:**\n` +
      `   • එම Section එකට අදාළ Projects සහ Teams පමණක් පෙන්වයි (**Qty Used** සහ **Wastage Qty** සටහන් කළ හැක).\n` +
      `4. **Full Report for This Site (Project):** **"Usage Vouchers History"** මගින් Teams වෙන වෙනම භාවිතය සහ සම්පූර්ණ Grand Total ලබාගත හැක.`,
  },
  {
    id: 'wastage-and-full-site-report',
    suggestedTab: 'project-usage',
    keywords: [
      'wastage',
      'waste',
      'full report',
      'site report',
      'grand total',
      'team total',
      'vouchers history',
      'apate',
      'wadipura',
      'siyalu teams',
    ],
    phrases: [
      'wastage qty',
      'enter wastage',
      'full report for this site',
      'full site report',
      'usage vouchers history',
      'team by team',
      'wastage danne',
      'wastage enter karanne',
      'full report balanne',
      'teams wena wenama',
    ],
    answerEn: () =>
      `**How Wastage Qty Tracking & "Full Report for This Site (Project)" Work:**\n\n` +
      `**Part 1 — Recording Wastage Qty (Used + Wastage):**\n` +
      `1. Open **Material Usage / Daily Progress Entry** -> Step 4 (**4. Materials Consumed**) or click **Edit** on any existing PU voucher.\n` +
      `2. Alongside **Qty Used (Installed)**, enter the **Wastage Qty** for each material.\n` +
      `3. The form calculates **Total Deduct = Used + Wastage** in real time, checks that total deduction does not exceed **Team In-Hand** stock, and automatically updates **Team In-Hand Stock** (**Used** & **Wastage** columns + CSV), **Reconciliation**, **Site Branch Stock**, and printable **PU Vouchers**.\n\n` +
      `**Part 2 — Viewing "Full Report for This Site (Project)" (All Teams Consolidated):**\n` +
      `1. Open **Material Usage / Daily Progress Entry -> Usage Vouchers History** tab.\n` +
      `2. Filter/select a **Project / Site** from the project selector — a project summary bar appears with the **Full Report for This Site (Project)** button.\n` +
      `3. The report shows:\n` +
      `   • **Part 1 — Team-by-Team Breakdown & Subtotals:** Every team's voucher details, Installed Qty, Wastage Qty, Total Consumed, and **individual Team Subtotal**.\n` +
      `   • **Part 2 — Full Site Consolidated Grand Total:** Combined totals across all teams working on that project.\n` +
      `4. Click **Print / Save PDF** or **Export Excel / CSV** anytime.`,
    answerSi: () =>
      `**Wastage Qty (අපතේ යාම්) ඇතුළත් කිරීම සහ "Full Report for This Site (Project)" ලබාගන්නා ආකාරය:**\n\n` +
      `**1 වන කොටස — Wastage Qty සටහන් කිරීම සහ ස්වයංක්‍රීය ගණනය:**\n` +
      `1. **"Material Usage / Daily Progress Entry"** හි 4 වන පියවරේදී (හෝ පැරණි PU වවුචරයක් **Edit** කිරීමේදී) එක් එක් භාණ්ඩය සඳහා **Qty Used** මෙන්ම **Wastage Qty** ඇතුළත් කරන්න.\n` +
      `2. පද්ධතිය මගින් **Used + Wastage = Total Deduct** ප්‍රමාණය Team In-Hand තොගය සමඟ සජීවීව පරීක්ෂා කරන අතර **Team In-Hand Stock** (Used සහ Wastage තීරු), **Reconciliation**, **Site Stock** සහ **PU වවුචර්** ස්වයංක්‍රීයව නිවැරදිව යාවත්කාලීන කරයි.\n\n` +
      `**2 වන කොටස — සියලුම Teams සඳහා "Full Report for This Site (Project)" වාර්තාව බැලීම:**\n` +
      `1. **"Material Usage / Daily Progress Entry -> Usage Vouchers History"** ටැබ් එකට යන්න.\n` +
      `2. අදාළ **Project / Site** එක තෝරා **"Full Report for This Site (Project)"** බටන් එක ක්ලික් කරන්න.\n` +
      `3. එහිදී වාර්තාව කොටස් 2කින් ලැබේ:\n` +
      `   • **Part 1 (Team-by-Team Breakdown):** එක් එක් Team එක වෙන වෙනම භාවිත කළ සහ Wastage කළ බඩු ප්‍රමාණයන් + **එක් එක් Team එකට අදාළ Total එක (Team Subtotal)**.\n` +
      `   • **Part 2 (Full Site Consolidated Grand Total):** එම Project එකට සියලුම Teams මගින් වැය කළ **සම්පූර්ණ මුළු එකතුව (Grand Total)**.\n` +
      `4. ඉහළින් ඇති **Print / Save PDF** හෝ **Export Excel / CSV** මගින් වාර්තාව බාගත කළ හැක.`,
  },
  {
    id: 'site-transfer',
    suggestedTab: 'requests',
    keywords: ['transfer', 'request', 'requisition', 'dispatch', 'branch yard', 'send stock', 'yawanne', 'illanne'],
    phrases: [
      'request and transfer',
      'transfer stock',
      'main warehouse to a branch',
      'stock request',
      'stock requisitions',
      'new stock requirement',
      'site ekata badu',
      'branch ekata badu',
    ],
    answerEn: (ctx) =>
      `**How to Request & Transfer Stock (Normal Stock vs. Assigned/ALL AREAS Client FOC) from Main Warehouse to a Branch Yard:**\n\n` +
      `1. **Open Stock Requisitions:** Go to **Stock Requisitions** from the left sidebar and click **+ New Stock Requirement Form**.\n` +
      `2. **Select Requesting Site Branch & Choose Request Tab:**\n` +
      `   • **Tab 1 — 1. Normal Stock Request:** Request regular warehouse stock. Low-stock items at your site automatically appear at the top with a **⚠️ Site Low** badge and live **Site Avl:** + **Main:** balances.\n` +
      `   • **Tab 2 — 2. Client Free Stock for Assigned Project Request:** Shows Major/Main Projects and Individual Projects assigned to your selected Site Branch **PLUS any "🌐 ALL AREAS (All Site Branches)" projects** so island-wide FOC stock can be requested by any site.\n` +
      `3. **Approve, Dispatch & "Central FOC" Badge in Site Branch Stock:** Once approved by HQ and confirmed at the site, FOC transfers carry a distinct **🎁 Central FOC** badge & color highlight inside **Site Branch Stock** so branch teams always know which items belong to Central Client FOC.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *Live Status:* **${ctx.pendingRequestsCount} pending stock request(s)** waiting for action.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**Main Warehouse සිට Branch / Site එකකට බඩු Request කර Transfer කරගන්නා ආකාරය (Normal Stock සහ Assigned / ALL AREAS FOC):**\n\n` +
      `1. **"Stock Requisitions"** වෙත ගොස් **"+ New Stock Requirement Form"** ක්ලික් කර **"Requesting Site Branch *"** තෝරන්න.\n` +
      `2. **ටැබ් දෙකෙන් අදාළ වර්ගය තේරීම:**\n` +
      `   • **1. Normal Stock Request:** සාමාන්‍ය ගබඩා තොග ඉල්ලුම් කිරීමට (**"⚠️ Site Low"** භාණ්ඩ උඩින්ම පෙන්වයි).\n` +
      `   • **2. Client Free Stock for Assigned Project Request:** තෝරාගත් Site Branch එකට අදාළ Projects මෙන්ම **"🌐 ALL AREAS (All Site Branches)"** ලෙස සෑදූ පොදු Projects ද පෙන්වන බැවින් ඕනෑම Site එකකට එම FOC බඩු Request කළ හැක.\n` +
      `3. **Site Branch Stock හි "Central FOC" ලෙස වෙන් කර පෙන්වීම:** Approve වී Site එකට ලැබුණු පසු **"Site Branch Stock"** තුළ Central FOC වෙතින් ආ බඩු **"🎁 Central FOC"** Badge/Tag එකක් සහ වර්ණ Highlight එකකින් වෙන් කර පෙන්වයි.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *දැනට පද්ධතියේ Pending Requests **${ctx.pendingRequestsCount}ක්** ඇත.*`
          : ''
      }`,
  },
  {
    id: 'main-stock-grn',
    suggestedTab: 'main-stock',
    keywords: ['grn', 'main stock', 'main central stock', 'central warehouse', 'receive stock', 'add stock', 'damaged restoration'],
    phrases: [
      'add main stock',
      'add new stock',
      'create grn',
      'restore damaged stock',
      'main stock ekata',
      'badu danne kohomada',
    ],
    answerEn: () =>
      `**How to Manage Main Central Stock, GRN Entries & Damaged Stock Restoration:**\n\n` +
      `1. **Open Main Central Stock:** Click **Main Central Stock** in the left sidebar.\n` +
      `2. **Add Stock (GRN):** Click **+ Add Stock (GRN)**, choose **Purchase** or **Manual Entry**, enter Supplier / Invoice details, select items and quantities, and save.\n` +
      `3. **Direct Site Transfer:** Transfer stock directly from the Central Warehouse to any Site Branch Yard.\n` +
      `4. **Damaged Stock Restoration:** View damaged items returned from teams/branches and use **Restore Damaged Stock to Main** once items are repaired and ready for reuse.`,
    answerSi: () =>
      `**ප්‍රධාන ගබඩාවට (Main Central Stock) බඩු (GRN) ඇතුළත් කිරීම සහ Damaged Stock කළමනාකරණය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Main Central Stock"** පිටුවට යන්න.\n` +
      `2. **අලුත් බඩු ඇතුළත් කිරීමට:** **"+ Add Stock (GRN)"** ක්ලික් කර Supplier විස්තර, Invoice අංකය සහ Items ප්‍රමාණයන් ඇතුළත් කර Save කරන්න.\n` +
      `3. **Direct Transfer:** Request එකක් නොමැතිව කෙලින්ම Branch එකකට බඩු යැවීමට Direct Transfer භාවිතා කළ හැක.\n` +
      `4. **Damaged Stock Restoration:** අලුත්වැඩියා කළ Damaged බඩු නැවත ප්‍රධාන තොගයට එකතු කිරීමට Damaged Stock කොටස භාවිතා කරන්න.`,
  },
  {
    id: 'issue-to-teams',
    suggestedTab: 'dispatch',
    keywords: ['issue', 'dispatch', 'field team', 'squad', 'gate pass', 'team in-hand', 'hand over'],
    phrases: [
      'issue items to a team',
      'issue materials',
      'issue to teams',
      'team in-hand stock',
      'team ekakata badu',
      'team ekata issue',
    ],
    answerEn: (ctx) =>
      `**How to Issue Materials to Field Teams & Track Site-Separated Team In-Hand Custody:**\n\n` +
      `1. **Check Branch Inventory:** Ensure the required items have available stock (> 0) in **Site Branch Stock**.\n` +
      `2. **Open Issue to Teams:** Click **Issue to Teams** in the left sidebar.\n` +
      `3. **Select Branch & Team:** Choose the **Branch Yard** and the **Field Team** receiving the items.\n` +
      `4. **Select Items & Print Gate Pass:** Pick the items and quantities, click **Issue Material to Team**, and print the official **Gate Pass / Issue Voucher** (with optional **"Print with Image"** thumbnail toggle).\n` +
      `5. **Site-Separated Team In-Hand Stock:** Open **Team In-Hand Stock** to monitor the live balance held by each team. For transferred teams, stock is **never summed across sites**: unreturned items from a previous site appear separately under **"Stock to Return - [Previous Site Name]"** (and cannot be used on the new site), while current-site items appear under **"[Current Site Name] — Active Site Stock"**.${
        ctx.activeTeamsCount ? `\n\n📌 *Currently **${ctx.activeTeamsCount} active field team(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**Branch එකේ සිට Field Team එකකට බඩු නිකුත් කිරීම (Issue to Teams) සහ Site අනුව වෙන් කළ Team In-Hand බැලීම:**\n\n` +
      `1. පළමුව අදාළ Branch එකේ (**Site Branch Stock**) නිකුත් කිරීමට අවශ්‍ය බඩු තොගය තිබිය යුතුය.\n` +
      `2. වම් පස මෙනුවෙන් **"Issue to Teams"** තෝරන්න.\n` +
      `3. බඩු නිකුත් කරන **Branch Yard එක** සහ **Field Team එක** තෝරා, Items සහ ප්‍රමාණයන් ඇතුළත් කර **"Issue Material to Team"** ක්ලික් කරන්න.\n` +
      `4. **Site අනුව වෙන් වූ Team In-Hand Stock:** **"Team In-Hand Stock"** පිටුවේදී Transfer කරපු Team වල බඩු ඔක්කොම එකට එකතු කර පෙන්වන්නේ නැත. කලින් හිටපු Site එකට භාර නොදුන් බඩු **"Stock to Return - [පරණ Site නම]"** යටතේ වෙනමත්, අලුතින් ගිය Site එකේ බඩු එම අලුත් Site එකේ නම යටතේත් වෙන වෙනම පෙන්වයි.${
        ctx.activeTeamsCount ? `\n\n📌 *දැනට සක්‍රීය Teams **${ctx.activeTeamsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'returns',
    suggestedTab: 'returns',
    keywords: ['return', 'unused', 'damaged', 'surplus', 'hand back', 'branch return', 'team return', 'ithiri', 'multiple items', 'batch return', 'eka sare'],
    phrases: [
      'return unused stock',
      'team returns',
      'branch returns',
      'return materials',
      'badu return karanne',
      'multiple items return',
      'godak item add karala',
      'eka sare return',
    ],
    answerEn: () =>
      `**How to Return Items in Team Returns (RV), Site "Damaged Returns" Tab & Upstream Branch Returns (BRM):**\n\n` +
      `• **Option A — Multi-Item Team Returns to Branch Yard ("Team Returns"):**\n` +
      `  1. Open **Team Returns**, select **Receiving Site Branch** & **Field Team**, and add items (**+ Add Item** / **+ Add All Held** / barcode).\n` +
      `  2. Choose **Good** (restores usable Branch Stock) or **Damaged / Scrap** (enters that Branch's dedicated **Damaged Returns** quarantine) and generate a single **RV** voucher.\n\n` +
      `• **Option B — Site Branch Stock -> Dedicated "Damaged Returns" Tab (Direct Upstream Return):**\n` +
      `  1. Open **Site Branch Stock -> Damaged Returns** tab to view all quarantined **Damaged / Scrap** items returned from Field Teams (and child Sub-Sites on Regional branches) separately from usable yard stock.\n` +
      `  2. Click **Return Selected** or **Return All Damaged** right inside the tab to dispatch printable **BRM** damaged return vouchers upstream: **Sub-Site Branches** automatically return to their **Parent Regional Branch**, and **Regional Site Branches** return directly to **Central Main Warehouse (Damaged / Scrap Yard)**.\n\n` +
      `• **Option C — Multi-Item Upstream Branch Return ("Branch Returns"):**\n` +
      `  1. Open **Branch Returns**, select your **Returning Site Branch**, and add surplus Good or Damaged items (**+ Add Item** / **+ Add All Available**) to submit one batch **BRM** voucher upstream to Parent Site or Central HQ.`,
    answerSi: () =>
      `**Team Returns (RV), Site "Damaged Returns" ටැබ් සහ Branch Returns (BRM) ක්‍රියාත්මක වන ආකාරය:**\n\n` +
      `• **1. Team එකක සිට Site Branch වෙත Return කිරීම ("Team Returns"):**\n` +
      `  - **Team Returns** හි **"+ Add Item"** / **"+ Add All Held"** මගින් භාණ්ඩ කිහිපයක් එකවර Return කර **Good** (සාමාන්‍ය Site තොගයට) හෝ **Damaged / Scrap** (Site එකේ **Damaged Returns** කොටසට) ලෙස **RV** වවුචරයෙන් භාරදෙන්න.\n\n` +
      `• **2. Site Branch Stock -> "Damaged Returns" ටැබ් එක (සෘජුවම Parent / Main වෙත යැවීම):**\n` +
      `  - **Site Branch Stock** ඇතුළත **Damaged Returns** ටැබ් එක මගින් Teams හා Sub-Sites වෙතින් ආ **Damaged** බඩු සාමාන්‍ය තොගයෙන් වෙන්ව බලාගත හැක.\n` +
      `  - එම ටැබ් එක තුළින්ම **Return Selected** / **Return All Damaged** ක්ලික් කර **Sub-Site** බඩු එහි **Parent Regional Branch** වෙතත්, **Regional Site** බඩු **Central Main Warehouse** වෙතත් **BRM** වවුචර මගින් සෘජුවම ආපසු යැවිය හැක!\n\n` +
      `• **3. සාමාන්‍ය Branch Returns (BRM):**\n` +
      `  - **Branch Returns** හරහා **"+ Add Item"** / **"+ Add All Available"** මගින් අතිරික්ත හෝ Damaged භාණ්ඩ ගණනාවක් තනි **BRM** වවුචරයකින් Parent Site / Central HQ වෙත ආපසු යැවිය හැක.`,
  },
  {
    id: 'procurement-po',
    suggestedTab: 'procurement',
    keywords: ['procurement', 'supplier', 'purchase order', 'po', 'debit note', 'rtv', 'settlement', 'vendor'],
    phrases: [
      'create purchase order',
      'supplier orders',
      'supplier return',
      'debit note',
      'supplier po',
    ],
    answerEn: () =>
      `**How to Manage Supplier Orders (PO), GRN Batches, Supplier Returns (RTV) & Debit Notes:**\n\n` +
      `1. **Create a Purchase Order:** Open **Supplier Orders (PO)** and click **+ New Purchase Order**. Select the supplier, items, and unit prices.\n` +
      `2. **Full or Partial Multi-Item GRN Receipt:** When goods arrive, click **Receive GRN** on the PO to atomically receive all full or partial batch quantities directly into **Main Central Stock**.\n` +
      `3. **Supplier Returns (RTV) & Debit Notes:** For defective or damaged deliveries, create a **Supplier Return**, dispatch with Gate Pass & vehicle details, print an official **Debit Note**, and record supplier settlement (Replacement, Credit Note, or Refund).`,
    answerSi: () =>
      `**Supplier Orders (PO), Supplier Returns සහ Debit Notes කළමනාකරණය:**\n\n` +
      `1. **Purchase Order සෑදීම:** වම් පස මෙනුවෙන් **"Supplier Orders (PO)"** වෙත ගොස් අලුත් PO එකක් සාදන්න.\n` +
      `2. **PO එකට බඩු භාරගැනීම (Full / Partial GRN):** Supplier බඩු එවූ පසු **"Receive GRN"** මගින් භාණ්ඩ කිහිපයක් වුවද එකවර හෝ කොටස් වශයෙන් Main Central Stock එකට නිවැරදිව භාරගත හැක.\n` +
      `3. **Supplier Return & Debit Note:** හානි වූ බඩු නැවත Supplier වෙත යැවීමට, Gate Pass සහ **Debit Note** මුද්‍රණය කිරීමට සහ Settlement සටහන් කිරීමට Supplier Return පහසුකම භාවිතා කරන්න.`,
  },
  {
    id: 'client-foc',
    suggestedTab: 'client-free-stock',
    keywords: [
      'client free',
      'foc',
      'free issue',
      'customer supplied',
      'principal',
      'client stock',
      'free stock',
      'allocated site branch',
      'reassign',
      'edit foc',
      'waradila',
      'central foc',
      'returnable',
      'all areas',
    ],
    phrases: [
      'client free stock',
      'free of charge',
      'client material',
      'under main project',
      'wrong project foc',
      'correct foc',
      'foc waradila',
      'central foc',
      'free stock report',
    ],
    answerEn: () =>
      `**How Client Free Stock (FOC) 5-Stage Reconciliation, Central FOC Badges & Project Reports Work:**\n\n` +
      `1. **Log Client FOC (+ Log Client Free Stock):** Select **🏢 Under Main Project** (including **Main Project for New Connections**) or **📄 Individual Project**. Physical stock enters **Main Central Warehouse**, while **Allocated Site Branch** automatically locks to the project's branch — or choose **🌐 ALL AREAS** so any branch can draw from it.\n` +
      `2. **Standard 5-Stage FOC Reconciliation Order:** Every summary & report follows:\n` +
      `   • **1. Initial FOC Receipt at Central** -> **2. Site Issue** -> **3. Team Issue** -> **4. Usage & Wastage** -> **5. Balance / Returnable Stock on Project Completion**.\n` +
      `3. **Site Branch Stock "Central FOC" Badge:** Inside **Site Branch Stock**, stock sourced from Central FOC displays a highlighted **🎁 Central FOC** tag and keeps the same 5-stage sequence.\n` +
      `4. **Color-Coded Main/Sub-Project Cards & Central Printable Reports:** Color-coded Main Project cards show each Sub-Project (**KT-RGL-0505**, **KT-ABK-0506**) below with a consolidated completion balance at the end. In Central Stock / Client Free Stock, generate A4/PDF reports **per individual issued item** OR as **one full project report**, and Admins can reassign mis-logged FOC vouchers anytime.`,
    answerSi: () =>
      `**Client Free Stock (FOC) පියවර 5 Reconciliation Flow, "Central FOC" Badge සහ වාර්තා ක්‍රියාත්මක වන ආකාරය:**\n\n` +
      `1. **Client FOC ඇතුළත් කිරීම (+ Log Client Free Stock):** Project එක තේරූ විට **Allocated Site Branch** එක එම Project එකේ ශාඛාවට Lock වේ — නැතිනම් **🌐 ALL AREAS** ලෙස ඇති Project වල බඩු **ඕනෑම Site එකකට** නිකුත් කළ හැක.\n` +
      `2. **පැහැදිලි පියවර 5 Reconciliation පිළිවෙළ:**\n` +
      `   • **(1) Central Stock FOC ලැබීම** -> **(2) Site Issue** -> **(3) Team Issue** -> **(4) Usage & Wastage** -> **(5) Project Completion පසු Client වෙත ආපසු භාර දිය හැකි ඉතිරිය (Balance / Returnable)**.\n` +
      `3. **Site Branch Stock හි "Central FOC" හඳුනාගැනීම:** Site Branch Stock තුළ Central FOC වෙතින් ලැබුණු භාණ්ඩ **"🎁 Central FOC"** Badge/Tag එකක් සහ වර්ණ Highlight එකකින් පැහැදිලිව වෙන් කර පෙන්වයි.\n` +
      `4. **වර්ණ ගැන්වූ Main/Sub-Project Cards සහ Central Reports:** වෙනස් වර්ණ Cards යටතේ සෑම Sub-Project එකකම Flow එක පෙන්වා අවසානයේ සම්පූර්ණ Client Balance වාර්තාව ලබාදෙයි. Central Stock හරහා **සෑම Item එකකටම වෙන වෙනම Report** මෙන්ම **Project එකේ සියලු Items එකට ගත් Report** එකක්ද Print/PDF කරගත හැක. වැරදි Project එකකට වැටුණු FOC වවුචර Admin හට Edit කර මාරු කළ හැක.`,
  },
  {
    id: 'items-barcodes-machinery',
    suggestedTab: 'items',
    keywords: ['barcode', 'qr', 'scanner', 'usb scanner', 'camera scan', 'machinery', 'plant', 'equipment', 'excel import', 'item catalog', 'scan now', 'image', 'photo', '200kb', 'print with image'],
    phrases: [
      'item catalog',
      'plant & equipment',
      'print barcode',
      'barcode scanner',
      'import items excel',
      'scan now',
      'item image',
      'print with image',
      '200kb',
    ],
    answerEn: (ctx) =>
      `**Item Catalog, Auto-Compressed Item Photos (<200KB) in PO & Return Dropdowns, "Print with Image" & Single-Shot Scanner:**\n\n` +
      `• **Item Catalog & Plant/Equipment:** Open **Item Catalog** or **Plant & Equipment** (sequential **ITM-0001** / **MCH-0001** codes).\n` +
      `• **Item Photos (<200KB) Across Dropdowns & "Print with Image":** Attach an optional Item Photo (auto-compressed under 200KB). Item thumbnails automatically display inside dropdown lists when creating **Purchase Orders (PO)**, **Stock Requisitions (RN)**, **Team Returns (RV)**, and **Branch Returns (BRM)**, and vouchers include a **"Print with Image"** toggle.\n` +
      `• **Excel Bulk Import / Export:** Import via **Sync**, **Append Only**, or **Replace** modes.\n` +
      `• **Single-Shot Barcode Scanner ("Scan Now"):** Detects once and auto-hides the camera to prevent duplicate scans.\n\n` +
      `📌 *Current Catalog:* **${ctx.activeItemsCount ?? 0}** active items (**${ctx.lowStockItemsCount ?? 0}** low-stock alerts).`,
    answerSi: (ctx) =>
      `**Item Catalog, PO හා Return Dropdown වල පෙන්වන Item Images (<200KB), "Print with Image" සහ Single-Shot Scanner:**\n\n` +
      `• **Item Catalog & Plant/Equipment:** 0001 සිට අංකනය වන සියලුම භාණ්ඩ සහ යන්ත්‍රෝපකරණ.\n` +
      `• **Dropdown වල Item Photo සහ "Print with Image":** භාණ්ඩයකට Photo එකක් එක් කළ විට (200KB ට අඩුවෙන් Auto-Compress වේ) **Purchase Orders (PO)**, **Requisitions (RN)**, **Team Returns (RV)** සහ **Branch Returns (BRM)** දමන Dropdown ලැයිස්තු තුළද එම භාණ්ඩයේ රූපය පෙන්වයි. Print කිරීමේදී **"Print with Image"** භාවිත කළ හැක.\n` +
      `• **Single-Shot Barcode Scanner ("Scan Now"):** එක වරක් Detect වූ සැණින් Camera එක ඉබේම නතර වේ.\n\n` +
      `📌 *දැනට පද්ධතියේ:* සක්‍රීය Items **${ctx.activeItemsCount ?? 0}**ක් ඇත.`,
  },
  {
    id: 'registrations-setup',
    suggestedTab: 'registrations',
    keywords: ['register', 'master setup', 'master registrations', 'new branch', 'new site', 'new team', 'crew member', 'team member'],
    phrases: [
      'how to register',
      'master registrations',
      'register a branch',
      'register a team',
      'add team members',
      'site ekak hadanne',
      'team ekak hadanne',
    ],
    answerEn: (ctx) =>
      `**How to Register Items, 3-Tier Branches (with Sub-Site Lock), Mandatory Team Project Sections, Suppliers, Clients & Users:**\n\n` +
      `Open **Master Registrations** from the left sidebar and select the tab you need:\n` +
      `• **Items:** Register Materials or Machinery with Item Code, Unit, Unit Price, Low-Stock Threshold, and optional Project Reservation.\n` +
      `• **Sites / Branches (3-Tier Hierarchy · 20 Included + HQ):** Register **🏢 Regional Site Branches** or nested **↳ Sub-Site Branches**. Once stock or Client FOC is issued to a Sub-Site, **deleting it or changing its Parent Regional Branch is locked**.\n` +
      `• **Field Teams (Mandatory Project Section):** Selecting an **Assigned Project Section *** is required for every team. To send the same crew to multiple sections, register separate section names (e.g., **\`Alex NC Team 1\`**, **\`Alex Civil Team 1\`**). Changing an existing team's section is **locked until In-Hand Stock reaches 0**.\n` +
      `• **Suppliers, Clients & Users:** Maintain vendor/FOC directories and create staff accounts with Role & Branch locks.\n\n` +
      `📌 *Workspace Summary:* **${ctx.activeItemsCount ?? 0}** Items · **${ctx.activeSitesCount ?? 0}** Branches · **${ctx.activeTeamsCount ?? 0}** Teams.`,
    answerSi: (ctx) =>
      `**Master Registrations හරහා Items, Sub-Site Lock සහිත Branches, අනිවාර්ය Team Sections සහ Users ලියාපදිංචිය:**\n\n` +
      `වම් පස මෙනුවෙන් **"Master Registrations"** වෙත ගොස් අදාළ ටැබ් එක තෝරන්න:\n` +
      `• **Items:** අලුත් Materials සහ Machinery ලියාපදිංචි කිරීමට.\n` +
      `• **Sites / Branches (20ක් ඇතුළත් + Sub-Site Lock):** Regional සහ Sub-Site Branches සෑදීමට (බඩු හෝ FOC ලබාදුන් Sub-Site එකක් Delete කිරීම හා Parent මාරු කිරීම Lock වේ).\n` +
      `• **Teams (අනිවාර්ය Project Section):** Team Register කිරීමේදී **Project Section** තේරීම අනිවාර්ය වේ. එකම කණ්ඩායම වෙනත් Section වලට යැවීමට වෙනම නම් (**\`Alex NC Team 1\`**, **\`Alex Civil Team 1\`**) යොදන්න. Section මාරු කළ හැක්කේ **In-Hand Stock 0ට Balance කළ පසු පමණි**.\n` +
      `• **Users (සීමා රහිතයි):** සිස්ටම් එකට ලොග් වන Users, Role එක සහ Branch එක ලබාදීමට.\n\n` +
      `📌 *දැනට පද්ධතියේ:* Items **${ctx.activeItemsCount ?? 0}**ක් · Branches **${ctx.activeSitesCount ?? 0}**ක් · Teams **${ctx.activeTeamsCount ?? 0}**ක් ඇත.`,
  },
  {
    id: 'users-roles-permissions',
    suggestedTab: 'manage-users',
    keywords: ['role', 'permission', 'access', 'user', 'password', 'login', 'supervisor', 'storekeeper', 'admin', 'view as', 'first name', 'super admin'],
    phrases: [
      'what permissions',
      'my role',
      'create user',
      'user management',
      'cannot see',
      'user kenek',
      'mage role',
      'super admin login',
    ],
    answerEn: (ctx) =>
      `**User Roles, Super Admin First-Name Accountability, Parent-Site Authority & Multi-Site Permissions:**\n\n` +
      `You are logged in as **${ctx.userName || 'User'}** with role **${ctx.userRole || 'Staff'}** (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin Central (First-Name Verified):** Full access across HQ, all Regional & Sub-Site branches, POs, Templates, Backups, Audit Trail, Recycle Bin, and **View-As Mode**. Tenant creation requires a real personal Full Name, and Super Admin password logins verify First Name and stamp actions as **[Name] (as Super Admin)**.\n` +
      `• **All Site Branch Admin:** Cross-branch operational access to Main Stock, Supplier POs, Requisitions, and all Regional & Sub-Site Yards.\n` +
      `• **Branch Admin (Parent Authority over Sub-Sites):** Manages their assigned Regional/Sub-Site Branch(es). A Parent Regional Branch Admin can also supply stock (**Issue Stock to Sub-Site**) and approve/reject Requisitions submitted by its child **Sub-Site Branches**.\n` +
      `• **Branch System User:** Standard operational access for their assigned Regional or Sub-Site Branch(es).`,
    answerSi: (ctx) =>
      `**User Roles, Super Admin First-Name වගකීම් පද්ධතිය සහ Parent-Site බලතල:**\n\n` +
      `ඔබ දැනට ලොග් වී සිටින්නේ **${ctx.userName || 'User'}** ලෙස **${ctx.userRole || 'Staff'}** තනතුරෙන් (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin Central (First-Name Verified):** සියලුම Regional/Sub-Site Branches, Main Stock, PO, Backups සහ Recycle Bin සඳහා පූර්ණ බලතල. නව ගිණුමේදී සැබෑ Full Name අනිවාර්ය වන අතර Super Admin Password මගින් ලොග් වීමේදී First Name ගැළපීම පරීක්ෂා කර **[නම] (as Super Admin)** ලෙස සටහන් වේ.\n` +
      `• **All Site Branch Admin:** සියලුම Branches සහ ප්‍රධාන ගබඩාවේ මෙහෙයුම් කටයුතු පාලනය කළ හැක.\n` +
      `• **Branch Admin (Sub-Sites පාලනය සහිතයි):** තම Branch එකේ මෙහෙයුම් වලට අමතරව, Parent Regional Branch Admin කෙනෙකුට තමන් යටතේ ඇති **Sub-Site Branches** වෙත බඩු නිකුත් කිරීමට සහ Sub-Site Requisitions Approve කිරීමට හැකිය.\n` +
      `• **Branch System User:** තමන්ට අදාළ Regional හෝ Sub-Site Branch එකේ වැඩ කටයුතු සිදු කරයි.`,
  },
  {
    id: 'recycle-bin-delete',
    suggestedTab: 'recycle-bin',
    keywords: ['delete', 'deleted', 'recycle bin', 'restore', 'recover', 'remove permanently', 'makuna'],
    phrases: [
      'restore deleted',
      'accidentally deleted',
      'recycle bin',
      'delete permanently',
    ],
    answerEn: () =>
      `**Admin Password Protection for Deletions & How to Restore Records (Recycle Bin):**\n\n` +
      `1. **Mandatory Admin Password Verification on Delete:** Whenever any record or transaction is deleted across the system, the confirmation dialog requires entering the **Admin Password** before the deletion can proceed.\n` +
      `2. **Open Recycle Bin:** Click **Recycle Bin** from the left sidebar (or top header trash icon).\n` +
      `3. **Restore or Permanently Delete:** Browse deleted **Items, Sites, Teams, Users, Projects, or Stock Transactions**. Click **Restore** to bring a record back immediately, or **Delete Permanently** (with Admin Password) to erase it forever.`,
    answerSi: () =>
      `**දත්ත මැකීමේදී Admin Password ආරක්ෂාව සහ මැකුණු දත්ත නැවත ගැනීම (Recycle Bin):**\n\n` +
      `1. **Delete කිරීමේදී Admin Password අනිවාර්ය වීම:** පද්ධතියේ ඕනෑම දෙයක් Delete කිරීමේදී නිකන්ම Confirm වීම වෙනුවට **Admin Password** එක ඇතුළත් කිරීම අනිවාර්ය කර ඇත.\n` +
      `2. **Recycle Bin විවෘත කිරීම:** වම් පස මෙනුවෙන් **"Recycle Bin"** වෙත යන්න.\n` +
      `3. **Restore හෝ Delete Permanently:** මැකුණු Items, Sites, Teams, Users, Projects හෝ ගනුදෙනු නැවත පද්ධතියට ගැනීමට **"Restore"** බටන් එකත්, ස්ථිරවම ඉවත් කිරීමට **"Delete Permanently"** බටන් එකත් භාවිතා කරන්න.`,
  },
  {
    id: 'low-stock-inventory',
    suggestedTab: 'site-stock',
    keywords: ['low stock', 'out of stock', 'reorder', 'shortage', 'balance', 'site branch stock', 'adu'],
    phrases: ['low stock items', 'check stock balance', 'stock level', 'branch stock'],
    answerEn: (ctx) =>
      `**How to Check Stock Balances & Low-Stock Alerts:**\n\n` +
      `• **Main Central Stock:** View central warehouse quantities, total received, dispatched, and low-stock indicators.\n` +
      `• **Site Branch Stock:** Inspect inventory held at each individual branch yard (*Received − Issued to Teams − Direct Project Usage + Team Returns − Branch Returns*).\n` +
      `• **Team In-Hand Stock:** View materials currently held by each field squad.\n\n` +
      `📌 *Live Workspace Status:* Out of **${ctx.activeItemsCount ?? 0}** active items, **${ctx.lowStockItemsCount ?? 0}** item(s) are currently at or below their low-stock threshold${
        ctx.lowStockItemNames && ctx.lowStockItemNames.length > 0
          ? ` (${ctx.lowStockItemNames.slice(0, 4).join(', ')})`
          : ''
      }.`,
    answerSi: (ctx) =>
      `**බඩු තොග (Stock Balances) සහ Low Stock පරීක්ෂා කරන ආකාරය:**\n\n` +
      `• **Main Central Stock:** ප්‍රධාන ගබඩාවේ දැනට පවතින තොග ප්‍රමාණයන් බලාගැනීමට.\n` +
      `• **Site Branch Stock:** එක් එක් Branch / Site එකෙහි පවතින බඩු තොග වෙන වෙනම බලාගැනීමට.\n` +
      `• **Team In-Hand Stock:** එක් එක් Team එක අතේ දැනට පවතින බඩු බලාගැනීමට.\n\n` +
      `📌 *දැනට පද්ධතියේ:* සක්‍රීය Items **${ctx.activeItemsCount ?? 0}** අතරින් Items **${ctx.lowStockItemsCount ?? 0}**ක් Low Stock සීමාවේ පවතී.`,
  },
  {
    id: 'format-settings-signers-digital-signatures',
    suggestedTab: 'templates',
    keywords: [
      'format',
      'formats',
      'iso',
      '9001',
      'signer',
      'signers',
      'signature',
      'signatures',
      'digital signature',
      'letterhead',
      'tenant header',
      'prepared by',
      'approved by',
      'reviewed by',
      'athsana',
      'athsan',
    ],
    phrases: [
      'format settings',
      'document templates',
      'digital signature',
      'digital signatures',
      'iso format',
      'auto tenant header',
      'signers',
      'add digital signature',
      'draw signature',
      'upload signature',
      'prepared by',
      'approved by',
      'format hadanne',
      'signature danne',
      'signers hadanne',
      'digital signature',
    ],
    answerEn: () =>
      `**How to Configure ISO 9001:2015 Format Settings, Auto Tenant Header, Signers & Digital Signatures ("Document Templates"):**\n\n` +
      `Open **Document Templates** from the left sidebar — it is organized into **3 clear tabs**:\n\n` +
      `**Tab 1 — "1. Section Formats (ISO Standard & Upload PDF/Image)":**\n` +
      `1. **Default ISO 9001:2015 Standard:** All 4 format groups (**FORMAT-01** to **FORMAT-04**) automatically default to the **ISO 9001:2015 Controlled Document Format** with your logged-in **Tenant Company Name**, Phone, Email, and Address auto-populated in the header.\n` +
      `2. **Upload Custom PDF / Image Format (Optional):** Click **Upload PDF or Image Format** on any card to upload your company's `.concat(
        `own PDF or Image layout. Check **"Use FORMAT-01 across all GRN, FOC & Stock Return sections too"** to unify Format-01 & 02 in 1 click.\n` +
          `3. **Format Settings & Live A4 Studio:** Click **Customize Format Settings & Preview** on any card to adjust **Render Mode** (*Header Banner + System Table*, *Full Page Watermark*, or *Smart Grid*), **Header Crop %**, **Table Column Labels**, and **Sign-Off Titles**, then click **Save Format Settings**.\n\n` +
          `**Tab 2 — "2. Auto Tenant Header & Signers":**\n` +
          `1. **Company Identity & Logo:** Review your auto-loaded **Tenant Registered Company Name**, Scope Subtitle, Phone, Email, Address, and choose **Logo Monogram Text** or **Logo Image (Upload)** (click **Sync from Tenant Account** anytime to re-sync).\n` +
          `2. **ISO Signer Names, Designations & Department Matrix:** Enter the **Signer Full Name**, **Designation**, and **Department** for:\n` +
          `   • **Prepared & Checked By** (Field / Site / Store Officer)\n` +
          `   • **Authorized & Approved By** (Central Management / Logistics Controller)\n` +
          `   • **Reviewed By**, **ISO Issue Number**, and **ISO Revision Number**\n` +
          `3. Click **Save ISO Header & Signers**.\n\n` +
          `**Tab 3 — "3. Digital Signatures" (Draw or Upload) & Default Print Mode:**\n` +
          `1. Click **+ Add Digital Signature**, enter the **Signer Full Name**, **Designation / Role**, and **Department**, then either **Draw Signature** on the pad or **Upload Signature Image** (PNG/JPG) and click **Save Signature**.\n` +
          `2. **Off Digital Signature (Default for Printing):** Enable this checkbox in Tab 3 if you want all printed vouchers and reports to hide digital signature images by default and leave clean dashed **Hand Signature & Stamp** spaces for wet-ink pen signing.\n` +
          `3. **Per-Print Toggle & Auto-Match:** Saved signatures auto-match signers by name. Inside any Voucher/Report print window, you can toggle **"Off Digital Signature"** right in the top toolbar OR select **"✍️ Off Digital Signature (Blank Hand-Sign Space)"** per signer inside **Edit Signers & Designations** before clicking **Print** or **Save PDF**!`
      ),
    answerSi: () =>
      `**Document Templates හි ISO 9001:2015 Format Settings, Auto Tenant Header, Signers, Digital Signatures සහ "Off Digital Signature" සකස් කරගන්නා ආකාරය:**\n\n` +
      `වම් පස මෙනුවෙන් **"Document Templates"** වෙත පිවිසෙන්න. එහි පැහැදිලි **ටැබ් 3ක්** ඇත:\n\n` +
      `**1 වන ටැබ් එක — "1. Section Formats (ISO Standard & Upload PDF/Image)":**\n` +
      `1. **Default ISO 9001:2015 Format:** කිසිදු ගොනුවක් Upload නොකළද, කාණ්ඩ 4ම (**FORMAT-01** සිට **FORMAT-04**) ජාත්‍යන්තර **ISO 9001:2015 Controlled Document Format** එකෙන් සහ ඔබේ ආයතනයේ නම (**Tenant Company Name**), දුරකථන, Email හා ලිපිනය ස්වයංක්‍රීයව Header එකට යොදාගෙන ක්‍රියාත්මක වේ.\n` +
      `2. **PDF / Image Upload සහ Unified Format:** ඔබේම PDF (.pdf) හෝ Image (.png/.jpg) ආකෘතියක් Upload කිරීමටත්, **"Use FORMAT-01 across all GRN, FOC & Stock Return sections too"** මගින් Format-01 හා 02 එකවර ඒකාබද්ධ කිරීමටත් පුළුවන.\n` +
      `3. **Format Settings වෙනස් කිරීම:** ඕනෑම කාණ්ඩයක **"Customize Format Settings & Preview"** ක්ලික් කර දකුණු පස Live A4 Studio එකෙන් **Render Mode**, **Header Crop %**, **Table Column Names** සහ **Sign-Off Titles** වෙනස් කර Save කළ හැක.\n\n` +
      `**2 වන ටැබ් එක — "2. Auto Tenant Header & Signers" (Signers සහ Logo සැකසීම):**\n` +
      `1. **Tenant Header & Logo:** ස්වයංක්‍රීයව ලැබී ඇති ආයතනයේ නම, දුරකථන, Email, ලිපිනය පරීක්ෂා කර **"Logo Monogram Text"** හෝ **"Logo Image (Upload)"** මගින් ආයතනික ලාංඡනය එක් කරන්න (**"Sync from Tenant Account"** මගින් නැවත Auto-fill කළ හැක).\n` +
      `2. **Signers (අත්සන් කරන නිලධාරීන්ගේ නම් සහ තනතුරු):** **"2. ISO Signer Names, Designations & Department Matrix"** යටතේ:\n` +
      `   • **Prepared & Checked By:** සකස් කරන නිලධාරියාගේ නම (Signer Full Name), තනතුර (Designation) සහ අංශය (Department)\n` +
      `   • **Authorized & Approved By:** අනුමත කරන නිලධාරියාගේ නම, තනතුර සහ අංශය\n` +
      `   • **Reviewed By** සහ **ISO Issue / Revision Numbers** ඇතුළත් කර **"Save ISO Header & Signers"** ක්ලික් කරන්න.\n\n` +
      `**3 වන ටැබ් එක — "3. Digital Signatures" සහ "Off Digital Signature (Default for Printing)":**\n` +
      `1. **"+ Add Digital Signature"** ක්ලික් කර නිලධාරියාගේ නම, තනතුර සහ අංශය ඇතුළත් කර තිරය මත අත්සන අඳින්න (**Draw Signature**) නැතිනම් Image එකක් **Upload** කර **"Save Signature"** ක්ලික් කරන්න.\n` +
      `2. **"Off Digital Signature (Default for Printing)":** කඩදාසි මත පෑනෙන් අත්සන් (Hand Sign) තැබීමට අවශ්‍ය නම් මෙම Checkbox එක On කර සියලුම මුද්‍රණ සඳහා ස්ථිර Default ලෙස Digital Signatures නිවා දමා හිස් **Hand Signature & Stamp** ඉඩ තබාගත හැක.\n` +
      `3. **වවුචර් වලට යෙදීම සහ Per-Print Toggle:** ඕනෑම වවුචරයක් හෝ වාර්තාවක් Print කරන විට ඉහළ තීරුවේ ඇති **"Off Digital Signature"** Checkbox එක හෝ **"Customize Voucher Header, Signers & Digital Signatures"** මගින් එම මුද්‍රණයට පමණක් Hand-Sign හිස් ඉඩ තබා Print / PDF කළ හැක!`,
  },
  {
    id: 'off-digital-signature-hand-sign',
    suggestedTab: 'templates',
    keywords: [
      'off digital',
      'hand sign',
      'hand signature',
      'pen sign',
      'manual sign',
      'ink sign',
      'rubber stamp',
      'athsan',
      'athsin',
      'panen',
      'blank sign',
    ],
    phrases: [
      'off digital signature',
      'hand sign',
      'hand signature',
      'blank hand-sign',
      'print without signature',
      'sign karanna ida',
      'athsan gahanna',
      'hand sign gahanda',
      'off digital',
    ],
    answerEn: () =>
      `**How to Use "Off Digital Signature" Mode for Physical Pen Signing & Rubber Stamping:**\n\n` +
      `Whenever you need to print physical copies for wet-ink pen signatures and official stamps, you have **3 convenient ways** to turn off Digital Signatures and open generous blank signing spaces:\n\n` +
      `1. **Quick Per-Print Toggle (Any Voucher or Report):** Open any Print / PDF modal across **All Vouchers (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV/Debit Note)**, **Client FOC Item/Project Reports**, **Full Report for This Site (Project)**, **Item Lifecycle / Forward Summaries**, or **Branch Staff & Teams Directory**, and check **"Off Digital Signature"** right in the top toolbar.\n` +
      `2. **Per-Signer Override ("Edit Signers & Designations"):** Inside any Voucher Print Preview, click **Customize Voucher Header, Signers & Digital Signatures** and pick **"✍️ Off Digital Signature (Blank Hand-Sign Space)"** individually for *Prepared By* or *Approved By*.\n` +
      `3. **Organization-Wide Default ("Document Templates -> 3. Digital Signatures"):** Check **"Off Digital Signature (Default for Printing)"** in Tab 3 if your company prefers hand-signed printouts by default across all reports.\n\n` +
      `When active, digital signature images are hidden and generous dashed signing zones (**Hand Signature & Date** / **Hand Signature & Stamp**) appear cleanly above each officer's name & designation.`,
    answerSi: () =>
      `**වවුචර් සහ වාර්තා Print කරද්දී පෑනෙන් අත්සන් (Hand Sign) තැබීමට "Off Digital Signature" භාවිත කරන ආකාරය:**\n\n` +
      `මුද්‍රිත පිටපත් මත පෑනෙන් අත්සන් කිරීමට සහ රබර් මුද්‍රා (Stamp) තැබීමට Digital අත්සන් සඟවා ප්‍රමාණවත් හිස් ඉඩක් ලබාගැනීමට **ක්‍රම 3ක්** ඇත:\n\n` +
      `1. **Print කරන මොහොතේදීම (ඕනෑම Voucher හෝ Report එකක):** සියලුම වවුචර් (**RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV/Debit Note**), **Client FOC වාර්තා**, **Full Report for This Site (Project)**, **Item Lifecycle Summaries** සහ **Branch Directory** වල Print තිරයේ ඉහළ තීරුවේ ඇති **"Off Digital Signature"** Checkbox එක On කරන්න.\n` +
      `2. **එක් නිලධාරියෙකු සඳහා පමණක් ("Edit Signers"):** වවුචරය Print Preview කර **"Customize Voucher Header, Signers & Digital Signatures"** ක්ලික් කර *Prepared By* හෝ *Approved By* Dropdown වෙතින් **"✍️ Off Digital Signature (Blank Hand-Sign Space)"** තෝරන්න.\n` +
      `3. **ආයතනයේ ස්ථිර Default ක්‍රමය ලෙස ("Document Templates -> 3. Digital Signatures"):** සෑම මුද්‍රණයක්ම Hand-Sign ක්‍රමයට තැබීමට අවශ්‍ය නම් Tab 3 හි **"Off Digital Signature (Default for Printing)"** Checkbox එක On කරන්න.\n\n` +
      `එවිට Digital Signature රූප සැඟවී, නිලධාරියාගේ නම සහ තනතුරට ඉහළින් පෑනෙන් අත්සන් තැබීමට සහ මුද්‍රා තැබීමට ඉතා පැහැදිලි හිස් කොටුවක් (**Hand Signature & Date / Stamp**) ලැබේ!`,
  },
  {
    id: 'glass-tone-themes-ui-subscriptions',
    suggestedTab: 'dashboard',
    keywords: [
      'glass tone',
      'theme',
      'sapphire',
      'gold',
      'color',
      'colors',
      'palette',
      'font',
      'typography',
      'subscription',
      'payments.lk',
      'payable',
      'stripe',
      'usd',
      'lkr',
      'billing',
      'inbound',
    ],
    phrases: [
      'glass tone',
      'sapphire & gold',
      'sapphire and gold',
      'change theme',
      'theme color',
      'wagu wala akuru',
      'akuru size',
      'font size',
      'payments.lk',
      'usd to lkr',
      'auto renew',
      'card subscription',
    ],
    answerEn: () =>
      `**Live "Glass Tone" Themes (Sapphire & Gold Default), Crisp Typography & Recurring Card Subscriptions:**\n\n` +
      `1. **9 Live "Glass Tone" Themes (Default: Sapphire & Gold):**\n` +
      `   • The system opens in **Sapphire & Gold** (Royal Navy & Gold matching the landing palette).\n` +
      `   • Click the **"Glass Tone"** color-swatch dropdown in the top Header sub-bar (or open **System Config**) to switch live across **9 Apple Liquid Glass themes**: *Sapphire & Gold, Liquid Emerald, Oceanic Teal, Cobalt Azure, Liquid Indigo, Liquid Amethyst, Obsidian Amber, Liquid Crimson,* and *Liquid Titanium*.\n` +
      `   • Switching dynamically rethemes the Header, Workspace Navigation Sidebar, Canvas backdrop, Hero Banners, table hovers, and Mobile Dock.\n\n` +
      `2. **Uniform Report/Table Typography & Main Central Stock Layout:**\n` +
      `   • All tables, **Inbound Receipts History**, and printed A4 reports use standardized crisp **13.5px body / 12px header** typography for effortless reading.\n` +
      `   • **Main Central Stock** organizes its mode switcher cleanly (*Central Stock Inventory, Returned From Sites, Damaged / Scrap Yard, Inbound Receipts History*).\n\n` +
      `3. **Auto-Renewing Card Subscriptions (Payments.lk & Stripe + Live USD → LKR):**\n` +
      `   • Open **Subscription** from the top Header to subscribe to **Pro Monthly** or **Pro Annual** via **Payments.lk / PAYable** or **Stripe** with live server-fetched **USD → LKR** exchange rate conversion and a Customer Billing Portal to manage auto-renewal anytime.`,
    answerSi: () =>
      `**සජීවී "Glass Tone" Themes (Sapphire & Gold Default), පැහැදිලි වගු/වාර්තා අකුරු සහ Auto-Renew Subscriptions:**\n\n` +
      `1. **සජීවී "Glass Tone" Theme 9 ("Sapphire & Gold" Default):**\n` +
      `   • පද්ධතිය විවෘත වන විට Default වර්ණය ලෙස Landing Page එකට ගැළපෙන **Sapphire & Gold** ක්‍රියාත්මක වේ.\n` +
      `   • ඉහළ Header තීරුවේ ඇති **"Glass Tone"** Dropdown එකෙන් (හෝ **System Config** වෙතින්) ඕනෑම මොහොතක **Theme 9ක්** අතර සජීවීව මාරු විය හැක: *Sapphire & Gold, Liquid Emerald, Oceanic Teal, Cobalt Azure, Liquid Indigo, Liquid Amethyst, Obsidian Amber, Liquid Crimson* සහ *Liquid Titanium*.\n` +
      `   • Theme එක මාරු කළ සැණින් Header, Workspace Navigation තීරුව, පසුබිම (Canvas), Banners සහ Mobile Dock සියල්ල අලංකාරව වෙනස් වේ.\n\n` +
      `2. **වගු සහ වාර්තා වල පැහැදිලි අකුරු ප්‍රමාණය (13.5px) සහ Main Central Stock පෙනුම:**\n` +
      `   • සියලුම වගු, **Inbound Receipts History** සහ Print කරන A4 වාර්තා එකම ප්‍රමිතියක පැහැදිලි අකුරු ප්‍රමාණයකින් (**13.5px body / 12px headers**) පෙනෙන ලෙස සකසා ඇත.\n` +
      `   • **Main Central Stock** හි *Central Stock Inventory, Returned From Sites, Damaged / Scrap Yard* සහ *Inbound Receipts History* බටන් ඉතා පිළිවෙළට වෙන් කර ඇත.\n\n` +
      `3. **Payments.lk / Stripe ස්වයංක්‍රීය කාඩ් Subscriptions (සජීවී USD → LKR):**\n` +
      `   • ඉහළ Header හි **Subscription** බටන් එක හරහා **Payments.lk / PAYable** (සජීවී **USD → LKR** විනිමය අනුපාතය සමඟ) හෝ **Stripe** මගින් Auto-Renewing Pro Monthly / Pro Annual කාඩ් ගෙවීම් සක්‍රිය කර Customer Billing Portal මගින් පාලනය කළ හැක.`,
  },
  {
    id: 'directory-audit-letterhead-backup',
    suggestedTab: 'branch-directory',
    keywords: ['directory', 'audit', 'report', 'print', 'backup', 'flush', 'config'],
    phrases: [
      'branch staff & teams',
      'audit trail',
      'system backup',
      'system config',
    ],
    answerEn: () =>
      `**Branch Directory, Isolated Single-Click Printing, Audit Trail & System Backups:**\n\n` +
      `• **Branch Staff & Teams:** View, filter, export to Excel (**Export Members**), and print the complete hierarchy of branches, supervisors, field teams, and crew members (including **"Off Digital Signature"** toggle).\n` +
      `• **Isolated Single-Click A4 Print & PDF Export:** Every Print button across all Vouchers, Full Site Reports, Barcode Labels, Team In-Hand, Branch Directory, and Audit Trail opens a clean, isolated A4 print preview with crisp uniform typography (**13.5px / 12px**) and optional **"Off Digital Signature"** hand-sign spaces.\n` +
      `• **Audit Trail:** Inspect chronological logs of every transaction and user action with PDF/CSV export.\n` +
      `• **System Backups & Config (Top Header):** Create/restore versioned JSON backups, open the **Offline Backup Viewer**, switch **Glass Tone** themes (**Sapphire & Gold** default), customize company settings, or perform an **Admin System Flush**.`,
    answerSi: () =>
      `**Branch Directory, Isolated Single-Click Print, Audit Trail සහ System Backups:**\n\n` +
      `• **Branch Staff & Teams:** සියලුම Branches, Supervisors, Teams සහ සාමාජිකයින්ගේ විස්තර බලාගැනීමට සහ **"Off Digital Signature"** සහිතව Print / Excel Export කිරීමට.\n` +
      `• **Isolated Single-Click A4 Print:** පද්ධතියේ ඕනෑම වවුචරයක හෝ වාර්තාවක Print එබූ විට පැහැදිලි **13.5px** අකුරු ප්‍රමාණයෙන් අදාළ වවුචරය/වාර්තාව පමණක් Print Preview වේ (අවශ්‍ය නම් **"Off Digital Signature"** මගින් පෑනෙන් අත්සන් තැබීමට ඉඩ තැබිය හැක).\n` +
      `• **Audit Trail:** පද්ධතියේ සිදු කළ සියලුම ගනුදෙනු පිළිබඳ වාර්තා ලබාගැනීමට.\n` +
      `• **System Backup, Glass Tone & Config (ඉහළ Header තීරුව):** Backup ලබාගැනීමට, Restore කිරීමට, **Glass Tone** Theme 9 අතර මාරු වීමට සහ ආයතනයේ Settings වෙනස් කිරීමට.`,
  },
  {
    id: 'email-verification-branding',
    suggestedTab: 'dashboard',
    keywords: [
      'email',
      'verify',
      'verification',
      'apexstox',
      'support@apexstox.com',
      'domain',
      'inbox',
      'link',
    ],
    phrases: [
      'email verification',
      'send verification email',
      'verify email',
      'verify account',
      'email link',
      'verify karanne',
    ],
    answerEn: () =>
      `**Automatic Email Verification & Official Support Contact (apexstox.com):**\n\n` +
      `1. **1-Click Send Verification Email:** In the email verification screen, click **Send Verification Email**.\n` +
      `2. **Instant Verification on Link Click:** Open your inbox (check Spam/Promotions if needed) and click the verification link from **apexstox.com** — your account automatically completes verification as soon as the link is clicked without extra confirmation buttons.\n` +
      `3. **Official Support Contact:** Need account or workspace help? Contact **support@apexstox.com** (Website: **apexstox.com**).`,
    answerSi: () =>
      `**ස්වයංක්‍රීය Email Verification සහ නිල සහාය සේවාව (apexstox.com):**\n\n` +
      `1. **Send Verification Email:** Verification පණිවිඩයේ ඇති **"Send Verification Email"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. **ලින්ක් එක ක්ලික් කළ සැණින් Verify වීම:** ඔබේ Email Inbox එකට (නැතිනම් Spam folder එකට) **apexstox.com** වෙතින් ලැබෙන Email එකේ Verification Link එක ක්ලික් කළ සැණින් අමතර බටන් එබීමකින් තොරව ගිණුම ස්වයංක්‍රීයව Verify වේ.\n` +
      `3. **නිල සම්බන්ධතා විස්තර:** ඕනෑම තාක්ෂණික සහායක් සඳහා **support@apexstox.com** හෝ **apexstox.com** වෙත පිවිසෙන්න.`,
  },
];

export function resolveSmartSystemSupportAnswer(
  userQuestion: string,
  ctx: SupportWorkspaceContext
): SupportAnswerResult {
  const q = userQuestion.trim().toLowerCase();
  const useSinhala = ctx.language === 'si' || detectSinhalaOrSinglishInput(userQuestion);

  let bestTopic: KnowledgeTopic | null = null;
  let bestScore = 0;

  for (const topic of KNOWLEDGE_TOPICS) {
    let score = 0;
    for (const phrase of topic.phrases) {
      if (q.includes(phrase)) {
        score += 6;
      }
    }
    for (const kw of topic.keywords) {
      if (q.includes(kw)) {
        score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic && bestScore > 0) {
    return {
      reply: useSinhala ? bestTopic.answerSi(ctx) : bestTopic.answerEn(ctx),
      suggestedTab: bestTopic.suggestedTab,
    };
  }

  if (useSinhala) {
    return {
      suggestedTab: ctx.currentTab || 'dashboard',
      reply:
        `**ApexStox (Apex Stock) Enterprise — සම්පූර්ණ මගපෙන්වීම:**\n\n` +
        `ඔබ දැනට **${ctx.userRole || 'Staff'}** ලෙස **${ctx.branchName || 'All Branches'}** හි සිටී. පද්ධතියේ ප්‍රධාන සහ නවතම කොටස්:\n` +
        `1. **3-Tier ගබඩා ව්‍යුහය & Sub-Site Stock/FOC Lock:** Sub-Site Branches සෑදීම, **"Issue Stock to Sub-Site"**, Parent-routed Requisitions, සහ බඩු/FOC ලබාදුන් Sub-Site Delete හා Parent මාරු Lock වීම.\n` +
        `2. **Site Branch Stock "Damaged Returns" ටැබ් එක:** Teams හා Sub-Sites වෙතින් ආ Damaged/Scrap භාණ්ඩ වෙන්ව බලා සෘජුවම Parent Site / Central Main Warehouse වෙත **BRM** වවුචර මගින් Return කිරීම.\n` +
        `3. **අනිවාර්ය Team Project Sections & 0 Balance Lock:** Team Register කරද්දී Section තේරීම අනිවාර්ය වීම, වෙනම නම් (**\`Alex NC Team 1\`** / **\`Alex Civil Team 1\`**), In-Hand 0 කළ පසු Section මාරු කිරීම, සහ **Material Usage** හි අදාළ Section එකේ Teams පමණක් පෙන්වීම.\n` +
        `4. **පියවර 5 Free Stock (FOC) Reconciliation & "ALL AREAS":** Central Receipt -> Site Issue -> Team Issue -> Usage/Wastage -> Returnable Balance පිළිවෙළ, **"Central FOC"** Badge, සහ **"Main Project -> Under New Connections"**.\n` +
        `5. **Field Team Site Transfer & Site-Separated Stock:** **"Temporary Assigned to - [New Site]"** -> Permanent **"[Team Name] (Ref: [Old Site])"** සහ **"Stock to Return - [Site Name]"**.\n` +
        `6. **Document Templates & "Off Digital Signature":** ISO 9001:2015 Formats, Digital Signatures, පෑනෙන් අත්සන් තැබීමේ **"Off Digital Signature"** ක්‍රමය, සහ **13.5px** පැහැදිලි වගු/වාර්තා අකුරු.\n` +
        `7. **"Glass Tone" Live Themes 9 & Auto-Renew Subscriptions:** **"Sapphire & Gold"** Default ලෙස Header හි **"Glass Tone"** වෙතින් Theme 9ක් අතර මාරු වීම සහ Payments.lk / Stripe (USD → LKR) Subscriptions.\n\n` +
        `ඉහත Quick Help බටන් එකක් තෝරන්න හෝ ඔබට දැනගැනීමට අවශ්‍ය ඕනෑම කොටසක් ගැන අහන්න!`,
    };
  }

  return {
    suggestedTab: ctx.currentTab || 'dashboard',
    reply:
      `**ApexStox (Apex Stock) Enterprise — Complete Feature Guide:**\n\n` +
      `You are logged in as **${ctx.userRole || 'Staff'}** (${ctx.branchName || 'All Branches'}). Here are all modules & latest updates available:\n` +
      `1. **3-Tier Hierarchy & Sub-Site Stock/FOC Lock:** Nest **Sub-Site Branches** under Regional Sites, use **Issue Stock to Sub-Site** or parent-routed **Stock Requisitions (Parent Avl:)**, with Sub-Site deletion & parent reassignment locked once stock/FOC is issued.\n` +
      `2. **Site Branch Stock "Damaged Returns" Quarantine Tab:** Inspect **Damaged / Scrap** returns from Teams & Sub-Sites separately from usable stock and dispatch upstream **BRM** vouchers straight to Parent Site or Central HQ.\n` +
      `3. **Mandatory Team Project Sections, Separate Naming & 0-Balance Lock:** Teams require a Project Section (**\`Alex NC Team 1\`** vs. **\`Alex Civil Team 1\`**), section switching locks until **0 In-Hand Stock**, and **Material Usage** strictly filters **Executing Field Team *** by the selected section.\n` +
      `4. **5-Stage Client Free Stock (FOC) Reconciliation & "ALL AREAS":** Chronological flow (Central -> Site -> Team -> Usage & Wastage -> Returnable Balance), color-coded Main/Sub-Project cards, **"Central FOC"** badge, and **"Main Project -> Under New Connections"**.\n` +
      `5. **Field Team Site Transfer & Site-Separated In-Hand Stock:** **"Temporary Assigned to - [New Site]"** -> Permanent **"[Team Name] (Ref: [Previous Site])"** and **"Stock to Return - [Previous Site Name]"**.\n` +
      `6. **Document Templates & "Off Digital Signature" Hand-Sign Mode:** ISO 9001:2015 formats, Signers, Digital Signatures, plus **"Off Digital Signature"** for generous blank pen-signing & stamp boxes.\n` +
      `7. **9 Live "Glass Tone" Themes ("Sapphire & Gold" Default) & Recurring Billing:** Switch themes live from Header **Glass Tone** and manage Payments.lk / Stripe auto-renewing card subscriptions with live **USD → LKR** rate conversion.\n\n` +
      `Click any **Quick Help** topic above or ask about any specific feature!`,
  };
}
