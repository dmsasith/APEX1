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
    ],
    answerEn: (ctx) =>
      `**How to Create New Project Sections & Configure Default Material Templates (BOM):**\n\n` +
      `**Part 1 — Create a New Project Section:**\n` +
      `1. Open **Project & New Section Registry** from the left sidebar.\n` +
      `2. Click the **+ New Section Registry** button at the top right (or click the **New Section Registry & Material Templates** tab and click **+ Create New Section**).\n` +
      `3. Enter the **Section Name** (e.g., *Telecom New Connection*, *Telecom Cable Development*), **Short Code** (e.g., *TNC*), **Badge Theme Color**, and **Description**.\n` +
      `4. Click **Create Section**.\n\n` +
      `**Part 2 — Configure a Default Material Template (BOM) for that Section:**\n` +
      `1. Inside the **New Section Registry & Material Templates** tab, find your section card.\n` +
      `2. Click **Configure Material Template** (or **Edit Material Template (BOM)**).\n` +
      `3. Select the standard items routinely used in this section, click **+ Add Item to Template** to add more rows, and enter the optional **Suggested Qty** for each item.\n` +
      `4. Click **Save Material Template**.\n` +
      `5. **Automatic Pre-Fill:** Whenever a user selects a project belonging to this section in **Material Usage**, these template items and suggested quantities load automatically!${
        ctx.activeProjectSectionsCount
          ? `\n\n📌 *Current Workspace Status:* **${ctx.activeProjectSectionsCount} project section(s)** configured${
              ctx.projectSectionNames && ctx.projectSectionNames.length > 0
                ? ` (${ctx.projectSectionNames.slice(0, 5).join(', ')})`
                : ''
            }.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**අලුත් Project Section එකක් සාදා එයට Material Template (BOM) එකක් සකස් කරන ආකාරය:**\n\n` +
      `**1 වන පියවර — අලුත් Project Section එකක් සෑදීම (New Section Registry):**\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත යන්න.\n` +
      `2. ඉහළ දකුණු කෙළවරේ ඇති **"+ New Section Registry"** බටන් එක ක්ලික් කරන්න (නැතිනම් **"New Section Registry & Material Templates"** ටැබ් එකට ගොස් **"+ Create New Section"** ක්ලික් කරන්න).\n` +
      `3. **Section Name** (උදා: *Telecom New Connection*), **Short Code** (උදා: *TNC*), **Badge Color** සහ විස්තරය ඇතුළත් කර **"Create Section"** ක්ලික් කරන්න.\n\n` +
      `**2 වන පියවර — එම Section එකට Default Material Template (BOM) එකක් සෑදීම:**\n` +
      `1. **"New Section Registry & Material Templates"** ටැබ් එකෙහි ඔබ සෑදූ Section Card එක මත ඇති **"Configure Material Template"** (හෝ **"Edit Material Template (BOM)"**) බටන් එක ක්ලික් කරන්න.\n` +
      `2. එම Section එකේ වැඩ වලට සාමාන්‍යයෙන් වැය වන Items ලැයිස්තුවෙන් තෝරන්න. තවත් Items එකතු කිරීමට **"+ Add Item to Template"** ක්ලික් කරන්න.\n` +
      `3. එක් එක් Item එකට අදාළ සාමාන්‍ය ප්‍රමාණය (**Suggested Qty**) ඇතුළත් කර **"Save Material Template"** ක්ලික් කරන්න.\n` +
      `4. **ප්‍රයෝජනය:** ඉන්පසු **"Material Usage"** පිටුවේදී එම Section එකට අදාළ ඕනෑම Project එකක් තේරූ විට මෙම Template එකේ බඩු ලැයිස්තුව ස්වයංක්‍රීයව (Auto-fill) එතැනට ලැබේ!${
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
    ],
    answerEn: (ctx) =>
      `**How Major / Main Projects, Sub-Projects, Individual Projects & Free Stock (FOC) Reconciliation Work:**\n\n` +
      `**Step 1 — Register Major / Main Projects, Sub-Projects & Individual Projects (Project & New Section Registry):**\n` +
      `1. Open **Project & New Section Registry** and click **Register Project**.\n` +
      `2. Select the **Project Structure Type**:\n` +
      `   • **🏢 Major / Main Project (Umbrella):** Use when a client issues bulk Free Stock for an entire area or contract containing multiple sub-projects. You can also add initial Sub-Projects right inside the same modal, or click **+ Sub-Project** on any Main Project row anytime.\n` +
      `   • **↳ Sub-Project (Under Main Project):** Links a sub-project under a Parent Major / Main Project so it shares the Main Project's Free Stock pool.\n` +
      `   • **📄 Individual Project (Standalone):** A single standalone project with its own independent stock & usage ledger.\n\n` +
      `**Step 2 — Receive Client Free-Issue Stock (FOC) Under a Main Project:**\n` +
      `1. Open **Client Free Stock (FOC)** and click **+ Log Client Free Stock**.\n` +
      `2. Select **🏢 Under Main Project** (or **📄 Individual Project**), choose the Main Project name, and receive the client's bulk materials into the Main Project pool.\n\n` +
      `**Step 3 — Enter Material Usage per Sub-Project & Reconcile Total vs. Sub-Projects:**\n` +
      `1. Open **Material Usage** -> in Step 2, select the **Sub-Project** (or click **+ Register New Sub-Project** to create one under a Main Project on the fly).\n` +
      `2. When you log material usage on a Sub-Project, it **automatically deducts from the Parent Main Project's Free Stock balance**.\n` +
      `3. Open the **Reconciliation** tab (Tab 3): select the **🏢 Major / Main Project** to view the **Total Main Project Reconciliation** (Total Received vs. Total Used across all Sub-Projects = Net Remaining Balance) plus the **Sub-Projects Individual Breakdown**, or select any **↳ Sub-Project** to inspect its standalone details.${
        ctx.activeProjectsCount ? `\n\n📌 *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**Major / Main Projects, Sub-Projects, Individual Projects සහ Free Stock (FOC) Reconciliation ක්‍රියාත්මක වන ආකාරය:**\n\n` +
      `**1 වන පියවර — Project Registry තුළ Main Project, Sub-Project සහ Individual Project සෑදීම:**\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත ගොස් **"Register Project"** ක්ලික් කරන්න.\n` +
      `2. එහි ඇති ව්‍යුහයන් 3න් අදාළ වර්ගය තෝරන්න:\n` +
      `   • **🏢 Major / Main Project (Umbrella):** Client විසින් සම්පූර්ණ කලාපයකට හෝ Sub-Projects කිහිපයකට එකවර Free Stock නිකුත් කරන ප්‍රධාන ව්‍යාපෘතිය. (මෙය සාදන විටම ඊට අදාළ Sub-Projects ලැයිස්තුවත් එකවර ඇතුළත් කළ හැක. නැතිනම් Main Project පේළියේ ඇති **"+ Sub-Project"** බටන් එකෙන් ඕනෑම විටක Sub-Projects එකතු කළ හැක).\n` +
      `   • **↳ Sub-Project (Under Main Project):** ප්‍රධාන ව්‍යාපෘතියක් යටතේ ක්‍රියාත්මක වන අනු-ව්‍යාපෘතිය.\n` +
      `   • **📄 Individual Project (Standalone):** වෙනම තනි ව්‍යාපෘතියක් ලෙස ක්‍රියාත්මක වන සාමාන්‍ය ව්‍යාපෘති.\n\n` +
      `**2 වන පියවර — Client Free Stock (FOC) බඩු Main Project එක යටතට භාරගැනීම:**\n` +
      `1. **"Client Free Stock (FOC)"** වෙත ගොස් **"+ Log Client Free Stock"** ක්ලික් කරන්න.\n` +
      `2. **"🏢 Under Main Project"** (හෝ තනි ව්‍යාපෘතියක් නම් **"📄 Individual Project"**) තෝරා, අදාළ Main Project නම යටතට බඩු තොගය Receive කරන්න.\n\n` +
      `**3 වන පියවර — Sub-Project වලට Material Usage දැමීම සහ Total / Sub-Project Reconciliation බැලීම:**\n` +
      `1. **"Material Usage"** පිටුවේ 2 වන කොටසේදී අදාළ **Sub-Project** එක තෝරා (හෝ **"+ Register New Sub-Project"** මගින් අලුත් Sub-Project එකක් සාදා) බඩු Usage ඇතුළත් කරන්න.\n` +
      `2. Sub-Project එකට බඩු Usage දැමූ සැණින් එය **ස්වයංක්‍රීයව Main Project එකේ Free Stock තොගයෙන් අඩු වේ**.\n` +
      `3. **"Reconciliation"** (Tab 3) වෙත ගොස් **🏢 Major / Main Project** එක තේරූ විට සම්පූර්ණ ව්‍යාපෘතියේම ගැලපුම (Total Received vs. සියලුම Sub-Projects වල Total Used = Remaining Balance) සහ ඊට පහළින් **එක් එක් Sub-Project එකේ වෙන වෙනම විස්තර (Sub-Projects Individual Breakdown)** බලාගත හැක.${
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
    ],
    phrases: [
      'how to register a project',
      'register new project',
      'import projects',
      'project master list',
      'project ekak hadanne',
      'project register karanne',
    ],
    answerEn: (ctx) =>
      `**How to Register & Manage Projects (Major/Main, Sub-Project & Individual):**\n\n` +
      `1. **Open Project Registry:** Click **Project & New Section Registry** in the left sidebar.\n` +
      `2. **Choose Project Structure Type:** Click **Register Project** and select:\n` +
      `   • **🏢 Major / Main Project:** Umbrella project that holds multiple Sub-Projects and a shared Client Free Stock pool.\n` +
      `   • **↳ Sub-Project:** Linked under a Parent Main Project (can also be added in 1 click via **+ Sub-Project** on any Main Project row).\n` +
      `   • **📄 Individual Project:** Standalone single project.\n` +
      `3. **Enter Project Details:** Fill in Project ID, Reference No, Project/Customer Name, Customer Phone Number, Site ID, Client/Principal, Project Section, District, and Sub Area.\n` +
      `4. **Bulk CSV Import / Export:** Use **Sample CSV**, **Import CSV**, or **Export CSV**.\n` +
      `5. **Reconciliation & Usage View:** Click the **usage entry(s)** badge on any Main Project or Sub-Project row to inspect the shared Free Stock pool, Sub-Project breakdown, and team consumption.${
        ctx.activeProjectsCount ? `\n\n📌 *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**අලුත් Project එකක් (Main Project, Sub-Project හෝ Individual Project) ලියාපදිංචි කරන ආකාරය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත යන්න.\n` +
      `2. **"Register Project"** ක්ලික් කර ව්‍යාපෘති වර්ගය තෝරන්න:\n` +
      `   • **🏢 Major / Main Project:** Sub-Projects කිහිපයක් සහ පොදු Free Stock තොගයක් සහිත ප්‍රධාන ව්‍යාපෘතිය.\n` +
      `   • **↳ Sub-Project:** ප්‍රධාන ව්‍යාපෘතියක් යටතේ ඇති අනු-ව්‍යාපෘතිය (Main Project පේළියේ ඇති **"+ Sub-Project"** බටන් එකෙන්ද එක් කළ හැක).\n` +
      `   • **📄 Individual Project:** වෙනම තනි ව්‍යාපෘතියක්.\n` +
      `3. **විස්තර ඇතුළත් කිරීම:** Project ID, Project/Customer Name, දුරකථන අංකය, Project Section, District සහ Sub Area ඇතුළත් කර Save කරන්න.\n` +
      `4. **CSV Import / Export:** **"Sample CSV"** සහ **"Import CSV"** මගින් Projects රැසක් එකවර ඇතුළත් කළ හැක.${
        ctx.activeProjectsCount ? `\n\n📌 *දැනට සක්‍රීය Projects **${ctx.activeProjectsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'project-usage',
    suggestedTab: 'project-usage',
    keywords: ['usage', 'consume', 'consumption', 'boq', 'bill of quantities', 'project material', 'override', 'reserved project', 'waya'],
    phrases: [
      'record project usage',
      'project material usage',
      'log material usage',
      'cross project override',
      'project ekata',
      'material usage danne',
    ],
    answerEn: () =>
      `**How to Record Project Material Usage (Sub-Projects & Individual Projects) & Reconcile:**\n\n` +
      `1. **Open Material Usage:** Click **Material Usage** in the left sidebar.\n` +
      `2. **Select Sub-Project or Individual Project (Step 2):** Filter by **↳ Sub-Projects (Under Main)**, **🏢 Major / Main Projects**, or **📄 Individual Projects**, or click **+ Register New Sub-Project / Site** to create a Sub-Project under a Main Project on the fly. The section's **Default Material Template (BOM)** loads automatically!\n` +
      `3. **Automatic Main Project Free Stock Deduction:** When logging usage on a Sub-Project, quantities automatically deduct from the Parent Main Project's shared **Client Free Stock (FOC)** pool while tracking that Sub-Project's usage separately.\n` +
      `4. **Total & Sub-Project Reconciliation (Tab 3):** Open the **Reconciliation** tab to view the full **Major / Main Project Reconciliation** (with a card breakdown of every Sub-Project) or inspect any individual **Sub-Project**.`,
    answerSi: () =>
      `**Project Material Usage (Sub-Projects සහ Individual Projects සඳහා වැය වූ බඩු) සටහන් කරන ආකාරය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Material Usage"** වෙත යන්න.\n` +
      `2. **Sub-Project හෝ Individual Project තෝරන්න (Step 2):** ප්‍රධාන ව්‍යාපෘතියක් යටතේ ඇති **Sub-Project** එකක් හෝ **Individual Project** එකක් තෝරන්න (නැතිනම් **"+ Register New Sub-Project / Site"** මගින් එතැනදීම නව Sub-Project එකක් සාදන්න). Section එකේ **Material Template (BOM)** බඩු ලැයිස්තුව ස්වයංක්‍රීයව ලැබේ.\n` +
      `3. **Main Project Free Stock එකෙන් ස්වයංක්‍රීයව අඩු වීම:** Sub-Project එකකට බඩු Usage දැමූ විට එයට අදාළ ප්‍රධාන ව්‍යාපෘතියේ (Main Project) Client Free Stock තොගයෙන් ඉබේම අඩු වේ.\n` +
      `4. **Reconciliation (Tab 3):** **"Reconciliation"** ටැබ් එක මගින් සම්පූර්ණ Main Project එකේ මුළු ගැලපුම මෙන්ම එක් එක් Sub-Project එකේ වෙන වෙනම බඩු භාවිතයද පරීක්ෂා කළ හැක.`,
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
      `**How to Request & Transfer Stock from Main Warehouse to a Branch Yard:**\n\n` +
      `1. **Create a Stock Requisition:** Go to **Stock Requisitions** from the left sidebar and click **+ New Stock Requirement Form**.\n` +
      `2. **Select Branch & Items:** Choose the destination **Branch / Site Yard**, select the required items and quantities, and submit.\n` +
      `3. **Approve & Dispatch (HQ):** The **Super Admin** or **Main Storekeeper** reviews the request under **Stock Requisitions** and clicks **Approve & Dispatch** (partial dispatch quantities are also supported).\n` +
      `4. **Confirm Receipt at Branch (GRN):** The **Branch Supervisor** clicks **Confirm Receipt (GRN)** on the dispatched request to add the items into their **Site Branch Stock**.\n\n` +
      `*Tip:* Admins can also perform an instant **Direct Stock Transfer** from **Main Central Stock** without waiting for a request.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *Live Status:* **${ctx.pendingRequestsCount} pending stock request(s)** waiting for action.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**Main Warehouse (ප්‍රධාන ගබඩාවේ) සිට Branch / Site එකකට බඩු Request කර Transfer කරගන්නා ආකාරය:**\n\n` +
      `1. **Request එකක් දැමීම:** වම් පස මෙනුවෙන් **"Stock Requisitions"** වෙත ගොස් **"+ New Stock Requirement Form"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. **Branch එක සහ බඩු තේරීම:** බඩු අවශ්‍ය **Branch / Site එක** තෝරා, අවශ්‍ය Items සහ ප්‍රමාණයන් ඇතුළත් කර Submit කරන්න.\n` +
      `3. **Approve & Dispatch කිරීම:** ප්‍රධාන ගබඩාවේ **Super Admin** හෝ **Main Storekeeper** විසින් එම ඉල්ලීම පරීක්ෂා කර **"Approve & Dispatch"** ක්ලික් කළ විට Main Stock එකෙන් බඩු නිකුත් වේ.\n` +
      `4. **Branch එකට භාරගැනීම (Confirm Receipt):** අදාළ Branch Supervisor විසින් **"Confirm Receipt (GRN)"** ක්ලික් කළ පසු එම බඩු **"Site Branch Stock"** එකට එකතු වේ.${
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
      `**How to Issue Materials to Field Teams & Track Team In-Hand Custody:**\n\n` +
      `1. **Check Branch Inventory:** Ensure the required items have available stock (> 0) in **Site Branch Stock**.\n` +
      `2. **Open Issue to Teams:** Click **Issue to Teams** in the left sidebar.\n` +
      `3. **Select Branch & Team:** Choose the **Branch Yard** and the **Field Team** receiving the items.\n` +
      `4. **Select Items & Print Gate Pass:** Pick the items and quantities, click **Issue Material to Team**, and print the official **Gate Pass / Issue Voucher**.\n` +
      `5. **Team In-Hand Stock:** Open **Team In-Hand Stock** to monitor the live balance held by each team (*Total Issued − Used in Projects − Returned to Branch*).${
        ctx.activeTeamsCount ? `\n\n📌 *Currently **${ctx.activeTeamsCount} active field team(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**Branch එකේ සිට Field Team එකකට බඩු නිකුත් කිරීම (Issue to Teams) සහ Team In-Hand බැලීම:**\n\n` +
      `1. පළමුව අදාළ Branch එකේ (**Site Branch Stock**) නිකුත් කිරීමට අවශ්‍ය බඩු තොගය තිබිය යුතුය.\n` +
      `2. වම් පස මෙනුවෙන් **"Issue to Teams"** තෝරන්න.\n` +
      `3. බඩු නිකුත් කරන **Branch Yard එක** සහ **Field Team එක** තෝරා, Items සහ ප්‍රමාණයන් ඇතුළත් කර **"Issue Material to Team"** ක්ලික් කරන්න.\n` +
      `4. **Team In-Hand Stock:** එක් එක් Team එක අතේ දැනට ඉතිරිව පවතින බඩු තොගය **"Team In-Hand Stock"** පිටුවෙන් සජීවීව බලාගත හැක.${
        ctx.activeTeamsCount ? `\n\n📌 *දැනට සක්‍රීය Teams **${ctx.activeTeamsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'returns',
    suggestedTab: 'returns',
    keywords: ['return', 'unused', 'damaged', 'surplus', 'hand back', 'branch return', 'team return', 'ithiri'],
    phrases: [
      'return unused stock',
      'team returns',
      'branch returns',
      'return materials',
      'badu return karanne',
    ],
    answerEn: () =>
      `**How to Return Unused or Damaged Stock (Team Returns & Branch Returns):**\n\n` +
      `• **Option A — Team Returns to Branch Yard (Team Returns):**\n` +
      `  1. Open **Team Returns** from the sidebar.\n` +
      `  2. Select the **Field Team** and receiving **Branch Yard**.\n` +
      `  3. Enter the returned quantity and condition (**Good** restores usable Site Branch Stock; **Damaged** logs into the Damaged Stock ledger).\n\n` +
      `• **Option B — Branch Return to Central Main Warehouse (Branch Returns):**\n` +
      `  1. Open **Branch Returns** from the sidebar.\n` +
      `  2. Select your **Branch Yard**, pick the surplus items and quantities to send back to the Central Main Warehouse (HQ), and submit.`,
    answerSi: () =>
      `**ඉතිරි වූ හෝ හානි වූ බඩු නැවත ගබඩාවට Return කරන ආකාරය:**\n\n` +
      `• **1. Team එකක සිට Branch එකට Return කිරීම ("Team Returns"):**\n` +
      `  - වම් පස මෙනුවෙන් **"Team Returns"** වෙත ගොස් අදාළ Team එක තෝරන්න.\n` +
      `  - ඉතිරි වූ බඩු ප්‍රමාණය සහ තත්ත්වය (**Good** හෝ **Damaged**) තෝරා Save කරන්න.\n\n` +
      `• **2. Branch එකක සිට ප්‍රධාන ගබඩාවට (Main Stock) Return කිරීම ("Branch Returns"):**\n` +
      `  - වම් පස මෙනුවෙන් **"Branch Returns"** වෙත ගොස් Branch එකේ ඉතිරි බඩු නැවත ප්‍රධාන ගබඩාව (HQ) වෙත යැවිය හැක.`,
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
      `2. **Full or Partial GRN Receipt:** When goods arrive, click **Receive GRN** on the PO to receive full or partial batch quantities directly into **Main Central Stock** (or close remaining balances).\n` +
      `3. **Supplier Returns (RTV) & Debit Notes:** For defective or damaged deliveries, create a **Supplier Return**, dispatch with Gate Pass & vehicle details, print an official **Debit Note**, and record supplier settlement (Replacement, Credit Note, or Refund).`,
    answerSi: () =>
      `**Supplier Orders (PO), Supplier Returns සහ Debit Notes කළමනාකරණය:**\n\n` +
      `1. **Purchase Order සෑදීම:** වම් පස මෙනුවෙන් **"Supplier Orders (PO)"** වෙත ගොස් අලුත් PO එකක් සාදන්න.\n` +
      `2. **PO එකට බඩු භාරගැනීම (Full / Partial GRN):** Supplier බඩු එවූ පසු **"Receive GRN"** මගින් සම්පූර්ණ හෝ කොටස් වශයෙන් Main Stock එකට බඩු භාරගත හැක.\n` +
      `3. **Supplier Return & Debit Note:** හානි වූ බඩු නැවත Supplier වෙත යැවීමට, Gate Pass සහ **Debit Note** මුද්‍රණය කිරීමට සහ Settlement සටහන් කිරීමට Supplier Return පහසුකම භාවිතා කරන්න.`,
  },
  {
    id: 'client-foc',
    suggestedTab: 'client-free-stock',
    keywords: ['client free', 'foc', 'free issue', 'customer supplied', 'principal', 'client stock', 'free stock'],
    phrases: ['client free stock', 'free of charge', 'client material', 'under main project'],
    answerEn: () =>
      `**How to Manage Client Free Stock (FOC) — Under Main Project or Individual Project:**\n\n` +
      `1. Open **Client Free Stock (FOC)** from the left sidebar and click **+ Log Client Free Stock**.\n` +
      `2. Choose the **Target Project Mode**:\n` +
      `   • **🏢 Under Main Project (Shared Pool for Sub-Projects):** Select a Major / Main Project to receive bulk FOC materials covering all its child Sub-Projects.\n` +
      `   • **📄 Individual Project (Standalone):** Receive FOC materials for a single standalone project.\n` +
      `3. **Automatic Drawdown & Breakdown:** Whenever field usage is logged on any Sub-Project under that Main Project, it automatically deducts from the Main Project's FOC balance, and the **Project Free Stock Balances** tab shows both the **Main Project Net Balance** and the **Sub-Projects Individual Usage Breakdown**.`,
    answerSi: () =>
      `**Client Free Stock (FOC - සේවාදායකයින් නොමිලේ ලබාදෙන බඩු) Under Main Project හෝ Individual Project ලෙස කළමනාකරණය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Client Free Stock (FOC)"** වෙත ගොස් **"+ Log Client Free Stock"** ක්ලික් කරන්න.\n` +
      `2. **Target Project Mode** තෝරන්න:\n` +
      `   • **🏢 Under Main Project:** Sub-Projects කිහිපයක් ඇති ප්‍රධාන ව්‍යාපෘතියකට (Main Project) සම්පූර්ණ බඩු තොගය භාරගැනීමට.\n` +
      `   • **📄 Individual Project:** තනි ව්‍යාපෘතියකට බඩු භාරගැනීමට.\n` +
      `3. **ස්වයංක්‍රීය අඩු වීම:** එම Main Project එක යටතේ ඇති ඕනෑම Sub-Project එකකට Material Usage දැමූ විට Main Project FOC තොගයෙන් ඉබේම අඩු වන අතර, එක් එක් Sub-Project එකේ භාවිතය වෙන වෙනමද බලාගත හැක.`,
  },
  {
    id: 'items-barcodes-machinery',
    suggestedTab: 'items',
    keywords: ['barcode', 'qr', 'scanner', 'usb scanner', 'camera scan', 'machinery', 'plant', 'equipment', 'excel import', 'item catalog'],
    phrases: [
      'item catalog',
      'plant & equipment',
      'print barcode',
      'barcode scanner',
      'import items excel',
    ],
    answerEn: (ctx) =>
      `**Item Catalog, Plant & Equipment, Excel Import & Barcode Scanning:**\n\n` +
      `• **Item Catalog & Plant/Equipment:** Open **Item Catalog** for all items or **Plant & Equipment** specifically for machinery and tools. Items can also be marked as **Project-Reserved**.\n` +
      `• **Excel Bulk Import / Export:** Import items from Excel/CSV using **Sync (Add + Update)**, **Append Only**, or **Replace** modes.\n` +
      `• **Barcode Labels & Scanning:** Auto-generate missing barcodes, print **Barcode Sticker Labels** (` +
      `CODE128, CODE39, EAN13), and scan items using a **USB HID Barcode Scanner** or **Mobile Camera Scanner**.\n\n` +
      `📌 *Current Catalog:* **${ctx.activeItemsCount ?? 0}** active items (**${ctx.lowStockItemsCount ?? 0}** low-stock alerts).`,
    answerSi: (ctx) =>
      `**Item Catalog, Plant & Equipment, Excel Import සහ Barcode පහසුකම්:**\n\n` +
      `• **Item Catalog & Plant/Equipment:** සියලුම භාණ්ඩ **"Item Catalog"** මගින්ද, යන්ත්‍රෝපකරණ සහ Tools **"Plant & Equipment"** මගින්ද කළමනාකරණය කළ හැක.\n` +
      `• **Excel Import / Export:** Excel ගොනුවක් මගින් භාණ්ඩ සිය ගණනක් එකවර පද්ධතියට ඇතුළත් කළ හැක.\n` +
      `• **Barcode Print & Scan:** භාණ්ඩ සඳහා Barcode ලේබල් මුද්‍රණය කිරීමට සහ USB Barcode Scanner හෝ ජංගම දුරකථන කැමරාවෙන් Scan කිරීමට පහසුකම් ඇත.\n\n` +
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
      `**How to Register Items, Branches, Field Teams, Suppliers, Clients & Users (Master Registrations):**\n\n` +
      `Open **Master Registrations** from the left sidebar and select the tab you need:\n` +
      `• **Items:** Register Materials or Machinery with Item Code, Unit, Unit Price, Low-Stock Threshold, and optional Project Reservation.\n` +
      `• **Sites / Branches:** Add Branch Yards, location/contact details, and link a designated Branch Supervisor.\n` +
      `• **Field Teams:** Register squads with Team Name, Team Leader Name & NIC, Assigned Site Base, and individual **Team Members** (Name, NIC/ID, Role, Phone).\n` +
      `• **Suppliers & Clients:** Maintain master directories for Procurement POs and Client FOC stock.\n` +
      `• **Users:** Create staff accounts, assign Roles, and link one or more Branches.\n\n` +
      `📌 *Workspace Summary:* **${ctx.activeItemsCount ?? 0}** Items · **${ctx.activeSitesCount ?? 0}** Branches · **${ctx.activeTeamsCount ?? 0}** Teams.`,
    answerSi: (ctx) =>
      `**Master Registrations හරහා Items, Branches, Field Teams සහ Users ලියාපදිංචි කරන ආකාරය:**\n\n` +
      `වම් පස මෙනුවෙන් **"Master Registrations"** වෙත ගොස් අදාළ ටැබ් එක තෝරන්න:\n` +
      `• **Items:** අලුත් Materials සහ Machinery ලියාපදිංචි කිරීමට.\n` +
      `• **Sites / Branches:** අලුත් Branch Yards සහ Branch Supervisors ඇතුළත් කිරීමට.\n` +
      `• **Teams:** Field Teams, Team Leader සහ **Team Members** (නම, NIC අංකය, Role, දුරකථන අංකය) ඇතුළත් කිරීමට.\n` +
      `• **Users:** සිස්ටම් එකට ලොග් වන Users, ඔවුන්ගේ Role එක සහ Branch එක ලබාදීමට.\n\n` +
      `📌 *දැනට පද්ධතියේ:* Items **${ctx.activeItemsCount ?? 0}**ක් · Branches **${ctx.activeSitesCount ?? 0}**ක් · Teams **${ctx.activeTeamsCount ?? 0}**ක් ඇත.`,
  },
  {
    id: 'users-roles-permissions',
    suggestedTab: 'manage-users',
    keywords: ['role', 'permission', 'access', 'user', 'password', 'login', 'supervisor', 'storekeeper', 'admin', 'view as'],
    phrases: [
      'what permissions',
      'my role',
      'create user',
      'user management',
      'cannot see',
      'user kenek',
      'mage role',
    ],
    answerEn: (ctx) =>
      `**User Roles, Multi-Site Access & Permissions Guide:**\n\n` +
      `You are logged in as **${ctx.userName || 'User'}** with role **${ctx.userRole || 'Staff'}** (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin Central:** Full access to all branches, Main Stock, Supplier POs, Master Registrations, User Management, Document Templates, Backups, Audit Trail, Recycle Bin, and **View-As User Preview Mode**.\n` +
      `• **All Site Branch Admin:** Cross-branch operational access to Main Stock, Supplier POs, Requisitions, and all Branch Yards.\n` +
      `• **Branch Admin:** Manages their assigned Branch Yard(s) — creates Stock Requisitions, confirms received transfers, issues stock to Field Teams, records Project Material Usage, and handles Team/Branch Returns.\n` +
      `• **Branch System User:** Standard operational access for their assigned Branch Yard(s).`,
    answerSi: (ctx) =>
      `**User Roles සහ බලතල (Permissions) පිළිබඳ විස්තරය:**\n\n` +
      `ඔබ දැනට ලොග් වී සිටින්නේ **${ctx.userName || 'User'}** ලෙස **${ctx.userRole || 'Staff'}** තනතුරෙන් (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin Central:** සියලුම Branches, Main Stock, Supplier PO, Master Registrations, User Management, Backups සහ Recycle Bin සඳහා සම්පූර්ණ බලතල ඇත.\n` +
      `• **All Site Branch Admin:** සියලුම Branches සහ ප්‍රධාන ගබඩාවේ මෙහෙයුම් කටයුතු පාලනය කළ හැක.\n` +
      `• **Branch Admin / Branch System User:** තමන්ට අදාළ Branch එකට බඩු ඉල්ලුම් කිරීම (Stock Requisitions), ලැබුණු බඩු භාරගැනීම, Teams වලට බඩු නිකුත් කිරීම සහ Project Usage සටහන් කිරීම සිදු කරයි.`,
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
      `**How to Restore or Permanently Delete Records (Recycle Bin):**\n\n` +
      `1. Open **Recycle Bin** from the left sidebar (or top header trash icon).\n` +
      `2. Filter or browse deleted **Items, Sites, Teams, Users, Projects, or Stock Transactions**.\n` +
      `3. Click **Restore** to bring the record back into active use immediately.\n` +
      `4. Click **Delete Permanently** (or **Empty Recycle Bin**) to erase the record forever so it never reappears on refresh.`,
    answerSi: () =>
      `**මැකුණු දත්ත නැවත ගැනීමට (Restore) හෝ ස්ථිරවම මකා දැමීමට (Recycle Bin):**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Recycle Bin"** වෙත යන්න.\n` +
      `2. එහි ඇති මැකුණු Items, Sites, Teams, Users, Projects හෝ ගනුදෙනු (Transactions) පරීක්ෂා කරන්න.\n` +
      `3. නැවත පද්ධතියට ගැනීමට **"Restore"** බටන් එකත්, නැවත කිසිවිටෙක නොඑන ලෙස ස්ථිරවම ඉවත් කිරීමට **"Delete Permanently"** බටන් එකත් භාවිතා කරන්න.`,
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
    id: 'directory-audit-letterhead-backup',
    suggestedTab: 'templates',
    keywords: ['directory', 'audit', 'report', 'print', 'letterhead', 'signature', 'backup', 'flush', 'theme', 'config'],
    phrases: [
      'branch staff & teams',
      'audit trail',
      'document templates',
      'letterhead template',
      'system backup',
      'system config',
    ],
    answerEn: () =>
      `**Directory, Document Templates (Letterhead), Audit Trail & System Backups:**\n\n` +
      `• **Branch Staff & Teams:** View, filter, export to Excel (**Export Members**), and print the complete hierarchy of branches, supervisors, field teams, and crew members.\n` +
      `• **Document Templates:** Customize your company letterhead, logo, digital signatures, and print layout for GRNs, POs, Debit Notes, Gate Passes, and Vouchers.\n` +
      `• **Audit Trail:** Inspect chronological logs of every transaction and user action with PDF/CSV export.\n` +
      `• **System Backups & Config (Top Header):** Create/restore versioned JSON backups, open the **Offline Backup Viewer**, customize system theme/company settings, or perform an **Admin System Flush**.`,
    answerSi: () =>
      `**Branch Directory, Document Templates (Letterhead), Audit Trail සහ System Backups:**\n\n` +
      `• **Branch Staff & Teams:** සියලුම Branches, Supervisors, Teams සහ සාමාජිකයින්ගේ විස්තර බලාගැනීමට සහ Print / Excel Export කිරීමට.\n` +
      `• **Document Templates:** Print කරන GRN, Gate Pass, PO සහ Vouchers සඳහා ආයතනයේ නම, ලාංඡනය (Logo), Digital Signatures සහ Letterhead සකස් කිරීමට.\n` +
      `• **Audit Trail:** පද්ධතියේ සිදු කළ සියලුම ගනුදෙනු පිළිබඳ වාර්තා ලබාගැනීමට.\n` +
      `• **System Backup & Config (ඉහළ Header තීරුව):** පද්ධතියේ සම්පූර්ණ Backup ලබාගැනීමට, Restore කිරීමට සහ ආයතනයේ Theme/Settings වෙනස් කිරීමට.`,
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
        `**Apex Stock & Site Management System — සම්පූර්ණ මගපෙන්වීම:**\n\n` +
        `ඔබ දැනට **${ctx.userRole || 'Staff'}** ලෙස **${ctx.branchName || 'All Branches'}** හි සිටී. පද්ධතියේ සියලුම කොටස්:\n` +
        `1. **Master Registrations:** Items, Branches (Sites), Field Teams (සහ Team Members), Suppliers, Clients සහ Users ලියාපදිංචි කිරීම.\n` +
        `2. **Main Central Stock & Supplier Orders (PO):** ප්‍රධාන ගබඩාවට GRN දැමීම, Purchase Orders, Supplier Returns (Debit Notes) සහ Damaged Stock කළමනාකරණය.\n` +
        `3. **Client Free Stock (FOC):** සේවාදායකයින් නොමිලේ ලබාදෙන බඩු ව්‍යාපෘති අනුව කළමනාකරණය.\n` +
        `4. **Stock Requisitions & Site Branch Stock:** ප්‍රධාන ගබඩාවෙන් Branch වලට බඩු ඉල්ලුම් කිරීම, Approve & Dispatch කිරීම සහ Branch තොග පාලනය.\n` +
        `5. **Issue to Teams & Team In-Hand Stock:** Branch එකෙන් Team වලට බඩු නිකුත් කිරීම (Gate Pass) සහ Team අතේ ඇති බඩු පරීක්ෂාව.\n` +
        `6. **Project & New Section Registry:** අලුත් Project Sections සෑදීම (**+ New Section Registry**), ඒවාට **Default Material Templates (BOM)** සකස් කිරීම සහ Projects ලියාපදිංචි කිරීම.\n` +
        `7. **Material Usage:** Project එකකට වැය වූ බඩු (Template BOM හරහා) සටහන් කිරීම.\n` +
        `8. **Team Returns & Branch Returns:** ඉතිරි හෝ හානි වූ බඩු නැවත ගබඩාවට භාරගැනීම.\n\n` +
        `ඉහත Quick Help බටන් එකක් තෝරන්න හෝ ඔබට දැනගැනීමට අවශ්‍ය ඕනෑම කොටසක් ගැන අහන්න!`,
    };
  }

  return {
    suggestedTab: ctx.currentTab || 'dashboard',
    reply:
      `**Apex Stock & Site Management System — Complete Feature Guide:**\n\n` +
      `You are logged in as **${ctx.userRole || 'Staff'}** (${ctx.branchName || 'All Branches'}). Here are all modules available in the system:\n` +
      `1. **Master Registrations:** Register Items (Materials & Machinery), Branches, Field Teams & Crew Members, Suppliers, Clients, and Users.\n` +
      `2. **Main Central Stock & Supplier Orders (PO):** Record GRNs, manage Purchase Orders, Supplier Returns (RTV), Debit Notes, and Damaged Stock restoration.\n` +
      `3. **Client Free Stock (FOC):** Track client-supplied free-of-charge materials per project.\n` +
      `4. **Stock Requisitions & Site Branch Stock:** Request stock from HQ, Approve & Dispatch, and Confirm Receipt at Branch Yards.\n` +
      `5. **Issue to Teams & Team In-Hand Stock:** Issue materials to Field Teams with printable Gate Passes and monitor live team custody.\n` +
      `6. **Project & New Section Registry:** Create custom Project Sections (**+ New Section Registry**), configure **Default Material Templates (BOM)**, and register/import projects.\n` +
      `7. **Material Usage:** Record project material consumption with auto-loaded section BOM templates.\n` +
      `8. **Team Returns, Branch Returns, Document Templates, Audit Trail & Recycle Bin.**\n\n` +
      `Click any **Quick Help** topic above or ask about any specific feature!`,
  };
}
