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

// Detect if the user typed in Sinhala script or Singlish even while on a given tab
export function detectSinhalaOrSinglishInput(text: string): boolean {
  // Check Sinhala unicode range
  if (/[\u0D80-\u0DFF]/.test(text)) return true;
  // Common Singlish words
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
  ];
  const lower = ` ${text.toLowerCase()} `;
  return singlishWords.some((w) => lower.includes(` ${w} `) || lower.includes(`${w}?`));
}

const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'site-transfer',
    suggestedTab: 'requests',
    keywords: ['transfer', 'request', 'requisition', 'dispatch', 'branch yard', 'site stock', 'send stock', 'yawanne', 'illanne'],
    phrases: [
      'request and transfer',
      'transfer stock',
      'main warehouse to a branch',
      'stock request',
      'new stock requirement',
      'site ekata badu',
      'branch ekata badu',
    ],
    answerEn: (ctx) =>
      `**How to Request & Transfer Stock from Main Warehouse to a Branch Yard:**\n\n` +
      `1. **Create a Stock Request:** Go to **2. Site Requests** from the left sidebar and click **+ New Stock Requirement Form**.\n` +
      `2. **Select Branch & Items:** Choose the destination **Branch / Site Yard**, select the required items and quantities, and submit the request.\n` +
      `3. **Approve & Dispatch (HQ):** The **Super Admin** or **Main Storekeeper** reviews the request under **2. Site Requests** and clicks **Approve & Dispatch** (this deducts the quantity from Central Main Stock).\n` +
      `4. **Confirm Receipt at Branch (GRN):** The **Branch Supervisor** opens **2. Site Requests** (or **Branch Stock**) and clicks **Confirm Receipt (GRN)** to add the dispatched items into their Branch Yard inventory.\n\n` +
      `*Tip:* Super Admins and Main Storekeepers can also perform an instant **Direct Stock Transfer** from **1. Main Stock** without waiting for a request.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *Live Status:* There are currently **${ctx.pendingRequestsCount} pending stock request(s)** waiting for action.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**Main Warehouse (ප්‍රධාන ගබඩාවේ) සිට Branch / Site එකකට බඩු Request කර Transfer කරගන්නා ආකාරය:**\n\n` +
      `1. **Request එකක් දැමීම:** වම් පස මෙනුවෙන් **"2. Site Requests"** වෙත ගොස් **"+ New Stock Requirement Form"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. **Branch එක සහ බඩු තේරීම:** බඩු අවශ්‍ය **Branch / Site එක** තෝරා, අවශ්‍ය Items සහ ප්‍රමාණයන් (Quantities) ඇතුළත් කර Submit කරන්න.\n` +
      `3. **Approve & Dispatch කිරීම:** ප්‍රධාන ගබඩාවේ **Super Admin** හෝ **Main Storekeeper** විසින් එම ඉල්ලීම පරීක්ෂා කර **"Approve & Dispatch"** ක්ලික් කළ විට Main Stock එකෙන් බඩු නිකුත් වේ.\n` +
      `4. **Branch එකට භාරගැනීම (Confirm Receipt):** අදාළ Branch Supervisor විසින් **"Confirm Receipt (GRN)"** ක්ලික් කළ පසු එම බඩු **"Branch Stock"** එකට එකතු වේ.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *දැනට පද්ධතියේ අනුමැතිය බලාපොරොත්තුවෙන් Pending Requests **${ctx.pendingRequestsCount}ක්** ඇත.*`
          : ''
      }`,
  },
  {
    id: 'main-stock-grn',
    suggestedTab: 'main-stock',
    keywords: ['grn', 'main stock', 'central warehouse', 'receive stock', 'add stock', 'opening stock', 'new stock'],
    phrases: [
      'add main stock',
      'add new stock',
      'create grn',
      'enter stock',
      'main stock ekata',
      'badu danne kohomada',
    ],
    answerEn: () =>
      `**How to Add New Stock (GRN) to the Central Main Warehouse:**\n\n` +
      `1. **Open Main Stock:** Click **1. Main Stock** in the left navigation sidebar.\n` +
      `2. **Start GRN Entry:** Click the **+ Add Stock (GRN)** button at the top right.\n` +
      `3. **Fill Supplier & Reference Details:** Enter the Supplier Name, Invoice / Delivery Note Number, and GRN Date.\n` +
      `4. **Add Items & Quantities:** Select each registered item from the dropdown (or scan its barcode), enter the received quantity, and click **Save GRN**.\n` +
      `5. **PO-Based Receiving:** If you created a Purchase Order first, go to **Supplier PO** and click **Receive GRN** directly against that PO.`,
    answerSi: () =>
      `**ප්‍රධාන ගබඩාවට (Central Main Stock) අලුතින් බඩු (GRN) ඇතුළත් කරන ආකාරය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"1. Main Stock"** පිටුවට යන්න.\n` +
      `2. ඉහළින් ඇති **"+ Add Stock (GRN)"** බටන් එක ක්ලික් කරන්න.\n` +
      `3. Supplier ගේ නම, Invoice / බිල්පත් අංකය සහ දිනය ඇතුළත් කරන්න.\n` +
      `4. ලැබුණු Items තෝරා අදාළ ප්‍රමාණයන් (Quantities) ඇතුළත් කර **"Save GRN"** ක්ලික් කරන්න.\n` +
      `5. Purchase Order (PO) එකක් හරහා බඩු ගන්නවා නම් **"Supplier PO"** වෙත ගොස් අදාළ PO එකට GRN එක දැමිය හැක.`,
  },
  {
    id: 'issue-to-teams',
    suggestedTab: 'dispatch',
    keywords: ['issue', 'dispatch', 'field team', 'squad', 'gate pass', 'team in-hand', 'hand over'],
    phrases: [
      'issue items to a team',
      'issue materials',
      'issue to teams',
      'dispatch to team',
      'team ekakata badu',
      'team ekata issue',
    ],
    answerEn: (ctx) =>
      `**How to Issue Materials from a Branch Yard to a Field Team:**\n\n` +
      `1. **Check Branch Inventory:** Make sure the required items have available stock (` +
      `> 0) in your **Branch Stock**.\n` +
      `2. **Open Issue to Teams:** Click **3. Issue to Teams** in the left sidebar.\n` +
      `3. **Select Branch & Team:** Choose the **Branch Yard** and the **Field Team** receiving the materials.\n` +
      `4. **Select Materials & Quantities:** Pick the items from the available branch stock list, enter the quantities to issue, and click **Issue Material to Team**.\n` +
      `5. **Track Team Custody:** All issued items are tracked live under **Team In-Hand** until they are consumed on a project (**5. Material Usage**) or returned (**6. Team Returns**).${
        ctx.activeTeamsCount ? `\n\n📌 *Your workspace currently has **${ctx.activeTeamsCount} active field team(s)** registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**Branch එකේ සිට වැඩ කරන Field Team එකකට බඩු නිකුත් කරන (Issue to Teams) ආකාරය:**\n\n` +
      `1. **Branch Stock පරීක්ෂාව:** පළමුව අදාළ Branch එකේ ("Branch Stock") නිකුත් කිරීමට අවශ්‍ය බඩු තොගය තිබිය යුතුය.\n` +
      `2. **Issue to Teams වෙත යන්න:** වම් පස මෙනුවෙන් **"3. Issue to Teams"** තෝරන්න.\n` +
      `3. **Branch සහ Team තෝරන්න:** බඩු නිකුත් කරන **Branch Yard එක** සහ බඩු ලබාගන්නා **Field Team එක** තෝරන්න.\n` +
      `4. **බඩු සහ ප්‍රමාණයන් ඇතුළත් කරන්න:** ලැයිස්තුවෙන් අදාළ Items සහ ප්‍රමාණයන් තෝරා **"Issue Material to Team"** ක්ලික් කරන්න.\n` +
      `5. **Team In-Hand:** Team එක අතේ දැනට ඉතිරිව ඇති සියලුම බඩු **"Team In-Hand"** පිටුවෙන් බලාගත හැක.${
        ctx.activeTeamsCount ? `\n\n📌 *දැනට පද්ධතියේ සක්‍රීය Teams **${ctx.activeTeamsCount}ක්** ලියාපදිංචි කර ඇත.*` : ''
      }`,
  },
  {
    id: 'project-usage',
    suggestedTab: 'project-usage',
    keywords: ['usage', 'consume', 'consumption', 'boq', 'bill of quantities', 'project material', 'waya'],
    phrases: [
      'record project usage',
      'project material usage',
      'log material usage',
      'project ekata',
      'material usage danne',
    ],
    answerEn: () =>
      `**How to Record Project Material Usage & Track BOQ Progress:**\n\n` +
      `1. **Register the Project First:** Go to **4. Project Registry** and create the project (assigning its Branch Yard and optional BOQ item limits).\n` +
      `2. **Open Material Usage:** Go to **5. Material Usage** from the sidebar.\n` +
      `3. **Choose Deduction Source:** Select whether the materials were used from **Team In-Hand Stock** (items already issued to a field team) or directly from **Branch Yard Stock**.\n` +
      `4. **Select Project & Team:** Pick the **Project**, the **Field Team**, and enter the exact quantities consumed on site.\n` +
      `5. **Submit Usage:** Click **Record Usage**. The system automatically deducts the stock and updates the project's BOQ utilization & cost reports.`,
    answerSi: () =>
      `**Project එකකට වැය වූ බඩු (Project Material Usage / BOQ) සටහන් කරන ආකාරය:**\n\n` +
      `1. **Project එක ලියාපදිංචි කිරීම:** පළමුව **"4. Project Registry"** වෙත ගොස් අදාළ Project එක සහ එහි BOQ බඩු ප්‍රමාණයන් ඇතුළත් කර තිබිය යුතුය.\n` +
      `2. **Material Usage වෙත යන්න:** වම් පස මෙනුවෙන් **"5. Material Usage"** ක්ලික් කරන්න.\n` +
      `3. **බඩු වැය වූ මූලාශ්‍රය තෝරන්න:** බඩු වැය කළේ Team එක අතේ තිබූ තොගයෙන්ද (**Team In-Hand**) නැතිනම් කෙලින්ම **Branch Stock** එකෙන්ද යන්න තෝරන්න.\n` +
      `4. **Project සහ Team තෝරන්න:** අදාළ Project එක, Team එක සහ වැය වූ Items ප්‍රමාණයන් ඇතුළත් කර Save කරන්න.`,
  },
  {
    id: 'returns',
    suggestedTab: 'returns',
    keywords: ['return', 'unused', 'damaged', 'surplus', 'hand back', 'branch return', 'team return', 'ithiri'],
    phrases: [
      'return unused stock',
      'team returns',
      'branch return',
      'return materials',
      'badu return karanne',
    ],
    answerEn: () =>
      `**How to Return Unused or Damaged Stock:**\n\n` +
      `• **Option A — Team Return to Branch Yard (6. Team Returns):**\n` +
      `  1. Open **6. Team Returns** from the sidebar.\n` +
      `  2. Select the **Field Team** returning items and the receiving **Branch Yard**.\n` +
      `  3. Enter the returned quantity and condition (**Good** restores usable Branch Stock; **Damaged** logs into the damaged stock ledger).\n\n` +
      `• **Option B — Branch Return to Central Main Warehouse (7. Branch Return):**\n` +
      `  1. Open **7. Branch Return** from the sidebar.\n` +
      `  2. Select your **Branch Yard**, pick the surplus items and quantities to send back to HQ, and submit.`,
    answerSi: () =>
      `**ඉතිරි වූ හෝ හානි වූ බඩු නැවත ගබඩාවට Return කරන ආකාරය:**\n\n` +
      `• **1. Team එකක සිට Branch එකට Return කිරීම ("6. Team Returns"):**\n` +
      `  - වම් පස මෙනුවෙන් **"6. Team Returns"** වෙත යන්න.\n` +
      `  - අදාළ Team එක තෝරා, ඉතිරි වූ බඩු ප්‍රමාණය සහ තත්ත්වය (**Good** හෝ **Damaged**) තෝරා Save කරන්න. (Good ලෙස දැමූ බඩු නැවත Branch Stock එකට එකතු වේ).\n\n` +
      `• **2. Branch එකක සිට ප්‍රධාන ගබඩාවට (Main Stock) Return කිරීම ("7. Branch Return"):**\n` +
      `  - වම් පස මෙනුවෙන් **"7. Branch Return"** වෙත ගොස් Branch එකේ ඉතිරි බඩු නැවත Central Main Warehouse වෙත යැවිය හැක.`,
  },
  {
    id: 'procurement-po',
    suggestedTab: 'procurement',
    keywords: ['procurement', 'supplier', 'purchase order', 'po', 'debit note', 'vendor', 'damaged supplier'],
    phrases: [
      'create purchase order',
      'supplier return',
      'debit note',
      'supplier po',
    ],
    answerEn: () =>
      `**How to Manage Supplier Purchase Orders (PO), Returns & Debit Notes:**\n\n` +
      `1. **Create a Purchase Order:** Go to **Supplier PO** in the sidebar and click **+ New Purchase Order**. Enter supplier details, items, and unit prices.\n` +
      `2. **Receive GRN Against PO:** When the supplier delivers the goods, click **Receive GRN** on the PO card to add the items directly into **1. Main Stock**.\n` +
      `3. **Supplier Returns & Debit Notes:** If delivered items are defective or damaged, use the **Supplier Return / Debit Note** option in **Supplier PO** to deduct defective stock and print an official Debit Note or record a replacement settlement.`,
    answerSi: () =>
      `**Supplier Purchase Orders (PO), Supplier Returns සහ Debit Notes කළමනාකරණය:**\n\n` +
      `1. **Purchase Order සෑදීම:** වම් පස මෙනුවෙන් **"Supplier PO"** වෙත ගොස් අලුත් PO එකක් සාදන්න.\n` +
      `2. **PO එකට බඩු භාරගැනීම (GRN):** Supplier බඩු එවූ පසු එම PO එකේ **"Receive GRN"** ක්ලික් කිරීමෙන් කෙලින්ම Main Stock එකට බඩු එකතු වේ.\n` +
      `3. **Supplier Return & Debit Note:** ප්‍රමිතියෙන් තොර හෝ හානි වූ බඩු නැවත Supplier වෙත යැවීමට සහ Debit Note එකක් ලබාගැනීමට එහි ඇති Supplier Return පහසුකම භාවිතා කරන්න.`,
  },
  {
    id: 'client-foc',
    suggestedTab: 'client-free-stock',
    keywords: ['client free', 'foc', 'free issue', 'customer supplied', 'client stock'],
    phrases: ['client free stock', 'free of charge', 'client material'],
    answerEn: () =>
      `**How to Manage Client Free Issue (FOC) Stock:**\n\n` +
      `1. Open **Client Free Stock** from the sidebar.\n` +
      `2. Record materials provided free-of-charge by clients separately from company-purchased stock.\n` +
      `3. You can track received FOC quantities, allocate them to specific client projects, and print FOC receiving notes.`,
    answerSi: () =>
      `**Client Free Stock (FOC - සේවාදායකයින් නොමිලේ ලබාදෙන බඩු) කළමනාකරණය:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Client Free Stock"** වෙත යන්න.\n` +
      `2. ආයතනයෙන් මිලදී ගත් බඩු වලට පරිබාහිරව, Client විසින් ව්‍යාපෘති සඳහා ලබාදෙන බඩු මෙහි වෙනමම සටහන් කර ගබඩා කළ හැක.`,
  },
  {
    id: 'registrations-setup',
    suggestedTab: 'registrations',
    keywords: ['register', 'master setup', 'create item', 'add item', 'new branch', 'new site', 'new team', 'crew member', 'excel import', 'barcode'],
    phrases: [
      'how to register',
      'create a new item',
      'register a branch',
      'register a team',
      'add crew members',
      'aluth item',
      'site ekak hadanne',
      'team ekak hadanne',
    ],
    answerEn: (ctx) =>
      `**How to Register Items, Branches, Field Teams & Users (Master Setup):**\n\n` +
      `Open **Master Setup** from the left sidebar and select the relevant tab:\n` +
      `• **Items Catalog:** Register materials, tools, or machinery with Item Code, Unit, Unit Price, and Low-Stock Alert threshold. You can also **Import/Export via Excel** or print **Barcode Labels**.\n` +
      `• **Sites / Branches:** Add operational branch yards, location details, and assign a Branch Supervisor.\n` +
      `• **Field Teams:** Register work squads with Team Name, Team Leader Name & NIC, Assigned Site Base, and individual **Team Members** (Name, NIC/ID, Role, Phone).\n` +
      `• **Manage Users:** Create staff login accounts, set passwords, and assign each user's Role and Branch.\n\n` +
      `📌 *Current Workspace Summary:* **${ctx.activeItemsCount ?? 0}** Items · **${ctx.activeSitesCount ?? 0}** Branches · **${ctx.activeTeamsCount ?? 0}** Teams.`,
    answerSi: (ctx) =>
      `**අලුත් Items, Branches (Sites), Field Teams සහ Users ලියාපදිංචි කරන ආකාරය:**\n\n` +
      `වම් පස මෙනුවෙන් **"Master Setup"** වෙත ගොස් අදාළ කොටස තෝරන්න:\n` +
      `• **Items:** අලුත් භාණ්ඩ (Materials, Tools, Machinery) ඇතුළත් කිරීමට, Excel මගින් Import කිරීමට සහ Barcode ලේබල් මුද්‍රණය කිරීමට.\n` +
      `• **Sites / Branches:** අලුත් Branch Yards සහ ඒවායේ Supervisors ලියාපදිංචි කිරීමට.\n` +
      `• **Teams:** වැඩ කරන කණ්ඩායම් (Field Teams), Team Leader සහ Team Members (නම සහ NIC අංක) ඇතුළත් කිරීමට.\n` +
      `• **Users:** සිස්ටම් එකට ලොග් වන Users, ඔවුන්ගේ Role එක සහ Branch එක ලබාදීමට.\n\n` +
      `📌 *දැනට පද්ධතියේ:* Items **${ctx.activeItemsCount ?? 0}**ක් · Branches **${ctx.activeSitesCount ?? 0}**ක් · Teams **${ctx.activeTeamsCount ?? 0}**ක් ඇත.`,
  },
  {
    id: 'users-roles-permissions',
    suggestedTab: 'manage-users',
    keywords: ['role', 'permission', 'access', 'user', 'password', 'login', 'supervisor', 'storekeeper', 'admin'],
    phrases: [
      'what permissions',
      'my role',
      'create user',
      'manage users',
      'cannot see',
      'user kenek',
      'mage role',
    ],
    answerEn: (ctx) =>
      `**User Roles & System Permissions Guide:**\n\n` +
      `You are currently logged in as **${ctx.userName || 'User'}** with role **${ctx.userRole || 'Staff'}** (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin / All-Site Admin:** Full control across all branches, Main Stock, Supplier POs, Master Setup, User Management, Audit Trail, and Recycle Bin.\n` +
      `• **Main Storekeeper:** Manages Central Main Warehouse GRNs, approves/dispatches Site Stock Requests, and receives Branch Returns.\n` +
      `• **Site Manager / Site Supervisor / Sub-Storekeeper:** Manages their assigned Branch Yard — creates Stock Requests, confirms received transfers, issues stock to Field Teams, records Project Material Usage, and handles Team Returns.\n` +
      `• **Project Manager / Auditor:** Views project BOQ usage, stock balances, and audit reports.`,
    answerSi: (ctx) =>
      `**User Roles සහ බලතල (Permissions) පිළිබඳ විස්තරය:**\n\n` +
      `ඔබ දැනට ලොග් වී සිටින්නේ **${ctx.userName || 'User'}** ලෙස **${ctx.userRole || 'Staff'}** තනතුරෙන් (Branch: **${ctx.branchName || 'All Branches'}**).\n\n` +
      `• **Super Admin / All-Site Admin:** සියලුම Branches, Main Stock, Supplier PO, Master Setup, Users සහ Recycle Bin සඳහා සම්පූර්ණ බලතල ඇත.\n` +
      `• **Main Storekeeper:** ප්‍රධාන ගබඩාවට GRN දැමීම, Site Requests අනුමත කර බඩු යැවීම (Dispatch) සහ Branch Returns භාරගැනීම සිදු කරයි.\n` +
      `• **Site Manager / Site Supervisor / Sub-Storekeeper:** තමන්ට අදාළ Branch එකට බඩු ඉල්ලුම් කිරීම, ලැබුණු බඩු භාරගැනීම, Teams වලට බඩු නිකුත් කිරීම සහ Project Usage සටහන් කිරීම සිදු කරයි.`,
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
      `**How to Restore or Permanently Delete Items, Users, Teams & Records:**\n\n` +
      `1. Click **Recycle Bin** in the left sidebar (or the trash icon in the top header).\n` +
      `2. Switch between tabs for deleted **Items, Sites, Teams, Users, or Stock Transactions**.\n` +
      `3. Click **Restore** to bring the record back into active use immediately.\n` +
      `4. Click **Delete Permanently** if you want to erase the record forever so it never reappears.`,
    answerSi: () =>
      `**මැකුණු දත්ත නැවත ගැනීමට (Restore) හෝ ස්ථිරවම මකා දැමීමට (Recycle Bin):**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Recycle Bin"** වෙත යන්න.\n` +
      `2. එහි ඇති මැකුණු Items, Sites, Teams, Users හෝ ගනුදෙනු (Transactions) පරීක්ෂා කරන්න.\n` +
      `3. නැවත පද්ධතියට ගැනීමට **"Restore"** බටන් එකත්, නැවත කිසිවිටෙක නොඑන ලෙස ස්ථිරවම ඉවත් කිරීමට **"Delete Permanently"** බටන් එකත් භාවිතා කරන්න.`,
  },
  {
    id: 'low-stock-inventory',
    suggestedTab: 'items',
    keywords: ['low stock', 'out of stock', 'reorder', 'shortage', 'balance', 'inventory status', 'adu'],
    phrases: ['low stock items', 'check stock balance', 'stock level'],
    answerEn: (ctx) =>
      `**How to Check Stock Balances & Low-Stock Alerts:**\n\n` +
      `• **Central Warehouse Stock:** Open **1. Main Stock** to view central warehouse quantities and low-stock indicators.\n` +
      `• **Branch Yard Stock:** Open **Branch Stock** to inspect stock held at each individual site/branch.\n` +
      `• **Reorder Thresholds:** In **Items & Catalog**, each item has a minimum reorder level; when stock drops at or below that level, a red/amber Low Stock alert badge appears.\n\n` +
      `📌 *Live Workspace Status:* Out of **${ctx.activeItemsCount ?? 0}** active items, **${ctx.lowStockItemsCount ?? 0}** item(s) are currently at or below their low-stock threshold${
        ctx.lowStockItemNames && ctx.lowStockItemNames.length > 0
          ? ` (${ctx.lowStockItemNames.slice(0, 4).join(', ')})`
          : ''
      }.`,
    answerSi: (ctx) =>
      `**බඩු තොග (Stock Balances) සහ අඩු වී ඇති බඩු (Low Stock) පරීක්ෂා කරන ආකාරය:**\n\n` +
      `• **1. Main Stock:** ප්‍රධාන ගබඩාවේ දැනට පවතින තොග ප්‍රමාණයන් බලාගැනීමට.\n` +
      `• **Branch Stock:** එක් එක් Branch / Site එකෙහි පවතින බඩු තොග වෙන වෙනම බලාගැනීමට.\n` +
      `• **Low Stock Alerts:** යම් භාණ්ඩයක තොගය අවම සීමාවට (Reorder Level) වඩා අඩු වූ විට Dashboard එකේ සහ Main Stock හි රතු/කහ පැහැයෙන් පෙන්වයි.\n\n` +
      `📌 *දැනට පද්ධතියේ:* සක්‍රීය Items **${ctx.activeItemsCount ?? 0}** අතරින් Items **${ctx.lowStockItemsCount ?? 0}**ක් Low Stock සීමාවේ පවතී.`,
  },
  {
    id: 'directory-audit-templates',
    suggestedTab: 'branch-directory',
    keywords: ['directory', 'audit', 'report', 'print', 'letterhead', 'template', 'backup', 'export excel'],
    phrases: ['branch directory', 'audit trail', 'letterhead template', 'print report'],
    answerEn: () =>
      `**Reports, Directory, Letterhead Templates & Backups:**\n\n` +
      `• **Branch Staff & Teams Directory:** View and print the complete hierarchy of branches, supervisors, field teams, and crew members (or export to Excel).\n` +
      `• **Audit Trail:** Inspect chronological logs of every stock addition, transfer, team issue, return, and deletion with filters and PDF/Excel export.\n` +
      `• **Templates:** Customize your company logo, letterhead header, footer, and signature blocks for official printed GRNs, Gate Passes, and POs.\n` +
      `• **System Backup:** Use the Backup icon in the top header to export a full JSON/Excel snapshot of your workspace at any time.`,
    answerSi: () =>
      `**වාර්තා (Reports), Branch Directory, Letterhead සහ Backup පහසුකම්:**\n\n` +
      `• **Branch Staff & Teams:** සියලුම Branches, Supervisors, Teams සහ සාමාජිකයින්ගේ විස්තර බලාගැනීමට සහ Print / Excel Export කිරීමට.\n` +
      `• **Audit Trail:** පද්ධතියේ සිදු කළ සියලුම ගනුදෙනු සහ වෙනස්කම් පිළිබඳ සම්පූර්ණ වාර්තා ලබාගැනීමට.\n` +
      `• **Templates:** Print කරන GRN, Gate Pass සහ PO සඳහා ආයතනයේ නම, ලාංඡනය (Logo) සහ Letterhead සකස් කිරීමට.`,
  },
];

export function resolveSmartSystemSupportAnswer(
  userQuestion: string,
  ctx: SupportWorkspaceContext
): SupportAnswerResult {
  const q = userQuestion.trim().toLowerCase();
  // Determine response language:
  // If the user is in the Sinhala tab ('si'), OR typed in Sinhala/Singlish, respond in Sinhala.
  // If the user is in the English tab ('en') and typed in English, respond strictly in English.
  const useSinhala = ctx.language === 'si' || detectSinhalaOrSinglishInput(userQuestion);

  // Score each topic based on phrase and keyword matches
  let bestTopic: KnowledgeTopic | null = null;
  let bestScore = 0;

  for (const topic of KNOWLEDGE_TOPICS) {
    let score = 0;
    for (const phrase of topic.phrases) {
      if (q.includes(phrase)) {
        score += 5;
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

  // Context-aware general overview when the user asks a general question like "help", "hi", "how does this system work?"
  if (useSinhala) {
    return {
      suggestedTab: ctx.currentTab || 'dashboard',
      reply:
        `**Apex Stock & Site Management System — උපදෙස් මාලාව:**\n\n` +
        `ඔබ දැනට **${ctx.userRole || 'Staff'}** ලෙස **${ctx.branchName || 'All Branches'}** හි සිටී. ප්‍රධාන ක්‍රියාවලි පහත පරිදි වේ:\n` +
        `1. **Master Setup:** අලුත් Items, Branches (Sites), Field Teams සහ Users ලියාපදිංචි කිරීම.\n` +
        `2. **1. Main Stock:** ප්‍රධාන ගබඩාවට බඩු ඇතුළත් කිරීම (**+ Add Stock / GRN**).\n` +
        `3. **2. Site Requests:** ප්‍රධාන ගබඩාවෙන් Branch වලට බඩු ඉල්ලුම් කිරීම සහ **Approve & Dispatch** මගින් යැවීම.\n` +
        `4. **3. Issue to Teams:** Branch එකේ සිට වැඩ කරන Field Team එකකට බඩු නිකුත් කිරීම.\n` +
        `5. **5. Material Usage:** Project එකකට වැය වූ බඩු සටහන් කිරීම.\n` +
        `6. **6. Team Returns / 7. Branch Return:** ඉතිරි බඩු නැවත ගබඩාවට භාරගැනීම.\n\n` +
        `ඉහත ඇති Quick Help බටන් එකක් ක්ලික් කරන්න හෝ ඔබට දැනගැනීමට අවශ්‍ය දේ ටයිප් කරන්න!`,
    };
  }

  return {
    suggestedTab: ctx.currentTab || 'dashboard',
    reply:
      `**Apex Stock & Site Management System — Step-by-Step Workflow Guide:**\n\n` +
      `You are logged in as **${ctx.userRole || 'Staff'}** (${ctx.branchName || 'All Branches'}). Here is how the complete workflow operates:\n` +
      `1. **Master Setup:** Register your Items, Branch Yards (Sites), Field Work Teams, and System Users.\n` +
      `2. **1. Main Stock:** Receive new inventory into the Central Main Warehouse using **+ Add Stock (GRN)** or **Supplier PO**.\n` +
      `3. **2. Site Requests:** Create a Stock Request for a Branch Yard -> Admin clicks **Approve & Dispatch** -> Branch clicks **Confirm Receipt**.\n` +
      `4. **3. Issue to Teams:** Issue materials from available **Branch Stock** to a registered **Field Team**.\n` +
      `5. **5. Material Usage:** Record materials consumed on a project against Team In-Hand or Branch Stock.\n` +
      `6. **6. Team Returns & 7. Branch Return:** Return unused or damaged stock back to the Branch or Main Warehouse.\n\n` +
      `Click any **Quick Help** topic above or type your specific question below!`,
  };
}
