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
    id: 'telecom-new-connection-nc-workflow',
    suggestedTab: 'project-usage',
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
    ],
    phrases: [
      'telecom new connection',
      'new connection',
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
      `**How the "Telecom New Connection (NC)" Section Works (Registration, 3-Step Daily Progress & Section Restore):**\n\n` +
      `**1. Registering a New Connection (6 Ordered Subscriber Fields):**\n` +
      `When you select **Telecom New Connection** in **Project & New Section Registry -> Register Project** (or inside Daily Progress), the standard Main/Sub project fields are replaced by **6 Subscriber Fields in order at the top**:\n` +
      `   1. **Customer FTTH / NC Number**\n` +
      `   2. **ONT Serial No**\n` +
      `   3. **Customer Name**\n` +
      `   4. **Customer Address**\n` +
      `   5. **Customer Mobile No**\n` +
      `   6. **Exchange Area**\n\n` +
      `**2. Daily Progress Entry ("Material Usage / Daily Progress Entry") — Simple 1, 2, 3 Steps:**\n` +
      `When you pick **Telecom New Connection** as the Section, complex Main/Sub-Project steps are hidden and replaced by **Steps 1, 2, 3**:\n` +
      `• **Step 1 — Team & Area Selection (Top-Most & Locked Until Refresh):** Select the **Site Branch**, **Field Team**, and **Exchange / Working Area** at the very top and click **Confirm & Lock Team / Area** (or submit the first line). Step 1 **locks until you refresh the page**, so you can enter all NC lines completed by that team during the day without re-selecting the team every time.\n` +
      `• **Step 2 — Select NC Line or "+ Register New Connection":** Search registered NC lines by **Customer Name** or **NC Number**, OR click the **+ Register New Connection** tab right inside Step 2 to enter the 6 Subscriber Fields and register/select a new line on the spot.\n` +
      `• **Step 3 — Enter Material Usage:** Enter consumed materials (**Qty Used** + **Wastage Qty**) and submit. After submission, **Step 1 remains locked** so you can immediately pick the next NC line in Step 2.\n\n` +
      `**3. How to Create or Restore a New Connection Section:**\n` +
      `In **Project & New Section Registry -> New Section Registry & Material Templates**, click **+ Create New Section** and select **Telecom New Connection (NC)** as the format (or click **+ Restore Telecom New Connection (NC)** if it was deleted) to include all NC options automatically.`,
    answerSi: () =>
      `**"Telecom New Connection (NC)" Section එක ක්‍රියාත්මක වන ආකාරය (ලියාපදිංචිය, පියවර 1-2-3 Daily Progress සහ නැවත සකස් කිරීම):**\n\n` +
      `**1. අලුත් New Connection එකක් Register කරන තැන (කරුණු 6 පිළිවෙළට):**\n` +
      `**Telecom New Connection** යටතේ අලුත් connection එකක් register කරද්දී සාමාන්‍ය project fields වෙනුවට පහත **කරුණු 6 පිළිවෙළට උඩින්ම** පෙන්වයි:\n` +
      `   1. **Customer FTTH / NC Number**\n` +
      `   2. **ONT Serial No**\n` +
      `   3. **Customer Name**\n` +
      `   4. **Customer Address**\n` +
      `   5. **Customer Mobile No**\n` +
      `   6. **Exchange Area**\n\n` +
      `**2. Daily Progress Enter කරන පිටුව (Telecom New Connection තේරූ විට — පියවර 1, 2, 3):**\n` +
      `Daily Progress පිටුවේ Section එක ලෙස **"Telecom New Connection"** තෝරාගත් විට සංකීර්ණ Main/Sub Project කොටස් වෙනුවට ඉතා සරලව **1, 2, 3** පිළිවෙළට පෙන්වයි:\n` +
      `• **පියවර 1 — Team & Area Selection (උඩින්ම සහ Refresh කරනකම් Lock වේ):** උඩින්ම Field Team විස්තර සහ Exchange/Working Area එක තෝරා **"Confirm & Lock Team / Area"** ඔබන්න (හෝ පළමු line එක submit කරන්න). එවිට **Page එක Refresh කරනකම් ඒ විස්තර Lock වී පවතී**. එම නිසා ඒ Team එක දවස ඇතුළත කරපු NC lines ඔක්කොම එක දිගට add කරලා usage දාද්දී ආයේ ආයේ Team තෝරන්න ඕනේ වෙන්නේ නැහැ.\n` +
      `• **පියවර 2 — Select NC Line හෝ "+ Register New Connection":** දැනට register කර ඇති lines **Customer Name** එකෙන් හෝ **NC Number** එකෙන් Search කර තෝරාගන්න. නැතිනම් එතනම ඇති **"+ Register New Connection"** Tab එක ක්ලික් කර ඉහත Customer විස්තර 6 එතනම ඇතුළත් කර එවෙලේම register කරගන්න.\n` +
      `• **පියවර 3 — Material Usage Enter කිරීම:** තෝරාගත් NC line එකට වැය වුණු Materials ටික enter කර Submit කරන්න. Submit කළාට පස්සෙත් **පියවර 1 (Team & Area) වෙනස් නොවී එහෙමම තියෙනවා**, කෙලින්ම ඊළඟ NC line එක තෝරලා (පියවර 2) usage දාන්න පුළුවන්.\n\n` +
      `**3. New Connection Section එක මැකුණොත් නැවත ගන්නා ආකාරය:**\n` +
      `**Project & New Section Registry -> New Section Registry** වෙත ගොස් **"+ Create New Section"** ක්ලික් කර Format එක ලෙස **"Telecom New Connection (NC)"** තෝරන්න (නැතිනම් උඩින්ම මතු වන **"+ Restore Telecom New Connection (NC)"** බටන් එක ඔබන්න).`,
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
      `**How to Create New Project Sections (Standard or Telecom NC Format) & Configure Default Material Templates (BOM):**\n\n` +
      `**Part 1 — Create or Restore a Project Section:**\n` +
      `1. Open **Project & New Section Registry** from the left sidebar.\n` +
      `2. Click **+ New Section Registry** at the top right (or open the **New Section Registry & Material Templates** tab and click **+ Create New Section**).\n` +
      `3. Under **1. Select Section Data Entry & Daily Progress Format**, choose either:\n` +
      `   • **Standard Project Format:** For Main Project, Sub-Project & Individual Project hierarchy (e.g., Cable Development, Maintenance).\n` +
      `   • **Telecom New Connection (NC):** Activates the **6 Customer FTTH/NC Registration Fields** and the **3-Step Daily Progress workflow (with Team & Area Lock until page refresh)**.\n` +
      `   *(Note: If the Telecom New Connection section was deleted, you can also click **+ Restore Telecom New Connection (NC)** at the top of the tab to recreate it in 1 click.)*\n` +
      `4. Enter the **Section Name**, **Short Code**, **Badge Theme Color**, and **Description**, then click **Create Section**.\n\n` +
      `**Part 2 — Configure a Default Material Template (BOM) for that Section:**\n` +
      `1. Inside **New Section Registry & Material Templates**, click **Configure Material Template** (or **Edit Material Template (BOM)**) on your section card.\n` +
      `2. Select the standard items routinely used in this section, enter optional **Suggested Qty**, and click **Save Material Template**.\n` +
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
      `**අලුත් Project Section එකක් (Standard හෝ Telecom NC Format සහිතව) සාදා එයට Material Template (BOM) එකක් සකස් කරන ආකාරය:**\n\n` +
      `**1 වන පියවර — අලුත් Project Section එකක් සෑදීම හෝ New Connection Section එක නැවත ගැනීම:**\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත ගොස් **"New Section Registry & Material Templates"** ටැබ් එකෙහි **"+ Create New Section"** ක්ලික් කරන්න.\n` +
      `2. එහි උඩින්ම ඇති **"1. Select Section Data Entry & Daily Progress Format"** යටතේ අවශ්‍ය ආකෘතිය තෝරන්න:\n` +
      `   • **Standard Project Format:** සාමාන්‍ය Main / Sub / Individual Projects සඳහා.\n` +
      `   • **Telecom New Connection (NC):** Customer FTTH/NC කරුණු 6ක Register ආකෘතිය සහ Daily Progress හි 1-2-3 පියවර (Team & Area Lock සමඟ) ලබාගැනීමට.\n` +
      `   *(New Connection section එක මැකී ඇත්නම් උඩින්ම ඇති **"+ Restore Telecom New Connection (NC)"** බටන් එකෙන්ද එක ක්ලික් එකකින් නැවත සකසාගත හැක.)*\n` +
      `3. **Section Name**, **Short Code**, **Badge Color** සහ විස්තරය ඇතුළත් කර **"Create Section"** ක්ලික් කරන්න.\n\n` +
      `**2 වන පියවර — එම Section එකට Default Material Template (BOM) එකක් සෑදීම:**\n` +
      `1. Section Card එක මත ඇති **"Configure Material Template"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. එම Section එකට නිතර වැය වන Items සහ සාමාන්‍ය ප්‍රමාණය (**Suggested Qty**) ඇතුළත් කර **"Save Material Template"** ක්ලික් කරන්න.\n` +
      `3. ඉන්පසු **Daily Progress Entry** පිටුවේදී එම Section එක තේරූ විට මෙම බඩු ලැයිස්තුව ස්වයංක්‍රීයව (Auto-fill) එතැනට ලැබේ!${
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
      `**Step 1 — Register Projects with Mandatory "Assigned Site Branch *" (Project & New Section Registry):**\n` +
      `1. Open **Project & New Section Registry** and click **Register Project**.\n` +
      `2. Select the **Project Structure Type** and choose the mandatory **Assigned Site Branch ***:\n` +
      `   • **🏢 Major / Main Project (Umbrella):** Use when a client issues bulk Free Stock for an entire area or contract containing multiple sub-projects. You can also add initial Sub-Projects right inside the same modal, or click **+ Sub-Project** on any Main Project row anytime.\n` +
      `   • **↳ Sub-Project (Under Main Project):** Links a sub-project under a Parent Major / Main Project (automatically inherits the Main Project's Assigned Site Branch).\n` +
      `   • **📄 Individual Project (Standalone):** A single standalone project assigned to its Site Branch.\n\n` +
      `**Step 2 — Receive Client Free-Issue Stock (FOC) into Central Main Stock with Auto Branch Allocation:**\n` +
      `1. Open **Client Free Stock (FOC)** and click **+ Log Client Free Stock**.\n` +
      `2. Select **🏢 Under Main Project** (or **📄 Individual Project**) and choose the project. **Receiving Storage Yard** defaults to **Main Central Warehouse (Central Yard)**, while **Allocated Site Branch** automatically links and **locks** to that project's Assigned Site Branch. Admins can also edit and reassign mis-logged FOC vouchers inside Client Free Stock.\n\n` +
      `**Step 3 — Request FOC Stock from Site Branch & Enter Material Usage / Daily Progress (with Wastage Qty):**\n` +
      `1. In **Stock Requisitions -> + New Stock Requirement Form**, switch to Tab 2 (**2. Client Free Stock for Assigned Project Request**). Only projects assigned to your **Requesting Site Branch** are displayed. Once approved and received, the stock moves from Central HQ FOC Pool to your Site Branch.\n` +
      `2. Open **Material Usage / Daily Progress Entry** -> in Step 2, select the **Sub-Project** (filtered by Step 1's Project Section). Logging **Qty Used** and **Wastage Qty** on a Sub-Project **automatically deducts from the Parent Main Project's Free Stock balance**.\n` +
      `3. Open **Usage Vouchers History -> Full Report for This Site (Project)** for team-by-team & grand totals, or the **Reconciliation** tab (Tab 3) to inspect the **Total Main Project Reconciliation** and **Sub-Projects Individual Breakdown**.${
        ctx.activeProjectsCount ? `\n\n📌 *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ''
      }`,
    answerSi: (ctx) =>
      `**Major / Main Projects, Sub-Projects, Individual Projects සහ Free Stock (FOC) Reconciliation ක්‍රියාත්මක වන ආකාරය:**\n\n` +
      `**1 වන පියවර — Project Registry තුළ අනිවාර්ය "Assigned Site Branch *" සමඟ ව්‍යාපෘති සෑදීම:**\n` +
      `1. වම් පස මෙනුවෙන් **"Project & New Section Registry"** වෙත ගොස් **"Register Project"** ක්ලික් කරන්න.\n` +
      `2. ව්‍යාපෘති වර්ගය (**🏢 Major / Main Project**, **↳ Sub-Project**, හෝ **📄 Individual Project**) තෝරා, එම ව්‍යාපෘතිය අයත් වන ශාඛාව **"Assigned Site Branch *"** Dropdown එකෙන් අනිවාර්යයෙන්ම තෝරන්න (Sub-Project එකකට Main Project එකේ Site Branch එක ඉබේම ලැබේ).\n\n` +
      `**2 වන පියවර — Client Free Stock (FOC) ප්‍රධාන ගබඩාවට භාරගැනීම, Locked Site Branch සහ Admin නිවැරදි කිරීම්:**\n` +
      `1. **"Client Free Stock (FOC)"** වෙත ගොස් **"+ Log Client Free Stock"** ක්ලික් කරන්න.\n` +
      `2. එහිදී බඩු මුලින්ම ලැබෙන ස්ථානය ලෙස **"Main Central Warehouse (Central Yard)"** Default පවතින අතර, Project එක තේරූ සැණින් **"Allocated Site Branch"** එක එම Project එකේ Site Branch එකට ස්වයංක්‍රීයව Link වී Lock වේ (වෙනත් ශාඛාවකට වෙනස් කළ නොහැක). වැරදි Project එකකට ලොග් වූ FOC වවුචර Admin හට Edit කර නිවැරදි Project එකට මාරු කළ හැක.\n\n` +
      `**3 වන පියවර — අදාළ Site Branch එකෙන් FOC බඩු Request කිරීම සහ Sub-Project Usage / Wastage දැමීම:**\n` +
      `1. **"Stock Requisitions -> + New Stock Requirement Form"** හි 2 වන ටැබ් එකෙන් (**"2. Client Free Stock for Assigned Project Request"**) තෝරාගත් Site Branch එකට අදාළ Projects පමණක් පෙන්වන අතර, එය Approve වූ පසු Central FOC Pool එකෙන් අඩු වී Site Branch එකට එකතු වේ.\n` +
      `2. **"Material Usage / Daily Progress Entry"** පිටුවේදී අදාළ **Sub-Project** එක තෝරා **Qty Used** සහ **Wastage Qty** දැමූ සැණින් එය **ස්වයංක්‍රීයව Main Project එකේ Free Stock තොගයෙන් අඩු වේ**.\n` +
      `3. **"Usage Vouchers History -> Full Report for This Site (Project)"** හරහා Teams වෙන වෙනම හා සම්පූර්ණ එකතුවද, **"Reconciliation"** (Tab 3) මගින් Main/Sub-Project ගැලපුමද බලාගත හැක.${
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
      `3. **Select Mandatory "Assigned Site Branch *":** Choose the Site Branch responsible for this project so Client FOC stock is automatically allocated exclusively to that branch.\n` +
      `4. **Enter Project Details:** Fill in Project ID (auto-generated starting from 0001), Reference No, Project/Customer Name, Customer Phone Number, Site ID, Client/Principal, Project Section, District, and Sub Area.\n` +
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
      `3. **අනිවාර්ය "Assigned Site Branch *" තේරීම:** ව්‍යාපෘතිය අදාළ වන Site Branch එක Dropdown එකෙන් අනිවාර්යයෙන්ම තෝරන්න.\n` +
      `4. **විස්තර ඇතුළත් කිරීම:** Project ID (0001 සිට ඉබේම ජනනය වේ), Project/Customer Name, දුරකථන අංකය, Project Section, District සහ Sub Area ඇතුළත් කර Save කරන්න.${
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
      `**How to Record Material Usage / Daily Progress Entry (Standard Projects vs. Telecom New Connection):**\n\n` +
      `1. **Open Material Usage / Daily Progress Entry:** Click **Material Usage / Daily Progress Entry** in the left sidebar and pick a **Project Section** at the top.\n` +
      `2. **If "Telecom New Connection" (NC) Section is Selected (Simple 1-2-3 Workflow):**\n` +
      `   • **Step 1 — Team & Area Selection (Top-Most & Locked Until Refresh):** Select Site Branch, Field Team, and Exchange/Working Area and click **Confirm & Lock Team / Area**. Step 1 stays locked until page refresh so you never have to re-select the team for each NC line.\n` +
      `   • **Step 2 — Select NC Line or "+ Register New Connection":** Search by Customer Name or NC Number, or click **+ Register New Connection** to enter the 6 subscriber fields (*1. Customer FTTH / NC Number, 2. ONT Serial No, 3. Customer Name, 4. Customer Address, 5. Customer Mobile No, 6. Exchange Area*) right there.\n` +
      `   • **Step 3 — Material Usage:** Enter consumed materials and submit (Step 1 stays locked for the next NC line).\n` +
      `3. **If a Standard Section is Selected (Main / Sub / Individual Projects):**\n` +
      `   • Step 2 filters to **ONLY projects registered under that section**. If the project belongs to another Site Branch, Step 4 safely **locks**.\n` +
      `   • Enter **Qty Used (Installed)** and **Wastage Qty** per material (validated live against **Team In-Hand**).\n` +
      `4. **Usage Vouchers History -> "Full Report for This Site (Project)":** Select any project to print/export separate **Team-by-Team Subtotals** + **Full Site Grand Total**.`,
    answerSi: () =>
      `**Material Usage / Daily Progress Entry හරහා භාවිතය සටහන් කිරීම (සාමාන්‍ය Projects සහ Telecom New Connection):**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Material Usage / Daily Progress Entry"** වෙත ගොස් ඉහළින් අදාළ **Project Section** එක තෝරන්න.\n` +
      `2. **"Telecom New Connection" තේරූ විට (සරල 1, 2, 3 පියවර):**\n` +
      `   • **පියවර 1 — Team & Area Selection (උඩින්ම):** Field Team එක සහ Area එක තෝරා Confirm කළ පසු **Page එක Refresh කරන තුරු එම විස්තර Lock වී පවතී** (දවසේ NC lines ඔක්කොම එක දිගට දාද්දී නැවත Team තෝරන්න අවශ්‍ය නැත).\n` +
      `   • **පියවර 2 — Select NC Line හෝ "+ Register New Connection":** Customer Name හෝ NC Number එකෙන් Search කර line එක තෝරන්න, නැතිනම් **"+ Register New Connection"** Tab එකෙන් කරුණු 6 (*NC Number, ONT Serial, Name, Address, Mobile, Exchange Area*) එතැනම ඇතුළත් කර register කරන්න.\n` +
      `   • **පියවර 3 — Material Usage:** වැය වූ Materials ඇතුළත් කර Submit කරන්න (පියවර 1 වෙනස් නොවී එහෙමම පවතී).\n` +
      `3. **සාමාන්‍ය Section එකක් තේරූ විට (Main / Sub / Individual):**\n` +
      `   • එම Section එකට අදාළ Projects පමණක් පෙන්වන අතර, ඔබේ Site Branch එකට අයත් නොවන Project එකක් නම් ආරක්ෂිතව Lock වේ.\n` +
      `   • **Qty Used** සහ **Wastage Qty** ඇතුළත් කර Submit කළ හැක.\n` +
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
      `**How to Request & Transfer Stock (Normal Stock vs. Project Client FOC) from Main Warehouse to a Branch Yard:**\n\n` +
      `1. **Open Stock Requisitions:** Go to **Stock Requisitions** from the left sidebar and click **+ New Stock Requirement Form**.\n` +
      `2. **Select Requesting Site Branch & Choose Request Tab:**\n` +
      `   • **Tab 1 — 1. Normal Stock Request:** Request regular warehouse stock. Items that are currently **Low Stock** at your requesting branch automatically appear at the top of the list with a **⚠️ Site Low** badge, showing both **Site Avl:** and **Main:** balances.\n` +
      `   • **Tab 2 — 2. Client Free Stock for Assigned Project Request:** Exclusively shows **Major / Main Projects** and **Individual Projects** assigned to your selected **Requesting Site Branch** so client stock never mixes across branches.\n` +
      `3. **Approve & Dispatch (HQ):** Central HQ reviews the requisition table (with full Item Code + Material Description) and clicks **Approve & Dispatch**.\n` +
      `4. **Confirm Receipt at Branch (GRN):** Clicking **Confirm Receipt (GRN)** deducts from Central Main Stock (or Central FOC Pool) and adds the stock directly into **Site Branch Stock**.${
        ctx.pendingRequestsCount
          ? `\n\n📌 *Live Status:* **${ctx.pendingRequestsCount} pending stock request(s)** waiting for action.`
          : ''
      }`,
    answerSi: (ctx) =>
      `**Main Warehouse (ප්‍රධාන ගබඩාවේ) සිට Branch / Site එකකට බඩු Request කර Transfer කරගන්නා ආකාරය (Normal Stock සහ Client FOC):**\n\n` +
      `1. **Request ෆෝම් එක විවෘත කිරීම:** වම් පස මෙනුවෙන් **"Stock Requisitions"** වෙත ගොස් **"+ New Stock Requirement Form"** බටන් එක ක්ලික් කර පළමුව **"Requesting Site Branch *"** තෝරන්න.\n` +
      `2. **ටැබ් දෙකෙන් අදාළ වර්ගය තේරීම:**\n` +
      `   • **1. Normal Stock Request:** සාමාන්‍ය ගබඩා තොග ඉල්ලුම් කිරීමට. මෙහිදී එම Site එකේ දැනට අඩු තොග (Low Stock) ඇති භාණ්ඩ ලැයිස්තුවේ උඩින්ම **"⚠️ Site Low"** ලෙස පෙරී පෙන්වන අතර සෑම භාණ්ඩයකම **"Site Avl:"** සහ **"Main:"** තොග ප්‍රමාණයන් එතැනම පෙන්වයි.\n` +
      `   • **2. Client Free Stock for Assigned Project Request:** තෝරාගත් Site Branch එකට අදාළව වෙන් කර ඇති **Major / Main Projects** සහ **Individual Projects** පමණක් පෙන්වන අතර, එම ව්‍යාපෘතියේ FOC බඩු පැටලෙන්නේ නැතිව ශාඛාවට ගෙන්වාගත හැක.\n` +
      `3. **Approve කර Branch එකට භාරගැනීම:** ප්‍රධාන ගබඩාවෙන් Approve කර Branch එකෙන් Confirm කළ පසු, අදාළ ප්‍රමාණයන් Main Stock / FOC Pool එකෙන් අඩු වී **"Site Branch Stock"** එකට එකතු වේ.${
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
    ],
    phrases: [
      'client free stock',
      'free of charge',
      'client material',
      'under main project',
      'wrong project foc',
      'correct foc',
      'foc waradila',
    ],
    answerEn: () =>
      `**How to Manage Client Free Stock (FOC) — Locked Site Branch & Admin Voucher Correction:**\n\n` +
      `1. Open **Client Free Stock (FOC)** from the left sidebar and click **+ Log Client Free Stock**.\n` +
      `2. Choose **🏢 Under Main Project** or **📄 Individual Project** and select the project:\n` +
      `   • **Receiving Storage Yard (Inbound):** Defaults to **Main Central Warehouse (Central Yard)** because physical client materials enter Central Main Stock first.\n` +
      `   • **Allocated Site Branch (Auto-Locked):** Selecting the project automatically links and **locks** the **Allocated Site Branch** to that project's registered branch so FOC materials can never be accidentally issued to the wrong site branch.\n` +
      `3. **Admin FOC Voucher Correction / Reassignment:** If a shipment was mistakenly logged under the wrong project, Admins can click **Edit** on that FOC voucher directly inside **Client Free Stock (FOC)** and select the correct Target Project (automatically updating the locked Site Branch & balances with Audit Trail history).\n` +
      `4. **Branch Requisition & Usage:** Only the allocated Site Branch sees that project in **Stock Requisitions -> 2. Client Free Stock for Assigned Project Request**, and Sub-Project usage automatically deducts from the Parent Main Project's FOC pool.`,
    answerSi: () =>
      `**Client Free Stock (FOC) — Auto-Locked Site Branch සහ Admin මගින් වැරදි වවුචර් නිවැරදි කිරීම:**\n\n` +
      `1. වම් පස මෙනුවෙන් **"Client Free Stock (FOC)"** වෙත ගොස් **"+ Log Client Free Stock"** ක්ලික් කරන්න.\n` +
      `2. **Target Project Mode** (**🏢 Under Main Project** හෝ **📄 Individual Project**) තෝරා අදාළ Project එක තෝරන්න:\n` +
      `   • **Receiving Storage Yard (Inbound):** බඩු මුලින්ම ලැබෙන්නේ ප්‍රධාන ගබඩාවට බැවින් **"Main Central Warehouse (Central Yard)"** Default ලෙස පවතී.\n` +
      `   • **Allocated Site Branch (Auto-Locked):** Project එක තේරූ සැණින් එම Project එකට අදාළ **Site Branch** එක ස්වයංක්‍රීයව Link වී **Lock** වේ (වෙනස් කළ නොහැක). එමගින් වැරදි ශාඛාවකට FOC බඩු නිකුත් වීම සම්පූර්ණයෙන් වළක්වයි.\n` +
      `3. **වැරදි FOC වවුචර Admin විසින් නිවැරදි කිරීම:** යම් හෙයකින් FOC තොගයක් වැරදි Project එකකට ලොග් වී ඇත්නම්, Admin හට **Client Free Stock** තුළදීම එම වවුචරය **Edit** කර නිවැරදි Project එකට මාරු (Reassign) කළ හැක.\n` +
      `4. **ශාඛාවට Request කිරීම සහ භාවිතය:** අදාළ Site Branch එකට පමණක් Stock Requisitions 2 වන ටැබ් එකෙන් මෙම බඩු Request කළ හැකි අතර Sub-Projects වලට Usage දැමූ විට Main Project FOC තොගයෙන් ඉබේම අඩු වේ.`,
  },
  {
    id: 'items-barcodes-machinery',
    suggestedTab: 'items',
    keywords: ['barcode', 'qr', 'scanner', 'usb scanner', 'camera scan', 'machinery', 'plant', 'equipment', 'excel import', 'item catalog', 'scan now'],
    phrases: [
      'item catalog',
      'plant & equipment',
      'print barcode',
      'barcode scanner',
      'import items excel',
      'scan now',
    ],
    answerEn: (ctx) =>
      `**Item Catalog, Plant & Equipment, Excel Import & Single-Shot Barcode Scanning ("Scan Now"):**\n\n` +
      `• **Item Catalog & Plant/Equipment:** Open **Item Catalog** for all items or **Plant & Equipment** specifically for machinery and tools (auto-numbered starting from **ITM-0001** / **MCH-0001**).\n` +
      `• **Excel Bulk Import / Export:** Import items from Excel/CSV using **Sync (Add + Update)**, **Append Only**, or **Replace** modes.\n` +
      `• **Single-Shot Barcode Scanner ("Scan Now"):** When scanning with a **Mobile Camera** or **USB / Wireless Barcode Gun** (including **Live Inventory Barcode Lookup** on the top header), the scanner detects once, immediately stops and hides the live camera feed so it never scans repeatedly, and displays a **"Scan Now"** button to turn the scanner back on for the next item.\n\n` +
      `📌 *Current Catalog:* **${ctx.activeItemsCount ?? 0}** active items (**${ctx.lowStockItemsCount ?? 0}** low-stock alerts).`,
    answerSi: (ctx) =>
      `**Item Catalog, Plant & Equipment, Excel Import සහ Single-Shot Barcode Scanner ("Scan Now"):**\n\n` +
      `• **Item Catalog & Plant/Equipment:** සියලුම භාණ්ඩ **"Item Catalog"** මගින්ද, යන්ත්‍රෝපකරණ සහ Tools **"Plant & Equipment"** මගින්ද (0001 සිට අංකනය වන සේ) කළමනාකරණය කළ හැක.\n` +
      `• **Excel Import / Export:** Excel ගොනුවක් මගින් භාණ්ඩ සිය ගණනක් එකවර පද්ධතියට ඇතුළත් කළ හැක.\n` +
      `• **Single-Shot Barcode Scanner ("Scan Now"):** Mobile Camera එකෙන් හෝ USB Barcode Gun එකෙන් Scan කරන විට එක වරක් Detect වූ සැණින් Scanner එක ස්වයංක්‍රීයව නතර වී Camera Screen එක ඉවත් වේ (එක දිගට නොනවතී Scan වීම වළක්වයි). නැවත ඊළඟ භාණ්ඩය Scan කිරීමට එතැනම යටින් ඇති **"Scan Now"** බටන් එක ඔබන්න.\n\n` +
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
          `**Tab 3 — "3. Digital Signatures" (Draw or Upload):**\n` +
          `1. Click **+ Add Digital Signature**.\n` +
          `2. Enter the **Signer Full Name** (matching your Prepared By or Approved By name), **Designation / Role**, and **Department**.\n` +
          `3. Either **Draw Signature** directly on the interactive signature pad OR click **Upload Signature Image** (PNG/JPG), then click **Save Signature**.\n` +
          `4. **Auto-Match & Live Voucher Selection:** Saved signatures automatically appear on vouchers matching the signer's name, or you can manually pick any signature inside any voucher's **"Customize Voucher Header, Signers & Digital Signatures"** panel before clicking **Print** (isolated single-click A4 preview) or **Convert to PDF**!`
      ),
    answerSi: () =>
      `**Document Templates හි ISO 9001:2015 Format Settings, Auto Tenant Header, Signers සහ Digital Signatures සකස් කරගන්නා ආකාරය:**\n\n` +
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
      `**3 වන ටැබ් එක — "3. Digital Signatures" (ඩිජිටල් අත්සන් එකතු කිරීම):**\n` +
      `1. **"+ Add Digital Signature"** බටන් එක ක්ලික් කරන්න.\n` +
      `2. නිලධාරියාගේ නම (**Signer Full Name**), තනතුර (**Role**) සහ අංශය (**Department**) ඇතුළත් කරන්න.\n` +
      `3. තිරයේ ඇති කොටුව මත Mouse/Touch මගින් කෙලින්ම අත්සන අඳින්න (**Draw Signature**) නැතිනම් අත්සනේ PNG/JPG Image එකක් **Upload** කර **"Save Signature"** ක්ලික් කරන්න.\n` +
      `4. **වවුචර් වලට යෙදීම සහ තනි ක්ලික් Print:** Save කළ Digital Signatures නිලධාරියාගේ නම අනුව ස්වයංක්‍රීයව වවුචර් වලට වැටෙන අතර, ඕනෑම වවුචරයක් Print කරන විට උඩින් ඇති **"Customize Voucher Header, Signers & Digital Signatures"** කොටසින්ද කැමති අත්සනක් තෝරා එකවරම (Isolated Single-Click A4 Print) මුද්‍රණය හෝ PDF බාගත කළ හැක!`,
  },
  {
    id: 'directory-audit-letterhead-backup',
    suggestedTab: 'branch-directory',
    keywords: ['directory', 'audit', 'report', 'print', 'backup', 'flush', 'theme', 'config'],
    phrases: [
      'branch staff & teams',
      'audit trail',
      'system backup',
      'system config',
    ],
    answerEn: () =>
      `**Branch Directory, Isolated Single-Click Printing, Audit Trail & System Backups:**\n\n` +
      `• **Branch Staff & Teams:** View, filter, export to Excel (**Export Members**), and print the complete hierarchy of branches, supervisors, field teams, and crew members.\n` +
      `• **Isolated Single-Click A4 Print & PDF Export:** Every Print button across all Vouchers, Full Site Reports, Barcode Labels, Team In-Hand, Branch Directory, and Audit Trail opens a clean, isolated A4 print preview of ONLY that document without printing the full web page.\n` +
      `• **Audit Trail:** Inspect chronological logs of every transaction and user action with PDF/CSV export.\n` +
      `• **System Backups & Config (Top Header):** Create/restore versioned JSON backups, open the **Offline Backup Viewer**, customize system theme/company settings, or perform an **Admin System Flush**.`,
    answerSi: () =>
      `**Branch Directory, Isolated Single-Click Print, Audit Trail සහ System Backups:**\n\n` +
      `• **Branch Staff & Teams:** සියලුම Branches, Supervisors, Teams සහ සාමාජිකයින්ගේ විස්තර බලාගැනීමට සහ Print / Excel Export කිරීමට.\n` +
      `• **Isolated Single-Click A4 Print:** පද්ධතියේ ඕනෑම වවුචරයක හෝ වාර්තාවක Print එබූ විට සම්පූර්ණ වෙබ් පිටුව නොව අදාළ වවුචරය/වාර්තාව පමණක් එකවරම පැහැදිලිව Print Preview වේ.\n` +
      `• **Audit Trail:** පද්ධතියේ සිදු කළ සියලුම ගනුදෙනු පිළිබඳ වාර්තා ලබාගැනීමට.\n` +
      `• **System Backup & Config (ඉහළ Header තීරුව):** පද්ධතියේ සම්පූර්ණ Backup ලබාගැනීමට, Restore කිරීමට සහ ආයතනයේ Theme/Settings වෙනස් කිරීමට.`,
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
        `**Apex Stock & Site Management System — සම්පූර්ණ මගපෙන්වීම:**\n\n` +
        `ඔබ දැනට **${ctx.userRole || 'Staff'}** ලෙස **${ctx.branchName || 'All Branches'}** හි සිටී. පද්ධතියේ සියලුම කොටස්:\n` +
        `1. **Master Registrations:** Items, Branches (Sites), Field Teams (සහ Team Members), Suppliers, Clients සහ Users ලියාපදිංචි කිරීම.\n` +
        `2. **Main Central Stock & Supplier Orders (PO):** ප්‍රධාන ගබඩාවට GRN දැමීම, Purchase Orders, Supplier Returns (Debit Notes) සහ Damaged Stock කළමනාකරණය.\n` +
        `3. **Client Free Stock (FOC):** සේවාදායකයින් නොමිලේ ලබාදෙන බඩු Auto-Locked Site Branch සමඟ කළමනාකරණය සහ Admin මගින් වැරදි වවුචර් නිවැරදි කිරීම.\n` +
        `4. **Stock Requisitions & Site Branch Stock:** ප්‍රධාන ගබඩාවෙන් Branch වලට බඩු ඉල්ලුම් කිරීම (Normal vs Client FOC), Approve & Dispatch කිරීම සහ Branch තොග පාලනය.\n` +
        `5. **Issue to Teams & Team In-Hand Stock:** Branch එකෙන් Team වලට බඩු නිකුත් කිරීම (Gate Pass) සහ Team අතේ ඇති බඩු (Used + Wastage) පරීක්ෂාව.\n` +
        `6. **Project & New Section Registry:** අලුත් Project Sections සෑදීම (**+ New Section Registry**), **Material Templates (BOM)** සකස් කිරීම සහ Mandatory Site Branch සමඟ Projects ලියාපදිංචි කිරීම.\n` +
        `7. **Material Usage / Daily Progress Entry:** Section-filtered Projects, User-Site Branch Lock, **Qty Used + Wastage Qty** ඇතුළත් කිරීම සහ **Full Report for This Site (Project)** (Team Subtotals + Grand Total) ලබාගැනීම.\n` +
        `8. **Document Templates (ISO 9001:2015 Formats, Signers & Digital Signatures):** Auto Tenant Header, Signers (Prepared/Approved/Reviewed), Digital Signatures (ඇඳීම හෝ Upload කිරීම), PDF/Image Format Upload සහ Isolated Single-Click A4 Print.\n\n` +
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
      `3. **Client Free Stock (FOC):** Track client-supplied free materials with Auto-Locked Site Branch allocation & Admin FOC voucher reassignment.\n` +
      `4. **Stock Requisitions & Site Branch Stock:** Request stock from HQ (Normal vs. Branch-Exclusive FOC), Approve & Dispatch, and Confirm Receipt.\n` +
      `5. **Issue to Teams & Team In-Hand Stock:** Issue materials to Field Teams with Gate Passes and monitor live Installed & Wastage balances.\n` +
      `6. **Project & New Section Registry:** Create Project Sections (**+ New Section Registry**), configure **Material Templates (BOM)**, and register Main, Sub & Individual Projects.\n` +
      `7. **Material Usage / Daily Progress Entry:** Section-filtered project dropdowns, User-Site Branch Lock, **Qty Used + Wastage Qty** entry, and **Full Report for This Site (Project)** (Team Subtotals + Full Grand Total).\n` +
      `8. **Document Templates (ISO 9001:2015 Format Settings, Auto Tenant Header, Signers & Digital Signatures):** Configure ISO formats, upload PDF/Image layouts, manage Signer designations, draw/upload Digital Signatures, and use Isolated Single-Click A4 Printing.\n\n` +
      `Click any **Quick Help** topic above or ask about any specific feature!`,
  };
}
