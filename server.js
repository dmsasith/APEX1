// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// src/utils/supportKnowledgeEngine.ts
function detectSinhalaOrSinglishInput(text) {
  if (/[\u0D80-\u0DFF]/.test(text)) return true;
  const singlishWords = [
    "kohomada",
    "mokakda",
    "monawada",
    "badu",
    "danne",
    "karanne",
    "yawanne",
    "ganne",
    "ekata",
    "eken",
    "puluwanda",
    "pennanne",
    "naha",
    "makuna",
    "aluth",
    "hadanne",
    "balanne",
    "udaw",
    "wisthara",
    "kiyanna",
    "hadala",
    "widiyath",
    "widiya"
  ];
  const lower = ` ${text.toLowerCase()} `;
  return singlishWords.some((w) => lower.includes(` ${w} `) || lower.includes(`${w}?`));
}
var KNOWLEDGE_TOPICS = [
  {
    id: "telecom-new-connection-nc-workflow",
    suggestedTab: "projects",
    keywords: [
      "new connection",
      "telecom new connection",
      "nc",
      "ftth",
      "ont",
      "ont serial",
      "exchange area",
      "nc number",
      "nc line",
      "lock team",
      "team lock",
      "restore telecom",
      "water project",
      "electric project",
      "electrical",
      "solar project",
      "solar pv",
      "add field",
      "custom field",
      "international"
    ],
    phrases: [
      "telecom new connection",
      "new connection",
      "water project",
      "electric project",
      "solar project",
      "add field",
      "international section templates",
      "nc line",
      "nc number",
      "ont serial",
      "register new connection",
      "select nc line",
      "confirm & lock team",
      "restore telecom new connection",
      "new connection section",
      "nc section"
    ],
    answerEn: () => `**How International Industry Section Templates (Telecom, Water, Electric, Solar), "Main Project -> Under New Connections" & Section-Filtered FOC Work:**

**1. Ready-to-Load International Section Templates & "+ Add Field":**
In **Project & New Section Registry -> New Section Registry & Material Templates**, load presets for **Telecom New Connection (ITU-T G.984)**, **Water Supply (ISO 4064)**, **Electrical Power (IEC 60364)**, **Solar PV (IEC 62446)**, or **Standard EPC**, and add unlimited custom technical fields via **+ Add Field**.

**2. Main Project -> Under New Connections (All 4 Utility Sections) & Section-Filtered FOC:**
\u2022 In Telecom, Water, Electrical, and Solar sections, you can register a **Standalone New Connection**, an umbrella **\u{1F3E2} Main Project (For New Connections)** (for bulk Client FOC), or a connection **\u21B3 Under Main Project (New Connection)**.
\u2022 In **Material Usage / Daily Progress Entry**, FOC Main Project dropdowns **ONLY appear if Client FOC stock actually exists for that specific active section** (e.g., Telecom NC only shows Telecom NC FOC Main Projects; normal Company Stock remains completely clutter-free).

**3. Daily Progress Entry (Simple 1, 2, 3 Steps with Team & Area Lock):**
\u2022 **Step 1 \u2014 Team & Area Selection (Locked Until Refresh):** Pick Site Branch, Field Team, and Working Area and click **Confirm & Lock Team / Area**.
\u2022 **Step 2 \u2014 Select Connection or "+ Register New Connection":** Pick an existing line or register a new connection right inside Step 2.
\u2022 **Step 3 \u2014 Enter Material Usage:** Log **Qty Used** + **Wastage Qty** (automatically deducts from Parent Main Project FOC balance when linked).`,
    answerSi: () => `**International Section Templates (Telecom, Water, Electric, Solar), "Main Project -> Under New Connections" \u0DC3\u0DC4 Section-Filtered FOC:**

**1. International Templates \u0DC3\u0DC4 "+ Add Field":**
**Project & New Section Registry -> New Section Registry & Material Templates** \u0DAD\u0DD4\u0DC5 **Telecom New Connection**, **Water Project**, **Electrical Power**, \u0DC3\u0DC4 **Solar PV** Templates \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D91\u0D9A\u0DD9\u0DB1\u0DCA Load \u0D9A\u0DBB **"+ Add Field"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Fields \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.

**2. \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 New Connection Section 4 \u0DC3\u0DB3\u0DC4\u0DCF "Main Project -> Under New Connections" \u0DC3\u0DC4 FOC Filter \u0DC0\u0DD3\u0DB8:**
\u2022 Telecom, Water, Electrical, \u0DC3\u0DC4 Solar \u0DBA\u0DB1 \u0D95\u0DB1\u0DD1\u0DB8 New Connection Section \u0D91\u0D9A\u0D9A **Standalone New Connection**, **\u{1F3E2} Main Project (For New Connections)**, \u0DC4\u0DDD **\u21B3 Under Main Project (New Connection)** \u0DBD\u0DD9\u0DC3 Register \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
\u2022 **Material Usage / Daily Progress Entry** \u0DC4\u0DD2\u0DAF\u0DD3 Client FOC \u0DAD\u0DDC\u0D9C \u0DBD\u0DD0\u0DB6\u0DD3 \u0D87\u0DAD\u0DD2 **\u0D91\u0DB8 \u0D85\u0DAF\u0DCF\u0DC5 Section \u0D91\u0D9A\u0DDA Main Projects \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA** Dropdown \u0D91\u0D9A\u0DA7 Filter \u0DC0\u0DD3 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2 (Company Stock \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA \u0DB1\u0DB8\u0DCA \u0D85\u0DB1\u0DC0\u0DC1\u0DCA\u200D\u0DBA FOC Options \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1\u0DCA\u0DB1\u0DDA \u0DB1\u0DD0\u0DAD).

**3. Daily Progress Enter \u0D9A\u0DBB\u0DB1 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 1, 2, 3:**
\u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 1:** Field Team \u0DC3\u0DC4 Area \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DCF Confirm \u0D9A\u0DC5 \u0DB4\u0DC3\u0DD4 Page \u0D91\u0D9A Refresh \u0D9A\u0DBB\u0DB1\u0D9A\u0DB8\u0DCA Lock \u0DC0\u0DD3 \u0DB4\u0DC0\u0DAD\u0DD3.
\u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 2:** Connection \u0D91\u0D9A Select \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 \u0DC4\u0DDD **"+ Register New Connection"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Connection \u0D91\u0D9A\u0D9A\u0DCA \u0D91\u0DAD\u0DD0\u0DB1\u0DB8 Register \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
\u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 3:** **Qty Used** \u0DC3\u0DC4 **Wastage Qty** \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB Submit \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (Main Project \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 \u0DB1\u0DB8\u0DCA FOC \u0DAD\u0DDC\u0D9C\u0DBA\u0DD9\u0DB1\u0DCA \u0D89\u0DB6\u0DDA\u0DB8 \u0D85\u0DA9\u0DD4 \u0DC0\u0DDA).`
  },
  {
    id: "field-team-site-transfer-and-site-separated-stock",
    suggestedTab: "team-stock",
    keywords: [
      "team transfer",
      "transfer team",
      "temporary assigned",
      "permanent",
      "ref:",
      "previous site",
      "stock to return",
      "assigned sites",
      "team history",
      "site transfer",
      "team name lock",
      "rename team",
      "delete team",
      "maru",
      "hitapu site",
      "bara nodipu"
    ],
    phrases: [
      "transfer team",
      "team transfer",
      "temporary assigned to",
      "stock to return",
      "team inhand stock",
      "team in-hand stock",
      "promote to permanent",
      "assigned sites history",
      "transfer karapu team",
      "hitapu site ekata",
      "bara nodipu badu",
      "team eka wena site ekakata",
      "team name wenas"
    ],
    answerEn: () => `**Field Team Site Transfer Workflow (Temporary vs. Permanent with "Ref:"), Site-Separated Team In-Hand Stock ("Stock to Return - [Site Name]") & Team Name Lock:**

**1. Transferring a Field Team to a New Site ("Temporary Assigned to - [New Site]"):**
\u2022 In **Master Registrations -> Field Teams** or **Team In-Hand Stock**, click **Transfer / Site History** on any team.
\u2022 Whether the team still has unreturned stock on their current site OR has zero stock, the transfer initially places the team in a **Temporary** state labeled:
  **"Temporary Assigned to - [New Site Name]"**
\u2022 **If Previous-Site Stock Is Pending:** Once all pending stock from the previous site is returned/cleared, the system automatically promotes the assignment on the new site to **Permanent** and updates the team display name with a permanent prior-site reference:
  **"[Team Name] (Ref: [Previous Site Name])"**
\u2022 **If Zero Stock Was Held on Previous Site:** **Branch Admin** or **System Admin** can click **Confirm / Promote to Permanent** right inside the Team Transfer & Details modal to promote the assignment to **Permanent** with **(Ref: [Previous Site Name])**.

**2. Site-Separated Team In-Hand Stock ("Stock to Return - [Previous Site Name]"):**
\u2022 In **Team In-Hand Stock**, the system **NEVER combines or sums** a transferred team's materials across different sites:
  - **Amber Section \u2014 "Stock to Return - [Previous Site Name]":** Lists unreturned materials/tools still owed to a previous site. These items **must be returned to that specific previous site** and **cannot be used** for projects on the new site.
  - **Emerald Section \u2014 "[Current Site Name] \u2014 Active Site Stock":** Lists materials issued at the team's current assigned site.

**3. Strict Active-Site Material Usage & Team Name Integrity Lock:**
\u2022 In **Material Usage / Daily Progress Entry**, a team can **ONLY consume stock issued under their current project's Site Branch**.
\u2022 **Team Name Lock After Stock Issue:** Once a team has received at least one stock item, its **Team Name** is locked against renaming in **Master Registrations -> Teams** (while Leader, Phone, and Crew Members remain editable) so historical vouchers and custody balances never lose accountability.`,
    answerSi: () => `**Field Team Site Transfer \u0D9A\u0DCA\u200D\u0DBB\u0DD2\u0DBA\u0DCF\u0DC0\u0DBD\u0DD2\u0DBA (Temporary vs. Permanent "Ref:"), Site \u0D85\u0DB1\u0DD4\u0DC0 \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DC5 Team In-Hand Stock ("Stock to Return - [Site Name]") \u0DC3\u0DC4 Team Name \u0D86\u0DBB\u0D9A\u0DCA\u0DC2\u0DCF\u0DC0:**

**1. Team \u0D91\u0D9A\u0D9A\u0DCA \u0DC0\u0DD9\u0DB1\u0DAD\u0DCA Site \u0D91\u0D9A\u0D9A\u0DA7 Transfer \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 ("Temporary Assigned to - [New Site]"):**
\u2022 **Master Registrations -> Teams** \u0DC4\u0DDD **Team In-Hand Stock** \u0DC4\u0DD2 \u0D95\u0DB1\u0DD1\u0DB8 Team \u0D91\u0D9A\u0D9A **"Transfer / Site History"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
\u2022 \u0D9A\u0DBD\u0DD2\u0DB1\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB7\u0DCF\u0DBB \u0DB1\u0DDC\u0DAF\u0DD4\u0DB1\u0DCA \u0DB6\u0DA9\u0DD4 \u0DAD\u0DD2\u0DB6\u0DD4\u0DAB\u0DAD\u0DCA \u0DB1\u0DD0\u0DAD\u0DAD\u0DCA, \u0DB8\u0DD4\u0DBD\u0DD2\u0DB1\u0DCA\u0DB8 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DA7 \u0DB8\u0DCF\u0DBB\u0DD4 \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 \u0D91\u0DB8 Team \u0D91\u0D9A \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1\u0DCA\u0DB1\u0DDA:
  **"Temporary Assigned to - [New Site Name]"** \u0DBD\u0DD9\u0DC3\u0DBA\u0DD2.
\u2022 **\u0D9A\u0DBD\u0DD2\u0DB1\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB6\u0DA9\u0DD4 Clear \u0DC0\u0DD6 \u0DB4\u0DC3\u0DD4 (\u0DC4\u0DDD \u0DB6\u0DA9\u0DD4 \u0DB1\u0DDC\u0D9C\u0DAD\u0DCA Team \u0D91\u0D9A\u0D9A\u0DCA \u0DB1\u0DB8\u0DCA Branch/System Admin \u0DC0\u0DD2\u0DC3\u0DD2\u0DB1\u0DCA Confirm \u0D9A\u0DC5 \u0DB4\u0DC3\u0DD4):** \u0D91\u0DB8 Team \u0D91\u0D9A \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA **Permanent** \u0DAD\u0DAD\u0DCA\u0DAD\u0DCA\u0DC0\u0DBA\u0DA7 \u0DB4\u0DAD\u0DCA \u0DC0\u0DB1 \u0D85\u0DAD\u0DBB \u0D9A\u0DBD\u0DD2\u0DB1\u0DCA \u0DC3\u0DD2\u0DA7\u0DD2 Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8 \u0DC3\u0DB8\u0D9F:
  **"[Team Name] (Ref: [Previous Site Name])"** \u0DBD\u0DD9\u0DC3 \u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2\u0DC0 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2.

**2. Team In-Hand Stock \u0DB6\u0DD0\u0DBD\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 Site \u0D85\u0DB1\u0DD4\u0DC0 \u0DB6\u0DA9\u0DD4 \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DBB \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DD3\u0DB8 (\u0D94\u0D9A\u0DCA\u0D9A\u0DDC\u0DB8 \u0DB6\u0DA9\u0DD4 \u0D91\u0D9A\u0DAD\u0DD4\u0DC0 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1\u0DCA\u0DB1\u0DDA \u0DB1\u0DD0\u0DAD):**
\u2022 Transfer \u0D9A\u0DBB\u0DB4\u0DD4 Team \u0D91\u0D9A\u0D9A In-Hand Stock \u0DB6\u0DD0\u0DBD\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 \u0DB4\u0DBB\u0DAB Site \u0D91\u0D9A\u0DDA \u0DB6\u0DA9\u0DD4 \u0DC3\u0DC4 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB6\u0DA9\u0DD4 **\u0D9A\u0DD2\u0DC3\u0DD2\u0DC0\u0DD2\u0DA7\u0DD9\u0D9A \u0D91\u0D9A\u0DA7 \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB (Combine \u0D9A\u0DBB) \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1\u0DCA\u0DB1\u0DDA \u0DB1\u0DD0\u0DAD**:
  - **"Stock to Return - [\u0D9A\u0DBD\u0DD2\u0DB1\u0DCA \u0DC4\u0DD2\u0DA7\u0DB4\u0DD4 Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8]" (Amber Section):** \u0D9A\u0DBD\u0DD2\u0DB1\u0DCA \u0DC4\u0DD2\u0DA7\u0DB4\u0DD4 Site \u0D91\u0D9A\u0DA7 \u0DB7\u0DCF\u0DBB \u0DB1\u0DDC\u0DAF\u0DD4\u0DB1\u0DCA \u0DB6\u0DA9\u0DD4 \u0DAD\u0DDC\u0D9C\u0DBA \u0D85\u0DAF\u0DCF\u0DC5 \u0DB4\u0DBB\u0DAB Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8 \u0DBA\u0DA7\u0DAD\u0DDA \u0DC0\u0DD9\u0DB1\u0DB8\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2. \u0D91\u0DB8 \u0DB6\u0DA9\u0DD4 \u0D85\u0DAF\u0DCF\u0DC5 \u0DB4\u0DBB\u0DAB Site \u0D91\u0D9A\u0DA7\u0DB8 Return \u0D9A\u0DC5 \u0DBA\u0DD4\u0DAD\u0DD4\u0DBA.
  - **"[\u0D85\u0DBD\u0DD4\u0DAD\u0DD2\u0DB1\u0DCA \u0D9C\u0DD2\u0DBA Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8] \u2014 Active Site Stock" (Emerald Section):** \u0D85\u0DBD\u0DD4\u0DAD\u0DD2\u0DB1\u0DCA \u0D9C\u0DD2\u0DBA Site \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DC5 \u0DB6\u0DA9\u0DD4 \u0D91\u0DB8 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8 \u0DBA\u0DA7\u0DAD\u0DDA \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2.

**3. \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB6\u0DA9\u0DD4 \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DC4 \u0DB6\u0DA9\u0DD4 \u0DBD\u0DB6\u0DCF\u0D9C\u0DAD\u0DCA Team Name \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 Lock \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8:**
\u2022 **Material Usage / Daily Progress Entry** \u0DC4\u0DD2\u0DAF\u0DD3 \u0D91\u0DB8 Team \u0D91\u0D9A\u0DA7 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA \u0DC0\u0DD0\u0DA9\u0DC0\u0DBD\u0DA7 \u0DB4\u0DCF\u0DC0\u0DD2\u0DA0\u0DCA\u0DA0\u0DD2 \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A\u0DCA\u0D9A\u0DDA **\u0D91\u0DB8 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0D9C\u0DAD\u0DCA \u0DB6\u0DA9\u0DD4 \u0DB4\u0DB8\u0DAB\u0DD2**.
\u2022 **\u0DB6\u0DA9\u0DD4 \u0DBD\u0DB6\u0DCF\u0D9C\u0DD9\u0DB1 \u0D87\u0DAD\u0DD2 Team Name Lock \u0DC0\u0DD3\u0DB8:** \u0D91\u0D9A \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA\u0D9A\u0DCA \u0DC4\u0DDD \u0DBD\u0DB6\u0DCF\u0D9C\u0DD9\u0DB1 \u0D87\u0DAD\u0DD2 Team \u0D91\u0D9A\u0D9A \u0DB1\u0DB8 (**Team Name**) \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DC5 \u0DB1\u0DDC\u0DC4\u0DD0\u0D9A\u0DD2 \u0DBD\u0DD9\u0DC3 Lock \u0D9A\u0DBB \u0D87\u0DAD (Leader \u0DC3\u0DC4 Members \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A).`
  },
  {
    id: "item-lifecycle-traceability-summary",
    suggestedTab: "main-stock",
    keywords: [
      "item summary",
      "lifecycle",
      "traceability",
      "forward summary",
      "central stock summary",
      "in hand summary",
      "bedila giye",
      "kocharak"
    ],
    phrases: [
      "item lifecycle",
      "traceability summary",
      "forward summary",
      "select item summary",
      "item ekak select",
      "central stock eke item",
      "site branch stock eken item"
    ],
    answerEn: () => `**How to View & Print Item Lifecycle & Forward Traceability Summaries (Central Stock & Site Branch Stock):**

**1. Central Stock Item Selection \u2014 Full End-to-End Lifecycle Summary:**
\u2022 Open **Main Central Stock** and click on any item row (or click its **Summary** button).
\u2022 Directly underneath that item, an interactive **End-to-End Material Lifecycle & Custody Summary** expands showing:
  - **Inbound Sources:** How much arrived from each Supplier via **PO / GRN**, **Manual / Spot Entries**, **Client Free Stock (FOC)**, and **Site Good Returns**.
  - **Site Branch Distribution:** How much was dispatched to each Site Branch, returned, used/wasted, and each site's current **Site Store In-Hand**.
  - **Field Team Allocation:** How much each Site Branch issued to each Field Team, returned, used, wasted, and each team's current **Team In-Hand**.
  - **Project Consumption & Wastage:** Every project/NC line where the item was consumed.
  - **Live Custody KPI Strip:** Central Stock In-Hand, All Sites In-Hand, All Teams In-Hand, Total Used, and Total Wasted/Damaged.
\u2022 Click **Print A4 Summary** or **Download PDF** to print an official report.

**2. Site Branch Stock Item Selection \u2014 Forward Traceability Summary:**
\u2022 Open **Site Branch Stock (Site Inventories)**, pick a Site Branch, and click any item row (or **Forward Summary**).
\u2022 It displays everything that happened to that item forward from that branch: HQ/FOC transfers received, quantities issued to each Field Team at that site, Project Used & Wastage, **Site Store In-Hand**, and **Site Teams In-Hand** \u2014 with **Print A4 Summary** and **Download PDF**.`,
    answerSi: () => `**Central Stock \u0DC3\u0DC4 Site Branch Stock \u0DC4\u0DD2 \u0D95\u0DB1\u0DD1\u0DB8 Item \u0D91\u0D9A\u0D9A\u0DCA Select \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1 \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB Summary (Printable A4/PDF):**

**1. Central Stock \u0DC4\u0DD2 Item \u0D91\u0D9A\u0D9A\u0DCA Select \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 (Full End-to-End Lifecycle Summary):**
\u2022 **"Main Central Stock"** \u0DC0\u0D9C\u0DD4\u0DC0\u0DDA \u0D95\u0DB1\u0DD1\u0DB8 Item \u0DB4\u0DDA\u0DC5\u0DD2\u0DBA\u0D9A\u0DCA \u0DB8\u0DAD \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (\u0DC4\u0DDD **"Summary"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D94\u0DB6\u0DB1\u0DCA\u0DB1).
\u2022 \u0D91\u0DAD\u0DD0\u0DB1\u0DA7 \u0DBA\u0DA7\u0DD2\u0DB1\u0DCA \u0D91\u0DB8 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA\u0DDA \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB\u0DBA \u0DC0\u0DD2\u0DC0\u0DD8\u0DAD \u0DC0\u0DDA:
  - **\u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA (Inbound):** \u0D9A\u0DC0\u0DBB \u0DC3\u0DD0\u0DB4\u0DBA\u0DD4\u0DB8\u0DCA\u0D9A\u0DBB\u0DD4\u0DC0\u0DB1\u0DCA\u0D9C\u0DD9\u0DB1\u0DCA PO / GRN \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DC4\u0DDD Manual / Client FOC \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D9A\u0DDC\u0DB4\u0DB8\u0DAB \u0DB6\u0DA9\u0DD4 \u0D86\u0DC0\u0DCF\u0DAF \u0DBA\u0DB1\u0DCA\u0DB1.
  - **Site \u0DC0\u0DBD\u0DA7 \u0DB6\u0DD9\u0DAF\u0DD3 \u0D9C\u0DD2\u0DBA \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:** \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Site Branch \u0D91\u0D9A\u0DA7 \u0D9A\u0DDC\u0DB4\u0DB8\u0DAB \u0DB6\u0DD9\u0DAF\u0DD3 \u0D9C\u0DD2\u0DBA\u0DCF\u0DAF \u0DC3\u0DC4 \u0DAF\u0DD0\u0DB1\u0DA7 **Site In-Hand** \u0D9A\u0DDC\u0DB4\u0DB8\u0DAB \u0DAD\u0DD2\u0DB6\u0DDA\u0DAF \u0DBA\u0DB1\u0DCA\u0DB1.
  - **Site \u0DC0\u0DBD\u0DD2\u0DB1\u0DCA Team \u0DC0\u0DBD\u0DA7 \u0DB6\u0DD9\u0DAF\u0DD4\u0DAB\u0DD4 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:** \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Field Team \u0D91\u0D9A\u0DA7 \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DC5 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA, Used/Wasted \u0DC3\u0DC4 \u0DAF\u0DD0\u0DB1\u0DA7 **Team In-Hand** \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA.
  - **\u0DB8\u0DD4\u0DC5\u0DD4 \u0DAD\u0DDC\u0D9C \u0DC3\u0DCF\u0DBB\u0DCF\u0D82\u0DC1\u0DBA:** **Central Stock In-Hand**, **Site In-Hand**, **Team In-Hand**, **Total Used** \u0DC3\u0DC4 **Total Wasted/Damaged**.
\u2022 **"Print A4 Summary"** \u0DC4\u0DDD **"Download PDF"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DB8\u0DD9\u0DB8 \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0DB8\u0DD4\u0DAF\u0DCA\u200D\u0DBB\u0DAB\u0DBA \u0D9A\u0DBB\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A.

**2. Site Branch Stock \u0DC4\u0DD2 Item \u0D91\u0D9A\u0D9A\u0DCA Select \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 (Forward Traceability Summary):**
\u2022 **"Site Branch Stock"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA \u0D95\u0DB1\u0DD1\u0DB8 Item \u0D91\u0D9A\u0D9A\u0DCA \u0DB8\u0DAD \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 (\u0DC4\u0DDD **"Forward Summary"** \u0D91\u0DB6\u0DD6 \u0DC0\u0DD2\u0DA7) \u0D91\u0DB8 Site \u0D91\u0D9A\u0DA7 \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 \u0DB6\u0DA9\u0DD4 \u0D91\u0DAD\u0DD0\u0DB1\u0DCA \u0DC3\u0DD2\u0DA7 \u0D89\u0DAF\u0DD2\u0DBB\u0DD2\u0DBA\u0DA7 Teams \u0DC0\u0DBD\u0DA7 \u0DB6\u0DD9\u0DAF\u0DD4\u0DAB\u0DD4 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA, Projects \u0DC0\u0DBD Used/Waste \u0D9C\u0DD2\u0DBA \u0D86\u0D9A\u0DCF\u0DBB\u0DBA \u0DC3\u0DC4 Site/Team In-Hand \u0DAD\u0DDC\u0D9C \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1 \u0D85\u0DAD\u0DBB \u0D91\u0DBA\u0DAF Print \u0DC4\u0DCF PDF \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.`
  },
  {
    id: "project-sections-and-templates",
    suggestedTab: "projects",
    keywords: [
      "section",
      "sections",
      "template",
      "templates",
      "bom",
      "new section",
      "section registry",
      "project type",
      "suggested qty",
      "default material",
      "water",
      "electric",
      "solar",
      "add field"
    ],
    phrases: [
      "new section registry",
      "project section",
      "project sections",
      "material template",
      "material templates",
      "bom template",
      "create new section",
      "create section",
      "configure material template",
      "section hadala",
      "sections hadala",
      "template hadana",
      "templates hadana",
      "aluth project section",
      "add field"
    ],
    answerEn: (ctx) => `**How to Create Project Sections Using International Templates (Telecom, Water, Electric, Solar), Add Custom Fields ("+ Add Field") & Configure Material Templates (BOM):**

**Part 1 \u2014 Create a Project Section with International Industry Templates & "+ Add Field":**
1. Open **Project & New Section Registry** -> **New Section Registry & Material Templates** tab and click **+ Add New Section** (or click any of the 1-click Quick-Load Template buttons at the top).
2. Under **1. Load International Industry Standard Section Template**, select:
   \u2022 **Telecom New Connection (ITU-T G.984 / FTTH)**
   \u2022 **Water Supply & Utility Project (ISO 4064 / AWWA)**
   \u2022 **Electrical Power & Service Connection (IEC 60364 / IEEE)**
   \u2022 **Solar PV & Net-Metering Project (IEC 62446 / UL 1741)**
   \u2022 **Standard / Custom Engineering Project (ISO 21500 / EPC)**
3. Selecting any template automatically loads its Section Name, Code, Theme Color, 6 Core Field Labels, and pre-configured International Technical Fields.
4. Click **+ Add Field** inside the modal to add as many custom fields as you need (Field Label, Placeholder/Example, Required toggle), or click **Configure Fields / + Add Field** on any existing section card anytime.

**Part 2 \u2014 Configure a Default Material Template (BOM) for that Section:**
1. Click **Configure Material Template** (or **Edit Material Template (BOM)**) on your section card.
2. Select standard items routinely used in this section, enter optional **Suggested Qty**, and click **Save Material Template**.
3. Whenever a user selects this section in **Material Usage / Daily Progress Entry**, these template items load automatically!${ctx.activeProjectSectionsCount ? `

\u{1F4CC} *Current Workspace Status:* **${ctx.activeProjectSectionsCount} project section(s)** configured${ctx.projectSectionNames && ctx.projectSectionNames.length > 0 ? ` (${ctx.projectSectionNames.slice(0, 5).join(", ")})` : ""}.` : ""}`,
    answerSi: (ctx) => `**International Templates (Telecom, Water, Electric, Solar) \u0DC3\u0DC4 "+ Add Field" \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DBB \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Project Section \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0DC4 Material Template (BOM) \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0D9A\u0DC3\u0DCA \u0D9A\u0DBB\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

**1 \u0DC0\u0DB1 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB \u2014 International Template \u0D91\u0D9A\u0D9A\u0DCA \u0DAD\u0DDD\u0DBB\u0DCF "+ Add Field" \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Fields \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8:**
1. \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Project & New Section Registry"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA **"New Section Registry & Material Templates"** \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A\u0DD9\u0DC4\u0DD2 **"+ Add New Section"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (\u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA \u0D8B\u0DA9\u0DD2\u0DB1\u0DCA\u0DB8 \u0D87\u0DAD\u0DD2 Telecom, Water, Electric, Solar Quick-Load \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0D9A\u0DCA \u0D94\u0DB6\u0DB1\u0DCA\u0DB1).
2. **"1. Load International Industry Standard Section Template"** \u0DBA\u0DA7\u0DAD\u0DDA \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0D9A\u0DCA\u0DC2\u0DDA\u0DAD\u0DCA\u200D\u0DBB\u0DBA \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1:
   \u2022 **Telecom New Connection (ITU-T G.984 / FTTH)**
   \u2022 **Water Supply & Utility Project (ISO 4064 / AWWA)**
   \u2022 **Electrical Power & Service Connection (IEC 60364 / IEEE)**
   \u2022 **Solar PV & Net-Metering Project (IEC 62446 / UL 1741)**
   \u2022 **Standard / Custom Engineering Project (ISO 21500 / EPC)**
3. \u0D91\u0DC0\u0DD2\u0DA7 \u0D91\u0DB8 \u0D9A\u0DCA\u0DC2\u0DDA\u0DAD\u0DCA\u200D\u0DBB\u0DBA\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 \u0DA2\u0DCF\u0DAD\u0DCA\u200D\u0DBA\u0DB1\u0DCA\u0DAD\u0DBB Core Fields 6 \u0DC3\u0DC4 \u0D85\u0DB8\u0DAD\u0DBB Technical Fields \u0DC3\u0DD2\u0DBA\u0DBD\u0DCA\u0DBD \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 Load \u0DC0\u0DDA.
4. **"+ Add Field"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D91\u0DB6\u0DD3\u0DB8\u0DD9\u0DB1\u0DCA \u0D94\u0DB6\u0DA7 \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0DAD\u0DC0\u0DAD\u0DCA \u0D95\u0DB1\u0DD1\u0DB8 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Field \u0D91\u0D9A\u0D9A\u0DCA (Field Name, Placeholder, Required) \u0D91\u0DAD\u0DD0\u0DB1\u0DA7 \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB **"Create Section"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.

**2 \u0DC0\u0DB1 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB \u2014 \u0D91\u0DB8 Section \u0D91\u0D9A\u0DA7 Default Material Template (BOM) \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0DD1\u0DAF\u0DD3\u0DB8:**
1. Section Card \u0D91\u0D9A \u0DB8\u0DAD \u0D87\u0DAD\u0DD2 **"Configure Material Template"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
2. \u0D91\u0DB8 Section \u0D91\u0D9A\u0DA7 \u0DB1\u0DD2\u0DAD\u0DBB \u0DC0\u0DD0\u0DBA \u0DC0\u0DB1 Items \u0DC3\u0DC4 \u0DC3\u0DCF\u0DB8\u0DCF\u0DB1\u0DCA\u200D\u0DBA \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA (**Suggested Qty**) \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB **"Save Material Template"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.${ctx.activeProjectSectionsCount ? `

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA Project Sections **${ctx.activeProjectSectionsCount}\u0D9A\u0DCA** \u0DC3\u0D9A\u0DC3\u0DCA \u0D9A\u0DBB \u0D87\u0DAD.*` : ""}`
  },
  {
    id: "main-sub-individual-projects-foc-reconciliation",
    suggestedTab: "projects",
    keywords: [
      "main project",
      "major project",
      "sub project",
      "sub-project",
      "sub projects",
      "sub-projects",
      "individual project",
      "under main project",
      "reconciliation",
      "reconcile",
      "umbrella",
      "parent project",
      "all areas",
      "returnable",
      "completion"
    ],
    phrases: [
      "major project",
      "main project",
      "sub project",
      "sub-project",
      "under main project",
      "individual project",
      "project reconciliation",
      "sub project hadanne",
      "main project eken adu",
      "free stock reconciliation",
      "all areas",
      "reconciliation flow"
    ],
    answerEn: (ctx) => `**5-Stage Standard Free Stock (FOC) Reconciliation Flow, Main/Sub-Projects & "ALL AREAS" Multi-Site Support:**

**1. Register Projects with Branch OR "\u{1F310} ALL AREAS (All Site Branches)":**
\u2022 In **Project & New Section Registry -> Register Project**, select **Major/Main Project**, **Sub-Project**, **Individual Project**, or **New Connection**.
\u2022 Pick a specific **Assigned Site Branch *** OR choose **\u{1F310} ALL AREAS (All Site Branches)** for island-wide contracts (e.g., *"ISLAND WIDE FTTH NEW CONNECTION"*) so **any Site Branch** can request its FOC stock and log material usage without a branch lock.

**2. Clear 5-Stage Standard FOC Reconciliation Flow:**
All Client FOC summaries and reports follow one clear, chronological sequence:
   1) **Initial FOC Receipt at Central** (Total received at HQ Central Stock)
   2) **Site Issue** (Dispatched from Central HQ to Site Branches)
   3) **Team Issue** (Issued from Site Branches to Field Teams)
   4) **Usage & Wastage** (Installed Qty & Wastage logged on site/connections)
   5) **Balance / Returnable Stock on Project Completion** (Central + Site + Team In-Hand returnable to Client)

**3. Color-Coded Main Project Cards, Sub-Project Flows & Central A4/PDF Reports:**
\u2022 Selecting a **Sub-Project** shows its dedicated flow. Selecting a **Main Project** displays **color-coded Main Project cards**, each linked **Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506)** in its own flow section below, and a **Full Usage & Client Balance Summary Report** at the bottom.
\u2022 In **Client Free Stock / Central Stock**, print clean A4/PDF reports either **per individual issued item** OR as **one consolidated report for all items in a project**.${ctx.activeProjectsCount ? `

\u{1F4CC} *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ""}`,
    answerSi: (ctx) => `**\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 5 Client Free Stock (FOC) Reconciliation Flow, Main/Sub-Projects \u0DC3\u0DC4 "ALL AREAS" \u0DB4\u0DC4\u0DC3\u0DD4\u0D9A\u0DB8:**

**1. Project \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2\u0DBA \u2014 Site Branch \u0DC4\u0DDD "\u{1F310} ALL AREAS (All Site Branches)":**
\u2022 **Project & New Section Registry -> Register Project** \u0DAD\u0DD4\u0DC5 Project \u0D91\u0D9A \u0D85\u0DAF\u0DCF\u0DC5 Site Branch \u0D91\u0D9A\u0DA7 \u0DC4\u0DDD **\u{1F310} ALL AREAS (All Site Branches)** \u0DBD\u0DD9\u0DC3 Register \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
\u2022 **ALL AREAS** \u0DBD\u0DD9\u0DC3 Register \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 \u0D91\u0DB8 Project \u0D91\u0D9A\u0DA7 \u0DBD\u0DD0\u0DB6\u0DD9\u0DB1 FOC \u0DB6\u0DA9\u0DD4 **\u0D95\u0DB1\u0DD1\u0DB8 Site Branch \u0D91\u0D9A\u0D9A\u0DD2\u0DB1\u0DCA** Request \u0D9A\u0DBB \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A (Site Lock \u0DB6\u0DCF\u0DB0\u0DCF\u0DC0\u0D9A\u0DCA \u0DB1\u0DD0\u0DAD).

**2. \u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 5 Standard FOC Reconciliation Flow \u0D91\u0D9A:**
   1) **Initial FOC Receipt at Central:** \u0DB8\u0DD4\u0DBD\u0DD2\u0DB1\u0DCA\u0DB8 Central Stock \u0D91\u0D9A\u0DA7 \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 FOC \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA.
   2) **Site Issue:** Central \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0D85\u0DAF\u0DCF\u0DC5 Site \u0D91\u0D9A\u0DA7 (\u0DC4\u0DDD Sites \u0DC0\u0DBD\u0DA7) \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DC5 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA.
   3) **Team Issue:** Site \u0D91\u0D9A\u0DD9\u0DB1\u0DCA Field Teams \u0DC0\u0DBD\u0DA7 \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DC5 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA.
   4) **Usage & Wastage:** \u0DC0\u0DD0\u0DA9\u0DB6\u0DD2\u0DB8\u0DDA\u0DAF\u0DD3 \u0DC3\u0DD2\u0DAF\u0DD4 \u0DC0\u0DD6 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DBA (Usage) \u0DC3\u0DC4 \u0DB1\u0DCF\u0DC3\u0DCA\u0DAD\u0DD2\u0DBA (Wastage).
   5) **Balance / Returnable Stock on Project Completion:** Project \u0D85\u0DC0\u0DC3\u0DB1\u0DCA \u0DC0\u0DD6 \u0DB4\u0DC3\u0DD4 Client \u0DC0\u0DD9\u0DAD \u0D86\u0DB4\u0DC3\u0DD4 \u0DB7\u0DCF\u0DBB \u0DAF\u0DD2\u0DBA \u0DC4\u0DD0\u0D9A\u0DD2 \u0D89\u0DAD\u0DD2\u0DBB\u0DD2 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA.

**3. \u0DC0\u0DBB\u0DCA\u0DAB \u0D9C\u0DD0\u0DB1\u0DCA\u0DC0\u0DD6 Main Project Cards, Sub-Project Flow \u0DC3\u0DC4 Central Reports:**
\u2022 **Sub-Project** \u0D91\u0D9A\u0D9A\u0DCA \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 \u0D91\u0DB8 Sub-Project \u0D91\u0D9A\u0DDA Usage Flow \u0D91\u0D9A \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2. **Main Project** \u0D91\u0D9A\u0D9A\u0DCA \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0DC0\u0DBB\u0DCA\u0DAB Cards \u0DBA\u0DA7\u0DAD\u0DDA \u0D92 \u0DBA\u0DA7\u0DAD\u0DDA \u0D87\u0DAD\u0DD2 \u0DC4\u0DD0\u0DB8 **Sub-Project (\u0D8B\u0DAF\u0DCF: KT-RGL-0505, KT-ABK-0506)** \u0D91\u0D9A\u0D9A\u0DB8 Flow \u0D91\u0D9A \u0DB4\u0DC4\u0DC5\u0DA7 \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DCF \u0D85\u0DC0\u0DC3\u0DCF\u0DB1\u0DBA\u0DDA **Full Usage & Client Balance Summary Report** \u0D91\u0D9A \u0DBD\u0DB6\u0DCF\u0DAF\u0DD9\u0DBA\u0DD2.
\u2022 Central Stock \u0DC4\u0DBB\u0DC4\u0DCF \u0DC3\u0DD1\u0DB8 Issued Item \u0D91\u0D9A\u0D9A\u0DA7\u0DB8 **\u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 Report** \u0DB8\u0DD9\u0DB1\u0DCA\u0DB8 Project \u0D91\u0D9A\u0DDA **\u0DC3\u0DD2\u0DBA\u0DBD\u0DD4 Items \u0D91\u0D9A\u0DA7 \u0D9C\u0DAD\u0DCA Consolidated A4/PDF Report** \u0D91\u0D9A\u0D9A\u0DCA\u0DAF \u0DBD\u0DB6\u0DCF\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A.${ctx.activeProjectsCount ? `

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DC3\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Projects **${ctx.activeProjectsCount}\u0D9A\u0DCA** \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DBB \u0D87\u0DAD.*` : ""}`
  },
  {
    id: "project-registry-management",
    suggestedTab: "projects",
    keywords: [
      "project registry",
      "register project",
      "customer phone",
      "site id",
      "connection id",
      "import csv",
      "sample csv",
      "district",
      "sub area",
      "assigned site branch",
      "all areas"
    ],
    phrases: [
      "how to register a project",
      "register new project",
      "import projects",
      "project master list",
      "project ekak hadanne",
      "project register karanne",
      "all areas branch"
    ],
    answerEn: (ctx) => `**How to Register & Manage Projects (Main, Sub-Project, Individual, New Connections & "ALL AREAS"):**

1. **Open Project Registry:** Click **Project & New Section Registry** in the left sidebar and click **Register Project**.
2. **Choose Project Structure Type:** Select **\u{1F3E2} Major / Main Project** (or **Main Project for New Connections**), **\u21B3 Sub-Project** (or **Under Main Project**), or **\u{1F4C4} Individual / Standalone**.
3. **Select Assigned Site Branch * (or "\u{1F310} ALL AREAS"):** Choose the project's Site Branch, OR select **\u{1F310} ALL AREAS (All Site Branches)** if the contract runs across multiple branches so any site can request its FOC stock and log field usage.
4. **Enter Project Details & Save:** Fill in Project ID (0001 sequential), Reference No, Name, Client, District, and section technical fields.${ctx.activeProjectsCount ? `

\u{1F4CC} *Currently **${ctx.activeProjectsCount} active project(s)** are registered.*` : ""}`,
    answerSi: (ctx) => `**\u0D85\u0DBD\u0DD4\u0DAD\u0DCA Project \u0D91\u0D9A\u0D9A\u0DCA (Main, Sub, Individual, New Connection \u0DC3\u0DC4 "ALL AREAS") \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DBB\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

1. \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Project & New Section Registry" -> "Register Project"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
2. \u0DC0\u0DCA\u200D\u0DBA\u0DCF\u0DB4\u0DD8\u0DAD\u0DD2 \u0DC0\u0DBB\u0DCA\u0D9C\u0DBA (**\u{1F3E2} Major / Main Project**, **\u21B3 Sub-Project**, \u0DC4\u0DDD **\u{1F4C4} Individual / Standalone**) \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
3. **"Assigned Site Branch *" \u0DAD\u0DDA\u0DBB\u0DD3\u0DB8 (\u0DC4\u0DDD "\u{1F310} ALL AREAS"):** \u0D85\u0DAF\u0DCF\u0DC5 Site Branch \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1; \u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA \u0DBD\u0D82\u0D9A\u0DCF\u0DC0\u0DDA\u0DB8 / \u0D95\u0DB1\u0DD1\u0DB8 Site \u0D91\u0D9A\u0D9A \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD \u0DC0\u0DB1 Project \u0D91\u0D9A\u0D9A\u0DCA \u0DB1\u0DB8\u0DCA **"\u{1F310} ALL AREAS (All Site Branches)"** \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
4. Project ID (0001 \u0DC3\u0DD2\u0DA7 \u0D89\u0DB6\u0DDA\u0DB8 \u0DC3\u0DD1\u0DAF\u0DDA), \u0DB1\u0DB8, Client \u0DC3\u0DC4 Section Fields \u0DB4\u0DD4\u0DBB\u0DC0\u0DCF Save \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.${ctx.activeProjectsCount ? `

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DC3\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Projects **${ctx.activeProjectsCount}\u0D9A\u0DCA** \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DBB \u0D87\u0DAD.*` : ""}`
  },
  {
    id: "project-usage",
    suggestedTab: "project-usage",
    keywords: [
      "usage",
      "daily progress",
      "consume",
      "consumption",
      "boq",
      "bill of quantities",
      "project material",
      "override",
      "reserved project",
      "waya",
      "section filter",
      "site lock",
      "branch lock",
      "locked"
    ],
    phrases: [
      "record project usage",
      "project material usage",
      "material usage / daily progress entry",
      "daily progress entry",
      "log material usage",
      "cross project override",
      "project ekata",
      "material usage danne",
      "section eka maru karama",
      "site ekakata newei"
    ],
    answerEn: () => `**How to Record Material Usage / Daily Progress Entry (Standard Projects vs. Telecom New Connection):**

1. **Open Material Usage / Daily Progress Entry:** Click **Material Usage / Daily Progress Entry** in the left sidebar and pick a **Project Section** at the top.
2. **If "Telecom New Connection" (NC) Section is Selected (Simple 1-2-3 Workflow):**
   \u2022 **Step 1 \u2014 Team & Area Selection (Top-Most & Locked Until Refresh):** Select Site Branch, Field Team, and Exchange/Working Area and click **Confirm & Lock Team / Area**. Step 1 stays locked until page refresh so you never have to re-select the team for each NC line.
   \u2022 **Step 2 \u2014 Select NC Line or "+ Register New Connection":** Search by Customer Name or NC Number, or click **+ Register New Connection** to enter the 6 subscriber fields (*1. Customer FTTH / NC Number, 2. ONT Serial No, 3. Customer Name, 4. Customer Address, 5. Customer Mobile No, 6. Exchange Area*) right there.
   \u2022 **Step 3 \u2014 Material Usage:** Enter consumed materials and submit (Step 1 stays locked for the next NC line).
3. **If a Standard Section is Selected (Main / Sub / Individual Projects):**
   \u2022 Step 2 filters to **ONLY projects registered under that section**. If the project belongs to another Site Branch, Step 4 safely **locks**.
   \u2022 Enter **Qty Used (Installed)** and **Wastage Qty** per material (validated live against **Team In-Hand**).
4. **Usage Vouchers History -> "Full Report for This Site (Project)":** Select any project to print/export separate **Team-by-Team Subtotals** + **Full Site Grand Total**.`,
    answerSi: () => `**Material Usage / Daily Progress Entry \u0DC4\u0DBB\u0DC4\u0DCF \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DBA \u0DC3\u0DA7\u0DC4\u0DB1\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 (\u0DC3\u0DCF\u0DB8\u0DCF\u0DB1\u0DCA\u200D\u0DBA Projects \u0DC3\u0DC4 Telecom New Connection):**

1. \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Material Usage / Daily Progress Entry"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA \u0D89\u0DC4\u0DC5\u0DD2\u0DB1\u0DCA \u0D85\u0DAF\u0DCF\u0DC5 **Project Section** \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
2. **"Telecom New Connection" \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 (\u0DC3\u0DBB\u0DBD 1, 2, 3 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB):**
   \u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 1 \u2014 Team & Area Selection (\u0D8B\u0DA9\u0DD2\u0DB1\u0DCA\u0DB8):** Field Team \u0D91\u0D9A \u0DC3\u0DC4 Area \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DCF Confirm \u0D9A\u0DC5 \u0DB4\u0DC3\u0DD4 **Page \u0D91\u0D9A Refresh \u0D9A\u0DBB\u0DB1 \u0DAD\u0DD4\u0DBB\u0DD4 \u0D91\u0DB8 \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB Lock \u0DC0\u0DD3 \u0DB4\u0DC0\u0DAD\u0DD3** (\u0DAF\u0DC0\u0DC3\u0DDA NC lines \u0D94\u0D9A\u0DCA\u0D9A\u0DDC\u0DB8 \u0D91\u0D9A \u0DAF\u0DD2\u0D9C\u0DA7 \u0DAF\u0DCF\u0DAF\u0DCA\u0DAF\u0DD3 \u0DB1\u0DD0\u0DC0\u0DAD Team \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1 \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0DB1\u0DD0\u0DAD).
   \u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 2 \u2014 Select NC Line \u0DC4\u0DDD "+ Register New Connection":** Customer Name \u0DC4\u0DDD NC Number \u0D91\u0D9A\u0DD9\u0DB1\u0DCA Search \u0D9A\u0DBB line \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1, \u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA **"+ Register New Connection"** Tab \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0D9A\u0DBB\u0DD4\u0DAB\u0DD4 6 (*NC Number, ONT Serial, Name, Address, Mobile, Exchange Area*) \u0D91\u0DAD\u0DD0\u0DB1\u0DB8 \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB register \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
   \u2022 **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 3 \u2014 Material Usage:** \u0DC0\u0DD0\u0DBA \u0DC0\u0DD6 Materials \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB Submit \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 1 \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0DB1\u0DDC\u0DC0\u0DD3 \u0D91\u0DC4\u0DD9\u0DB8\u0DB8 \u0DB4\u0DC0\u0DAD\u0DD3).
3. **\u0DC3\u0DCF\u0DB8\u0DCF\u0DB1\u0DCA\u200D\u0DBA Section \u0D91\u0D9A\u0D9A\u0DCA \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 (Main / Sub / Individual):**
   \u2022 \u0D91\u0DB8 Section \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 Projects \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1 \u0D85\u0DAD\u0DBB, \u0D94\u0DB6\u0DDA Site Branch \u0D91\u0D9A\u0DA7 \u0D85\u0DBA\u0DAD\u0DCA \u0DB1\u0DDC\u0DC0\u0DB1 Project \u0D91\u0D9A\u0D9A\u0DCA \u0DB1\u0DB8\u0DCA \u0D86\u0DBB\u0D9A\u0DCA\u0DC2\u0DD2\u0DAD\u0DC0 Lock \u0DC0\u0DDA.
   \u2022 **Qty Used** \u0DC3\u0DC4 **Wastage Qty** \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB Submit \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
4. **Full Report for This Site (Project):** **"Usage Vouchers History"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA Teams \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DBA \u0DC3\u0DC4 \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB Grand Total \u0DBD\u0DB6\u0DCF\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A.`
  },
  {
    id: "wastage-and-full-site-report",
    suggestedTab: "project-usage",
    keywords: [
      "wastage",
      "waste",
      "full report",
      "site report",
      "grand total",
      "team total",
      "vouchers history",
      "apate",
      "wadipura",
      "siyalu teams"
    ],
    phrases: [
      "wastage qty",
      "enter wastage",
      "full report for this site",
      "full site report",
      "usage vouchers history",
      "team by team",
      "wastage danne",
      "wastage enter karanne",
      "full report balanne",
      "teams wena wenama"
    ],
    answerEn: () => `**How Wastage Qty Tracking & "Full Report for This Site (Project)" Work:**

**Part 1 \u2014 Recording Wastage Qty (Used + Wastage):**
1. Open **Material Usage / Daily Progress Entry** -> Step 4 (**4. Materials Consumed**) or click **Edit** on any existing PU voucher.
2. Alongside **Qty Used (Installed)**, enter the **Wastage Qty** for each material.
3. The form calculates **Total Deduct = Used + Wastage** in real time, checks that total deduction does not exceed **Team In-Hand** stock, and automatically updates **Team In-Hand Stock** (**Used** & **Wastage** columns + CSV), **Reconciliation**, **Site Branch Stock**, and printable **PU Vouchers**.

**Part 2 \u2014 Viewing "Full Report for This Site (Project)" (All Teams Consolidated):**
1. Open **Material Usage / Daily Progress Entry -> Usage Vouchers History** tab.
2. Filter/select a **Project / Site** from the project selector \u2014 a project summary bar appears with the **Full Report for This Site (Project)** button.
3. The report shows:
   \u2022 **Part 1 \u2014 Team-by-Team Breakdown & Subtotals:** Every team's voucher details, Installed Qty, Wastage Qty, Total Consumed, and **individual Team Subtotal**.
   \u2022 **Part 2 \u2014 Full Site Consolidated Grand Total:** Combined totals across all teams working on that project.
4. Click **Print / Save PDF** or **Export Excel / CSV** anytime.`,
    answerSi: () => `**Wastage Qty (\u0D85\u0DB4\u0DAD\u0DDA \u0DBA\u0DCF\u0DB8\u0DCA) \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DC4 "Full Report for This Site (Project)" \u0DBD\u0DB6\u0DCF\u0D9C\u0DB1\u0DCA\u0DB1\u0DCF \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

**1 \u0DC0\u0DB1 \u0D9A\u0DDC\u0DA7\u0DC3 \u2014 Wastage Qty \u0DC3\u0DA7\u0DC4\u0DB1\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DC4 \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA \u0D9C\u0DAB\u0DB1\u0DBA:**
1. **"Material Usage / Daily Progress Entry"** \u0DC4\u0DD2 4 \u0DC0\u0DB1 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB\u0DDA\u0DAF\u0DD3 (\u0DC4\u0DDD \u0DB4\u0DD0\u0DBB\u0DAB\u0DD2 PU \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DBA\u0D9A\u0DCA **Edit** \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3) \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA \u0DC3\u0DB3\u0DC4\u0DCF **Qty Used** \u0DB8\u0DD9\u0DB1\u0DCA\u0DB8 **Wastage Qty** \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
2. \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA **Used + Wastage = Total Deduct** \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA Team In-Hand \u0DAD\u0DDC\u0D9C\u0DBA \u0DC3\u0DB8\u0D9F \u0DC3\u0DA2\u0DD3\u0DC0\u0DD3\u0DC0 \u0DB4\u0DBB\u0DD3\u0D9A\u0DCA\u0DC2\u0DCF \u0D9A\u0DBB\u0DB1 \u0D85\u0DAD\u0DBB **Team In-Hand Stock** (Used \u0DC3\u0DC4 Wastage \u0DAD\u0DD3\u0DBB\u0DD4), **Reconciliation**, **Site Stock** \u0DC3\u0DC4 **PU \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DCA** \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 \u0DB1\u0DD2\u0DC0\u0DD0\u0DBB\u0DAF\u0DD2\u0DC0 \u0DBA\u0DCF\u0DC0\u0DAD\u0DCA\u0D9A\u0DCF\u0DBD\u0DD3\u0DB1 \u0D9A\u0DBB\u0DBA\u0DD2.

**2 \u0DC0\u0DB1 \u0D9A\u0DDC\u0DA7\u0DC3 \u2014 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 Teams \u0DC3\u0DB3\u0DC4\u0DCF "Full Report for This Site (Project)" \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0DB6\u0DD0\u0DBD\u0DD3\u0DB8:**
1. **"Material Usage / Daily Progress Entry -> Usage Vouchers History"** \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A\u0DA7 \u0DBA\u0DB1\u0DCA\u0DB1.
2. \u0D85\u0DAF\u0DCF\u0DC5 **Project / Site** \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DCF **"Full Report for This Site (Project)"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
3. \u0D91\u0DC4\u0DD2\u0DAF\u0DD3 \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0D9A\u0DDC\u0DA7\u0DC3\u0DCA 2\u0D9A\u0DD2\u0DB1\u0DCA \u0DBD\u0DD0\u0DB6\u0DDA:
   \u2022 **Part 1 (Team-by-Team Breakdown):** \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Team \u0D91\u0D9A \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD \u0D9A\u0DC5 \u0DC3\u0DC4 Wastage \u0D9A\u0DC5 \u0DB6\u0DA9\u0DD4 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA\u0DB1\u0DCA + **\u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Team \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 Total \u0D91\u0D9A (Team Subtotal)**.
   \u2022 **Part 2 (Full Site Consolidated Grand Total):** \u0D91\u0DB8 Project \u0D91\u0D9A\u0DA7 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 Teams \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DC0\u0DD0\u0DBA \u0D9A\u0DC5 **\u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DB8\u0DD4\u0DC5\u0DD4 \u0D91\u0D9A\u0DAD\u0DD4\u0DC0 (Grand Total)**.
4. \u0D89\u0DC4\u0DC5\u0DD2\u0DB1\u0DCA \u0D87\u0DAD\u0DD2 **Print / Save PDF** \u0DC4\u0DDD **Export Excel / CSV** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0DB6\u0DCF\u0D9C\u0DAD \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.`
  },
  {
    id: "site-transfer",
    suggestedTab: "requests",
    keywords: ["transfer", "request", "requisition", "dispatch", "branch yard", "send stock", "yawanne", "illanne"],
    phrases: [
      "request and transfer",
      "transfer stock",
      "main warehouse to a branch",
      "stock request",
      "stock requisitions",
      "new stock requirement",
      "site ekata badu",
      "branch ekata badu"
    ],
    answerEn: (ctx) => `**How to Request & Transfer Stock (Normal Stock vs. Assigned/ALL AREAS Client FOC) from Main Warehouse to a Branch Yard:**

1. **Open Stock Requisitions:** Go to **Stock Requisitions** from the left sidebar and click **+ New Stock Requirement Form**.
2. **Select Requesting Site Branch & Choose Request Tab:**
   \u2022 **Tab 1 \u2014 1. Normal Stock Request:** Request regular warehouse stock. Low-stock items at your site automatically appear at the top with a **\u26A0\uFE0F Site Low** badge and live **Site Avl:** + **Main:** balances.
   \u2022 **Tab 2 \u2014 2. Client Free Stock for Assigned Project Request:** Shows Major/Main Projects and Individual Projects assigned to your selected Site Branch **PLUS any "\u{1F310} ALL AREAS (All Site Branches)" projects** so island-wide FOC stock can be requested by any site.
3. **Approve, Dispatch & "Central FOC" Badge in Site Branch Stock:** Once approved by HQ and confirmed at the site, FOC transfers carry a distinct **\u{1F381} Central FOC** badge & color highlight inside **Site Branch Stock** so branch teams always know which items belong to Central Client FOC.${ctx.pendingRequestsCount ? `

\u{1F4CC} *Live Status:* **${ctx.pendingRequestsCount} pending stock request(s)** waiting for action.` : ""}`,
    answerSi: (ctx) => `**Main Warehouse \u0DC3\u0DD2\u0DA7 Branch / Site \u0D91\u0D9A\u0D9A\u0DA7 \u0DB6\u0DA9\u0DD4 Request \u0D9A\u0DBB Transfer \u0D9A\u0DBB\u0D9C\u0DB1\u0DCA\u0DB1\u0DCF \u0D86\u0D9A\u0DCF\u0DBB\u0DBA (Normal Stock \u0DC3\u0DC4 Assigned / ALL AREAS FOC):**

1. **"Stock Requisitions"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA **"+ New Stock Requirement Form"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB **"Requesting Site Branch *"** \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
2. **\u0DA7\u0DD0\u0DB6\u0DCA \u0DAF\u0DD9\u0D9A\u0DD9\u0DB1\u0DCA \u0D85\u0DAF\u0DCF\u0DC5 \u0DC0\u0DBB\u0DCA\u0D9C\u0DBA \u0DAD\u0DDA\u0DBB\u0DD3\u0DB8:**
   \u2022 **1. Normal Stock Request:** \u0DC3\u0DCF\u0DB8\u0DCF\u0DB1\u0DCA\u200D\u0DBA \u0D9C\u0DB6\u0DA9\u0DCF \u0DAD\u0DDC\u0D9C \u0D89\u0DBD\u0DCA\u0DBD\u0DD4\u0DB8\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 (**"\u26A0\uFE0F Site Low"** \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D8B\u0DA9\u0DD2\u0DB1\u0DCA\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2).
   \u2022 **2. Client Free Stock for Assigned Project Request:** \u0DAD\u0DDD\u0DBB\u0DCF\u0D9C\u0DAD\u0DCA Site Branch \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 Projects \u0DB8\u0DD9\u0DB1\u0DCA\u0DB8 **"\u{1F310} ALL AREAS (All Site Branches)"** \u0DBD\u0DD9\u0DC3 \u0DC3\u0DD1\u0DAF\u0DD6 \u0DB4\u0DDC\u0DAF\u0DD4 Projects \u0DAF \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1 \u0DB6\u0DD0\u0DC0\u0DD2\u0DB1\u0DCA \u0D95\u0DB1\u0DD1\u0DB8 Site \u0D91\u0D9A\u0D9A\u0DA7 \u0D91\u0DB8 FOC \u0DB6\u0DA9\u0DD4 Request \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
3. **Site Branch Stock \u0DC4\u0DD2 "Central FOC" \u0DBD\u0DD9\u0DC3 \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DBB \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DD3\u0DB8:** Approve \u0DC0\u0DD3 Site \u0D91\u0D9A\u0DA7 \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 \u0DB4\u0DC3\u0DD4 **"Site Branch Stock"** \u0DAD\u0DD4\u0DC5 Central FOC \u0DC0\u0DD9\u0DAD\u0DD2\u0DB1\u0DCA \u0D86 \u0DB6\u0DA9\u0DD4 **"\u{1F381} Central FOC"** Badge/Tag \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0DC4 \u0DC0\u0DBB\u0DCA\u0DAB Highlight \u0D91\u0D9A\u0D9A\u0DD2\u0DB1\u0DCA \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DBB \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2.${ctx.pendingRequestsCount ? `

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA Pending Requests **${ctx.pendingRequestsCount}\u0D9A\u0DCA** \u0D87\u0DAD.*` : ""}`
  },
  {
    id: "main-stock-grn",
    suggestedTab: "main-stock",
    keywords: ["grn", "main stock", "main central stock", "central warehouse", "receive stock", "add stock", "damaged restoration"],
    phrases: [
      "add main stock",
      "add new stock",
      "create grn",
      "restore damaged stock",
      "main stock ekata",
      "badu danne kohomada"
    ],
    answerEn: () => `**How to Manage Main Central Stock, GRN Entries & Damaged Stock Restoration:**

1. **Open Main Central Stock:** Click **Main Central Stock** in the left sidebar.
2. **Add Stock (GRN):** Click **+ Add Stock (GRN)**, choose **Purchase** or **Manual Entry**, enter Supplier / Invoice details, select items and quantities, and save.
3. **Direct Site Transfer:** Transfer stock directly from the Central Warehouse to any Site Branch Yard.
4. **Damaged Stock Restoration:** View damaged items returned from teams/branches and use **Restore Damaged Stock to Main** once items are repaired and ready for reuse.`,
    answerSi: () => `**\u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9C\u0DB6\u0DA9\u0DCF\u0DC0\u0DA7 (Main Central Stock) \u0DB6\u0DA9\u0DD4 (GRN) \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DC4 Damaged Stock \u0D9A\u0DC5\u0DB8\u0DB1\u0DCF\u0D9A\u0DBB\u0DAB\u0DBA:**

1. \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Main Central Stock"** \u0DB4\u0DD2\u0DA7\u0DD4\u0DC0\u0DA7 \u0DBA\u0DB1\u0DCA\u0DB1.
2. **\u0D85\u0DBD\u0DD4\u0DAD\u0DCA \u0DB6\u0DA9\u0DD4 \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7:** **"+ Add Stock (GRN)"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB Supplier \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB, Invoice \u0D85\u0D82\u0D9A\u0DBA \u0DC3\u0DC4 Items \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA\u0DB1\u0DCA \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB Save \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
3. **Direct Transfer:** Request \u0D91\u0D9A\u0D9A\u0DCA \u0DB1\u0DDC\u0DB8\u0DD0\u0DAD\u0DD2\u0DC0 \u0D9A\u0DD9\u0DBD\u0DD2\u0DB1\u0DCA\u0DB8 Branch \u0D91\u0D9A\u0D9A\u0DA7 \u0DB6\u0DA9\u0DD4 \u0DBA\u0DD0\u0DC0\u0DD3\u0DB8\u0DA7 Direct Transfer \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
4. **Damaged Stock Restoration:** \u0D85\u0DBD\u0DD4\u0DAD\u0DCA\u0DC0\u0DD0\u0DA9\u0DD2\u0DBA\u0DCF \u0D9A\u0DC5 Damaged \u0DB6\u0DA9\u0DD4 \u0DB1\u0DD0\u0DC0\u0DAD \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0DAD\u0DDC\u0D9C\u0DBA\u0DA7 \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 Damaged Stock \u0D9A\u0DDC\u0DA7\u0DC3 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.`
  },
  {
    id: "issue-to-teams",
    suggestedTab: "dispatch",
    keywords: ["issue", "dispatch", "field team", "squad", "gate pass", "team in-hand", "hand over"],
    phrases: [
      "issue items to a team",
      "issue materials",
      "issue to teams",
      "team in-hand stock",
      "team ekakata badu",
      "team ekata issue"
    ],
    answerEn: (ctx) => `**How to Issue Materials to Field Teams & Track Site-Separated Team In-Hand Custody:**

1. **Check Branch Inventory:** Ensure the required items have available stock (> 0) in **Site Branch Stock**.
2. **Open Issue to Teams:** Click **Issue to Teams** in the left sidebar.
3. **Select Branch & Team:** Choose the **Branch Yard** and the **Field Team** receiving the items.
4. **Select Items & Print Gate Pass:** Pick the items and quantities, click **Issue Material to Team**, and print the official **Gate Pass / Issue Voucher** (with optional **"Print with Image"** thumbnail toggle).
5. **Site-Separated Team In-Hand Stock:** Open **Team In-Hand Stock** to monitor the live balance held by each team. For transferred teams, stock is **never summed across sites**: unreturned items from a previous site appear separately under **"Stock to Return - [Previous Site Name]"** (and cannot be used on the new site), while current-site items appear under **"[Current Site Name] \u2014 Active Site Stock"**.${ctx.activeTeamsCount ? `

\u{1F4CC} *Currently **${ctx.activeTeamsCount} active field team(s)** are registered.*` : ""}`,
    answerSi: (ctx) => `**Branch \u0D91\u0D9A\u0DDA \u0DC3\u0DD2\u0DA7 Field Team \u0D91\u0D9A\u0D9A\u0DA7 \u0DB6\u0DA9\u0DD4 \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 (Issue to Teams) \u0DC3\u0DC4 Site \u0D85\u0DB1\u0DD4\u0DC0 \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DC5 Team In-Hand \u0DB6\u0DD0\u0DBD\u0DD3\u0DB8:**

1. \u0DB4\u0DC5\u0DB8\u0DD4\u0DC0 \u0D85\u0DAF\u0DCF\u0DC5 Branch \u0D91\u0D9A\u0DDA (**Site Branch Stock**) \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0DB6\u0DA9\u0DD4 \u0DAD\u0DDC\u0D9C\u0DBA \u0DAD\u0DD2\u0DB6\u0DD2\u0DBA \u0DBA\u0DD4\u0DAD\u0DD4\u0DBA.
2. \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Issue to Teams"** \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
3. \u0DB6\u0DA9\u0DD4 \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DBB\u0DB1 **Branch Yard \u0D91\u0D9A** \u0DC3\u0DC4 **Field Team \u0D91\u0D9A** \u0DAD\u0DDD\u0DBB\u0DCF, Items \u0DC3\u0DC4 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA\u0DB1\u0DCA \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB **"Issue Material to Team"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
4. **Site \u0D85\u0DB1\u0DD4\u0DC0 \u0DC0\u0DD9\u0DB1\u0DCA \u0DC0\u0DD6 Team In-Hand Stock:** **"Team In-Hand Stock"** \u0DB4\u0DD2\u0DA7\u0DD4\u0DC0\u0DDA\u0DAF\u0DD3 Transfer \u0D9A\u0DBB\u0DB4\u0DD4 Team \u0DC0\u0DBD \u0DB6\u0DA9\u0DD4 \u0D94\u0D9A\u0DCA\u0D9A\u0DDC\u0DB8 \u0D91\u0D9A\u0DA7 \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1\u0DCA\u0DB1\u0DDA \u0DB1\u0DD0\u0DAD. \u0D9A\u0DBD\u0DD2\u0DB1\u0DCA \u0DC4\u0DD2\u0DA7\u0DB4\u0DD4 Site \u0D91\u0D9A\u0DA7 \u0DB7\u0DCF\u0DBB \u0DB1\u0DDC\u0DAF\u0DD4\u0DB1\u0DCA \u0DB6\u0DA9\u0DD4 **"Stock to Return - [\u0DB4\u0DBB\u0DAB Site \u0DB1\u0DB8]"** \u0DBA\u0DA7\u0DAD\u0DDA \u0DC0\u0DD9\u0DB1\u0DB8\u0DAD\u0DCA, \u0D85\u0DBD\u0DD4\u0DAD\u0DD2\u0DB1\u0DCA \u0D9C\u0DD2\u0DBA Site \u0D91\u0D9A\u0DDA \u0DB6\u0DA9\u0DD4 \u0D91\u0DB8 \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Site \u0D91\u0D9A\u0DDA \u0DB1\u0DB8 \u0DBA\u0DA7\u0DAD\u0DDA\u0DAD\u0DCA \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2.${ctx.activeTeamsCount ? `

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DC3\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Teams **${ctx.activeTeamsCount}\u0D9A\u0DCA** \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DBB \u0D87\u0DAD.*` : ""}`
  },
  {
    id: "returns",
    suggestedTab: "returns",
    keywords: ["return", "unused", "damaged", "surplus", "hand back", "branch return", "team return", "ithiri", "multiple items", "batch return", "eka sare"],
    phrases: [
      "return unused stock",
      "team returns",
      "branch returns",
      "return materials",
      "badu return karanne",
      "multiple items return",
      "godak item add karala",
      "eka sare return"
    ],
    answerEn: () => `**How to Return Multiple Items at Once in Team Returns (RV) & Branch Returns (BRM):**

\u2022 **Option A \u2014 Multi-Item Team Returns to Branch Yard ("Team Returns"):**
  1. Open **Team Returns** from the sidebar.
  2. Select the **Receiving Site Branch** and the **Field Team** (for transferred teams, selecting the previous site loads their **"Stock to Return - [Previous Site Name]"** items; selecting their current site loads their active site stock).
  3. Click **+ Add Item** to add as many item rows as needed (or click **+ Add All Held** to load all held items at once, or scan barcodes).
  4. For each row, enter the **Quantity to Return** (or click **Max**) and select its **Condition** (**Good** restores usable Site Branch Stock; **Damaged** logs into the Damaged Stock ledger).
  5. Click **Process Return** \u2014 all items are returned together in one submission under a single shared **Return Voucher (RV-2026-XXXX)** which you can print (with optional **Print with Image**).

\u2022 **Option B \u2014 Multi-Item Branch Return to Central Main Warehouse ("Branch Returns"):**
  1. Open **Branch Returns** from the sidebar and select your **Returning Site Branch**.
  2. Click **+ Add Item**, click **+ Add All Available**, or click any item card in the right-hand inventory panel to add multiple items to your return list.
  3. Set the quantity and condition (**Good** or **Damaged**) for each row and submit to generate a single multi-item **Branch Return Voucher (BRM-2026-XXXX)**.`,
    answerSi: () => `**Team Returns \u0DC3\u0DC4 Branch Returns \u0DAF\u0DD9\u0D9A\u0DDA\u0DB8 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D9C\u0DAB\u0DB1\u0DCF\u0DC0\u0D9A\u0DCA \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB \u0D91\u0D9A \u0DC3\u0DD0\u0DBB\u0DDA Return \u0D9A\u0DBB\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA (Multi-Item Batch Returns):**

\u2022 **1. Team \u0D91\u0D9A\u0D9A \u0DC3\u0DD2\u0DA7 Branch \u0D91\u0D9A\u0DA7 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D9A\u0DD2\u0DC4\u0DD2\u0DB4\u0DBA\u0D9A\u0DCA \u0D91\u0D9A\u0DC0\u0DBB Return \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 ("Team Returns"):**
  - \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Team Returns"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA \u0D85\u0DAF\u0DCF\u0DC5 **Receiving Site Branch** \u0D91\u0D9A \u0DC3\u0DC4 **Field Team** \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1 (Transfer \u0D9A\u0DC5 Team \u0D91\u0D9A\u0D9A\u0DCA \u0DB1\u0DB8\u0DCA \u0DB4\u0DBB\u0DAB Site \u0D91\u0D9A \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 \u0D91\u0DB8 \u0DB4\u0DBB\u0DAB Site \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 **"Stock to Return - [Site Name]"** \u0DB6\u0DA9\u0DD4 \u0DBD\u0DD0\u0DBA\u0DD2\u0DC3\u0DCA\u0DAD\u0DD4\u0DC0 \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2).
  - \u0D91\u0D9A \u0DC0\u0DBB\u0D9A\u0DA7 \u0D91\u0D9A Item \u0D91\u0D9A\u0D9A\u0DCA \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA \u0DB1\u0DDC\u0DC0, **"+ Add Item"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0DAD\u0DBB\u0DB8\u0DCA Items \u0DB4\u0DDA\u0DC5\u0DD2 \u0D9C\u0DAB\u0DB1\u0DCF\u0DC0\u0D9A\u0DCA \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (\u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA **"+ Add All Held"** \u0D91\u0DB6\u0DD3\u0DB8\u0DD9\u0DB1\u0DCA Team \u0D91\u0D9A \u0D85\u0DAD\u0DDA \u0D87\u0DAD\u0DD2 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 \u0DB6\u0DA9\u0DD4 \u0D91\u0D9A\u0DC0\u0DBB \u0DBD\u0DD0\u0DBA\u0DD2\u0DC3\u0DCA\u0DAD\u0DD4\u0DC0\u0DA7 \u0D9C\u0DAD \u0DC4\u0DD0\u0D9A).
  - \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Item \u0D91\u0D9A\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA (**Max** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0D9C\u0DAB\u0DB1\u0DB8 \u0D9C\u0DAD \u0DC4\u0DD0\u0D9A) \u0DC3\u0DC4 \u0DAD\u0DAD\u0DCA\u0DAD\u0DCA\u0DC0\u0DBA (**Good** \u0DC4\u0DDD **Damaged**) \u0DAD\u0DDD\u0DBB\u0DCF Submit \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1. \u0D91\u0DB8 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0DAD\u0DB1\u0DD2 **Return Voucher (RV)** \u0D91\u0D9A\u0D9A\u0DD2\u0DB1\u0DCA \u0D91\u0D9A \u0DC3\u0DD0\u0DBB\u0DDA Return \u0DC0\u0DD3 Print \u0D9A\u0DBB\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A.

\u2022 **2. Branch \u0D91\u0D9A\u0D9A \u0DC3\u0DD2\u0DA7 \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9C\u0DB6\u0DA9\u0DCF\u0DC0\u0DA7 (Main Stock) \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D9A\u0DD2\u0DC4\u0DD2\u0DB4\u0DBA\u0D9A\u0DCA \u0D91\u0D9A\u0DC0\u0DBB Return \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 ("Branch Returns"):**
  - \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Branch Returns"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA Branch \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1.
  - **"+ Add Item"** \u0DC4\u0DDD **"+ Add All Available"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA (\u0DC4\u0DDD \u0DAF\u0D9A\u0DD4\u0DAB\u0DD4 \u0DB4\u0DC3 \u0D87\u0DAD\u0DD2 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0DBD\u0DD0\u0DBA\u0DD2\u0DC3\u0DCA\u0DAD\u0DD4\u0DC0 \u0DB8\u0DAD \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DD9\u0DB1\u0DCA) Items \u0D9C\u0DAB\u0DB1\u0DCF\u0DC0\u0D9A\u0DCA \u0D91\u0D9A\u0DC0\u0DBB \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DBB \u0DAD\u0DB1\u0DD2 **BRM Return Voucher** \u0D91\u0D9A\u0D9A\u0DD2\u0DB1\u0DCA \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9C\u0DB6\u0DA9\u0DCF\u0DC0 (HQ) \u0DC0\u0DD9\u0DAD \u0D91\u0D9A \u0DC3\u0DD0\u0DBB\u0DDA \u0DBA\u0DD0\u0DC0\u0DD2\u0DBA \u0DC4\u0DD0\u0D9A.`
  },
  {
    id: "procurement-po",
    suggestedTab: "procurement",
    keywords: ["procurement", "supplier", "purchase order", "po", "debit note", "rtv", "settlement", "vendor"],
    phrases: [
      "create purchase order",
      "supplier orders",
      "supplier return",
      "debit note",
      "supplier po"
    ],
    answerEn: () => `**How to Manage Supplier Orders (PO), GRN Batches, Supplier Returns (RTV) & Debit Notes:**

1. **Create a Purchase Order:** Open **Supplier Orders (PO)** and click **+ New Purchase Order**. Select the supplier, items, and unit prices.
2. **Full or Partial Multi-Item GRN Receipt:** When goods arrive, click **Receive GRN** on the PO to atomically receive all full or partial batch quantities directly into **Main Central Stock**.
3. **Supplier Returns (RTV) & Debit Notes:** For defective or damaged deliveries, create a **Supplier Return**, dispatch with Gate Pass & vehicle details, print an official **Debit Note**, and record supplier settlement (Replacement, Credit Note, or Refund).`,
    answerSi: () => `**Supplier Orders (PO), Supplier Returns \u0DC3\u0DC4 Debit Notes \u0D9A\u0DC5\u0DB8\u0DB1\u0DCF\u0D9A\u0DBB\u0DAB\u0DBA:**

1. **Purchase Order \u0DC3\u0DD1\u0DAF\u0DD3\u0DB8:** \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Supplier Orders (PO)"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA \u0D85\u0DBD\u0DD4\u0DAD\u0DCA PO \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0DCF\u0DAF\u0DB1\u0DCA\u0DB1.
2. **PO \u0D91\u0D9A\u0DA7 \u0DB6\u0DA9\u0DD4 \u0DB7\u0DCF\u0DBB\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8 (Full / Partial GRN):** Supplier \u0DB6\u0DA9\u0DD4 \u0D91\u0DC0\u0DD6 \u0DB4\u0DC3\u0DD4 **"Receive GRN"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D9A\u0DD2\u0DC4\u0DD2\u0DB4\u0DBA\u0D9A\u0DCA \u0DC0\u0DD4\u0DC0\u0DAF \u0D91\u0D9A\u0DC0\u0DBB \u0DC4\u0DDD \u0D9A\u0DDC\u0DA7\u0DC3\u0DCA \u0DC0\u0DC1\u0DBA\u0DD9\u0DB1\u0DCA Main Central Stock \u0D91\u0D9A\u0DA7 \u0DB1\u0DD2\u0DC0\u0DD0\u0DBB\u0DAF\u0DD2\u0DC0 \u0DB7\u0DCF\u0DBB\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A.
3. **Supplier Return & Debit Note:** \u0DC4\u0DCF\u0DB1\u0DD2 \u0DC0\u0DD6 \u0DB6\u0DA9\u0DD4 \u0DB1\u0DD0\u0DC0\u0DAD Supplier \u0DC0\u0DD9\u0DAD \u0DBA\u0DD0\u0DC0\u0DD3\u0DB8\u0DA7, Gate Pass \u0DC3\u0DC4 **Debit Note** \u0DB8\u0DD4\u0DAF\u0DCA\u200D\u0DBB\u0DAB\u0DBA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 \u0DC3\u0DC4 Settlement \u0DC3\u0DA7\u0DC4\u0DB1\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 Supplier Return \u0DB4\u0DC4\u0DC3\u0DD4\u0D9A\u0DB8 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.`
  },
  {
    id: "client-foc",
    suggestedTab: "client-free-stock",
    keywords: [
      "client free",
      "foc",
      "free issue",
      "customer supplied",
      "principal",
      "client stock",
      "free stock",
      "allocated site branch",
      "reassign",
      "edit foc",
      "waradila",
      "central foc",
      "returnable",
      "all areas"
    ],
    phrases: [
      "client free stock",
      "free of charge",
      "client material",
      "under main project",
      "wrong project foc",
      "correct foc",
      "foc waradila",
      "central foc",
      "free stock report"
    ],
    answerEn: () => `**How Client Free Stock (FOC) 5-Stage Reconciliation, Central FOC Badges & Project Reports Work:**

1. **Log Client FOC (+ Log Client Free Stock):** Select **\u{1F3E2} Under Main Project** (including **Main Project for New Connections**) or **\u{1F4C4} Individual Project**. Physical stock enters **Main Central Warehouse**, while **Allocated Site Branch** automatically locks to the project's branch \u2014 or choose **\u{1F310} ALL AREAS** so any branch can draw from it.
2. **Standard 5-Stage FOC Reconciliation Order:** Every summary & report follows:
   \u2022 **1. Initial FOC Receipt at Central** -> **2. Site Issue** -> **3. Team Issue** -> **4. Usage & Wastage** -> **5. Balance / Returnable Stock on Project Completion**.
3. **Site Branch Stock "Central FOC" Badge:** Inside **Site Branch Stock**, stock sourced from Central FOC displays a highlighted **\u{1F381} Central FOC** tag and keeps the same 5-stage sequence.
4. **Color-Coded Main/Sub-Project Cards & Central Printable Reports:** Color-coded Main Project cards show each Sub-Project (**KT-RGL-0505**, **KT-ABK-0506**) below with a consolidated completion balance at the end. In Central Stock / Client Free Stock, generate A4/PDF reports **per individual issued item** OR as **one full project report**, and Admins can reassign mis-logged FOC vouchers anytime.`,
    answerSi: () => `**Client Free Stock (FOC) \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 5 Reconciliation Flow, "Central FOC" Badge \u0DC3\u0DC4 \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF \u0D9A\u0DCA\u200D\u0DBB\u0DD2\u0DBA\u0DCF\u0DAD\u0DCA\u0DB8\u0D9A \u0DC0\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

1. **Client FOC \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 (+ Log Client Free Stock):** Project \u0D91\u0D9A \u0DAD\u0DDA\u0DBB\u0DD6 \u0DC0\u0DD2\u0DA7 **Allocated Site Branch** \u0D91\u0D9A \u0D91\u0DB8 Project \u0D91\u0D9A\u0DDA \u0DC1\u0DCF\u0D9B\u0DCF\u0DC0\u0DA7 Lock \u0DC0\u0DDA \u2014 \u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA **\u{1F310} ALL AREAS** \u0DBD\u0DD9\u0DC3 \u0D87\u0DAD\u0DD2 Project \u0DC0\u0DBD \u0DB6\u0DA9\u0DD4 **\u0D95\u0DB1\u0DD1\u0DB8 Site \u0D91\u0D9A\u0D9A\u0DA7** \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
2. **\u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2 \u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 5 Reconciliation \u0DB4\u0DD2\u0DC5\u0DD2\u0DC0\u0DD9\u0DC5:**
   \u2022 **(1) Central Stock FOC \u0DBD\u0DD0\u0DB6\u0DD3\u0DB8** -> **(2) Site Issue** -> **(3) Team Issue** -> **(4) Usage & Wastage** -> **(5) Project Completion \u0DB4\u0DC3\u0DD4 Client \u0DC0\u0DD9\u0DAD \u0D86\u0DB4\u0DC3\u0DD4 \u0DB7\u0DCF\u0DBB \u0DAF\u0DD2\u0DBA \u0DC4\u0DD0\u0D9A\u0DD2 \u0D89\u0DAD\u0DD2\u0DBB\u0DD2\u0DBA (Balance / Returnable)**.
3. **Site Branch Stock \u0DC4\u0DD2 "Central FOC" \u0DC4\u0DB3\u0DD4\u0DB1\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8:** Site Branch Stock \u0DAD\u0DD4\u0DC5 Central FOC \u0DC0\u0DD9\u0DAD\u0DD2\u0DB1\u0DCA \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 **"\u{1F381} Central FOC"** Badge/Tag \u0D91\u0D9A\u0D9A\u0DCA \u0DC3\u0DC4 \u0DC0\u0DBB\u0DCA\u0DAB Highlight \u0D91\u0D9A\u0D9A\u0DD2\u0DB1\u0DCA \u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2\u0DC0 \u0DC0\u0DD9\u0DB1\u0DCA \u0D9A\u0DBB \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2.
4. **\u0DC0\u0DBB\u0DCA\u0DAB \u0D9C\u0DD0\u0DB1\u0DCA\u0DC0\u0DD6 Main/Sub-Project Cards \u0DC3\u0DC4 Central Reports:** \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0DC0\u0DBB\u0DCA\u0DAB Cards \u0DBA\u0DA7\u0DAD\u0DDA \u0DC3\u0DD1\u0DB8 Sub-Project \u0D91\u0D9A\u0D9A\u0DB8 Flow \u0D91\u0D9A \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DCF \u0D85\u0DC0\u0DC3\u0DCF\u0DB1\u0DBA\u0DDA \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB Client Balance \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0DBD\u0DB6\u0DCF\u0DAF\u0DD9\u0DBA\u0DD2. Central Stock \u0DC4\u0DBB\u0DC4\u0DCF **\u0DC3\u0DD1\u0DB8 Item \u0D91\u0D9A\u0D9A\u0DA7\u0DB8 \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 Report** \u0DB8\u0DD9\u0DB1\u0DCA\u0DB8 **Project \u0D91\u0D9A\u0DDA \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4 Items \u0D91\u0D9A\u0DA7 \u0D9C\u0DAD\u0DCA Report** \u0D91\u0D9A\u0D9A\u0DCA\u0DAF Print/PDF \u0D9A\u0DBB\u0D9C\u0DAD \u0DC4\u0DD0\u0D9A. \u0DC0\u0DD0\u0DBB\u0DAF\u0DD2 Project \u0D91\u0D9A\u0D9A\u0DA7 \u0DC0\u0DD0\u0DA7\u0DD4\u0DAB\u0DD4 FOC \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB Admin \u0DC4\u0DA7 Edit \u0D9A\u0DBB \u0DB8\u0DCF\u0DBB\u0DD4 \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.`
  },
  {
    id: "items-barcodes-machinery",
    suggestedTab: "items",
    keywords: ["barcode", "qr", "scanner", "usb scanner", "camera scan", "machinery", "plant", "equipment", "excel import", "item catalog", "scan now", "image", "photo", "200kb", "print with image"],
    phrases: [
      "item catalog",
      "plant & equipment",
      "print barcode",
      "barcode scanner",
      "import items excel",
      "scan now",
      "item image",
      "print with image",
      "200kb"
    ],
    answerEn: (ctx) => `**Item Catalog, Auto-Compressed Item Photos (<200KB) in PO & Return Dropdowns, "Print with Image" & Single-Shot Scanner:**

\u2022 **Item Catalog & Plant/Equipment:** Open **Item Catalog** or **Plant & Equipment** (sequential **ITM-0001** / **MCH-0001** codes).
\u2022 **Item Photos (<200KB) Across Dropdowns & "Print with Image":** Attach an optional Item Photo (auto-compressed under 200KB). Item thumbnails automatically display inside dropdown lists when creating **Purchase Orders (PO)**, **Stock Requisitions (RN)**, **Team Returns (RV)**, and **Branch Returns (BRM)**, and vouchers include a **"Print with Image"** toggle.
\u2022 **Excel Bulk Import / Export:** Import via **Sync**, **Append Only**, or **Replace** modes.
\u2022 **Single-Shot Barcode Scanner ("Scan Now"):** Detects once and auto-hides the camera to prevent duplicate scans.

\u{1F4CC} *Current Catalog:* **${ctx.activeItemsCount ?? 0}** active items (**${ctx.lowStockItemsCount ?? 0}** low-stock alerts).`,
    answerSi: (ctx) => `**Item Catalog, PO \u0DC4\u0DCF Return Dropdown \u0DC0\u0DBD \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DB1 Item Images (<200KB), "Print with Image" \u0DC3\u0DC4 Single-Shot Scanner:**

\u2022 **Item Catalog & Plant/Equipment:** 0001 \u0DC3\u0DD2\u0DA7 \u0D85\u0D82\u0D9A\u0DB1\u0DBA \u0DC0\u0DB1 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0DC3\u0DC4 \u0DBA\u0DB1\u0DCA\u0DAD\u0DCA\u200D\u0DBB\u0DDD\u0DB4\u0D9A\u0DBB\u0DAB.
\u2022 **Dropdown \u0DC0\u0DBD Item Photo \u0DC3\u0DC4 "Print with Image":** \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA\u0D9A\u0DA7 Photo \u0D91\u0D9A\u0D9A\u0DCA \u0D91\u0D9A\u0DCA \u0D9A\u0DC5 \u0DC0\u0DD2\u0DA7 (200KB \u0DA7 \u0D85\u0DA9\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA Auto-Compress \u0DC0\u0DDA) **Purchase Orders (PO)**, **Requisitions (RN)**, **Team Returns (RV)** \u0DC3\u0DC4 **Branch Returns (BRM)** \u0DAF\u0DB8\u0DB1 Dropdown \u0DBD\u0DD0\u0DBA\u0DD2\u0DC3\u0DCA\u0DAD\u0DD4 \u0DAD\u0DD4\u0DC5\u0DAF \u0D91\u0DB8 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA\u0DDA \u0DBB\u0DD6\u0DB4\u0DBA \u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DBA\u0DD2. Print \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 **"Print with Image"** \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
\u2022 **Single-Shot Barcode Scanner ("Scan Now"):** \u0D91\u0D9A \u0DC0\u0DBB\u0D9A\u0DCA Detect \u0DC0\u0DD6 \u0DC3\u0DD0\u0DAB\u0DD2\u0DB1\u0DCA Camera \u0D91\u0D9A \u0D89\u0DB6\u0DDA\u0DB8 \u0DB1\u0DAD\u0DBB \u0DC0\u0DDA.

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA:* \u0DC3\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Items **${ctx.activeItemsCount ?? 0}**\u0D9A\u0DCA \u0D87\u0DAD.`
  },
  {
    id: "registrations-setup",
    suggestedTab: "registrations",
    keywords: ["register", "master setup", "master registrations", "new branch", "new site", "new team", "crew member", "team member"],
    phrases: [
      "how to register",
      "master registrations",
      "register a branch",
      "register a team",
      "add team members",
      "site ekak hadanne",
      "team ekak hadanne"
    ],
    answerEn: (ctx) => `**How to Register Items, Branches, Field Teams, Suppliers, Clients & Users (Master Registrations):**

Open **Master Registrations** from the left sidebar and select the tab you need:
\u2022 **Items:** Register Materials or Machinery with Item Code, Unit, Unit Price, Low-Stock Threshold, and optional Project Reservation.
\u2022 **Sites / Branches:** Add Branch Yards, location/contact details, and link a designated Branch Supervisor.
\u2022 **Field Teams:** Register squads with Team Name, Team Leader Name & NIC, Assigned Site Base, and individual **Team Members** (Name, NIC/ID, Role, Phone).
\u2022 **Suppliers & Clients:** Maintain master directories for Procurement POs and Client FOC stock.
\u2022 **Users:** Create staff accounts, assign Roles, and link one or more Branches.

\u{1F4CC} *Workspace Summary:* **${ctx.activeItemsCount ?? 0}** Items \xB7 **${ctx.activeSitesCount ?? 0}** Branches \xB7 **${ctx.activeTeamsCount ?? 0}** Teams.`,
    answerSi: (ctx) => `**Master Registrations \u0DC4\u0DBB\u0DC4\u0DCF Items, Branches, Field Teams \u0DC3\u0DC4 Users \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DBB\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

\u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Master Registrations"** \u0DC0\u0DD9\u0DAD \u0D9C\u0DDC\u0DC3\u0DCA \u0D85\u0DAF\u0DCF\u0DC5 \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1:
\u2022 **Items:** \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Materials \u0DC3\u0DC4 Machinery \u0DBD\u0DD2\u0DBA\u0DCF\u0DB4\u0DAF\u0DD2\u0D82\u0DA0\u0DD2 \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7.
\u2022 **Sites / Branches:** \u0D85\u0DBD\u0DD4\u0DAD\u0DCA Branch Yards \u0DC3\u0DC4 Branch Supervisors \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7.
\u2022 **Teams:** Field Teams, Team Leader \u0DC3\u0DC4 **Team Members** (\u0DB1\u0DB8, NIC \u0D85\u0D82\u0D9A\u0DBA, Role, \u0DAF\u0DD4\u0DBB\u0D9A\u0DAE\u0DB1 \u0D85\u0D82\u0D9A\u0DBA) \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7.
\u2022 **Users:** \u0DC3\u0DD2\u0DC3\u0DCA\u0DA7\u0DB8\u0DCA \u0D91\u0D9A\u0DA7 \u0DBD\u0DDC\u0D9C\u0DCA \u0DC0\u0DB1 Users, \u0D94\u0DC0\u0DD4\u0DB1\u0DCA\u0D9C\u0DDA Role \u0D91\u0D9A \u0DC3\u0DC4 Branch \u0D91\u0D9A \u0DBD\u0DB6\u0DCF\u0DAF\u0DD3\u0DB8\u0DA7.

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA:* Items **${ctx.activeItemsCount ?? 0}**\u0D9A\u0DCA \xB7 Branches **${ctx.activeSitesCount ?? 0}**\u0D9A\u0DCA \xB7 Teams **${ctx.activeTeamsCount ?? 0}**\u0D9A\u0DCA \u0D87\u0DAD.`
  },
  {
    id: "users-roles-permissions",
    suggestedTab: "manage-users",
    keywords: ["role", "permission", "access", "user", "password", "login", "supervisor", "storekeeper", "admin", "view as"],
    phrases: [
      "what permissions",
      "my role",
      "create user",
      "user management",
      "cannot see",
      "user kenek",
      "mage role"
    ],
    answerEn: (ctx) => `**User Roles, Multi-Site Access & Permissions Guide:**

You are logged in as **${ctx.userName || "User"}** with role **${ctx.userRole || "Staff"}** (Branch: **${ctx.branchName || "All Branches"}**).

\u2022 **Super Admin Central:** Full access to all branches, Main Stock, Supplier POs, Master Registrations, User Management, Document Templates, Backups, Audit Trail, Recycle Bin, and **View-As User Preview Mode**.
\u2022 **All Site Branch Admin:** Cross-branch operational access to Main Stock, Supplier POs, Requisitions, and all Branch Yards.
\u2022 **Branch Admin:** Manages their assigned Branch Yard(s) \u2014 creates Stock Requisitions, confirms received transfers, issues stock to Field Teams, records Project Material Usage, and handles Team/Branch Returns.
\u2022 **Branch System User:** Standard operational access for their assigned Branch Yard(s).`,
    answerSi: (ctx) => `**User Roles \u0DC3\u0DC4 \u0DB6\u0DBD\u0DAD\u0DBD (Permissions) \u0DB4\u0DD2\u0DC5\u0DD2\u0DB6\u0DB3 \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB\u0DBA:**

\u0D94\u0DB6 \u0DAF\u0DD0\u0DB1\u0DA7 \u0DBD\u0DDC\u0D9C\u0DCA \u0DC0\u0DD3 \u0DC3\u0DD2\u0DA7\u0DD2\u0DB1\u0DCA\u0DB1\u0DDA **${ctx.userName || "User"}** \u0DBD\u0DD9\u0DC3 **${ctx.userRole || "Staff"}** \u0DAD\u0DB1\u0DAD\u0DD4\u0DBB\u0DD9\u0DB1\u0DCA (Branch: **${ctx.branchName || "All Branches"}**).

\u2022 **Super Admin Central:** \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 Branches, Main Stock, Supplier PO, Master Registrations, User Management, Backups \u0DC3\u0DC4 Recycle Bin \u0DC3\u0DB3\u0DC4\u0DCF \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DB6\u0DBD\u0DAD\u0DBD \u0D87\u0DAD.
\u2022 **All Site Branch Admin:** \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 Branches \u0DC3\u0DC4 \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9C\u0DB6\u0DA9\u0DCF\u0DC0\u0DDA \u0DB8\u0DD9\u0DC4\u0DD9\u0DBA\u0DD4\u0DB8\u0DCA \u0D9A\u0DA7\u0DBA\u0DD4\u0DAD\u0DD4 \u0DB4\u0DCF\u0DBD\u0DB1\u0DBA \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.
\u2022 **Branch Admin / Branch System User:** \u0DAD\u0DB8\u0DB1\u0DCA\u0DA7 \u0D85\u0DAF\u0DCF\u0DC5 Branch \u0D91\u0D9A\u0DA7 \u0DB6\u0DA9\u0DD4 \u0D89\u0DBD\u0DCA\u0DBD\u0DD4\u0DB8\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 (Stock Requisitions), \u0DBD\u0DD0\u0DB6\u0DD4\u0DAB\u0DD4 \u0DB6\u0DA9\u0DD4 \u0DB7\u0DCF\u0DBB\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8, Teams \u0DC0\u0DBD\u0DA7 \u0DB6\u0DA9\u0DD4 \u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DC4 Project Usage \u0DC3\u0DA7\u0DC4\u0DB1\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0DC3\u0DD2\u0DAF\u0DD4 \u0D9A\u0DBB\u0DBA\u0DD2.`
  },
  {
    id: "recycle-bin-delete",
    suggestedTab: "recycle-bin",
    keywords: ["delete", "deleted", "recycle bin", "restore", "recover", "remove permanently", "makuna"],
    phrases: [
      "restore deleted",
      "accidentally deleted",
      "recycle bin",
      "delete permanently"
    ],
    answerEn: () => `**Admin Password Protection for Deletions & How to Restore Records (Recycle Bin):**

1. **Mandatory Admin Password Verification on Delete:** Whenever any record or transaction is deleted across the system, the confirmation dialog requires entering the **Admin Password** before the deletion can proceed.
2. **Open Recycle Bin:** Click **Recycle Bin** from the left sidebar (or top header trash icon).
3. **Restore or Permanently Delete:** Browse deleted **Items, Sites, Teams, Users, Projects, or Stock Transactions**. Click **Restore** to bring a record back immediately, or **Delete Permanently** (with Admin Password) to erase it forever.`,
    answerSi: () => `**\u0DAF\u0DAD\u0DCA\u0DAD \u0DB8\u0DD0\u0D9A\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 Admin Password \u0D86\u0DBB\u0D9A\u0DCA\u0DC2\u0DCF\u0DC0 \u0DC3\u0DC4 \u0DB8\u0DD0\u0D9A\u0DD4\u0DAB\u0DD4 \u0DAF\u0DAD\u0DCA\u0DAD \u0DB1\u0DD0\u0DC0\u0DAD \u0D9C\u0DD0\u0DB1\u0DD3\u0DB8 (Recycle Bin):**

1. **Delete \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 Admin Password \u0D85\u0DB1\u0DD2\u0DC0\u0DCF\u0DBB\u0DCA\u0DBA \u0DC0\u0DD3\u0DB8:** \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA \u0D95\u0DB1\u0DD1\u0DB8 \u0DAF\u0DD9\u0DBA\u0D9A\u0DCA Delete \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DDA\u0DAF\u0DD3 \u0DB1\u0DD2\u0D9A\u0DB1\u0DCA\u0DB8 Confirm \u0DC0\u0DD3\u0DB8 \u0DC0\u0DD9\u0DB1\u0DD4\u0DC0\u0DA7 **Admin Password** \u0D91\u0D9A \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8 \u0D85\u0DB1\u0DD2\u0DC0\u0DCF\u0DBB\u0DCA\u0DBA \u0D9A\u0DBB \u0D87\u0DAD.
2. **Recycle Bin \u0DC0\u0DD2\u0DC0\u0DD8\u0DAD \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8:** \u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Recycle Bin"** \u0DC0\u0DD9\u0DAD \u0DBA\u0DB1\u0DCA\u0DB1.
3. **Restore \u0DC4\u0DDD Delete Permanently:** \u0DB8\u0DD0\u0D9A\u0DD4\u0DAB\u0DD4 Items, Sites, Teams, Users, Projects \u0DC4\u0DDD \u0D9C\u0DB1\u0DD4\u0DAF\u0DD9\u0DB1\u0DD4 \u0DB1\u0DD0\u0DC0\u0DAD \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DA7 \u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7 **"Restore"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0DAD\u0DCA, \u0DC3\u0DCA\u0DAE\u0DD2\u0DBB\u0DC0\u0DB8 \u0D89\u0DC0\u0DAD\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 **"Delete Permanently"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0DAD\u0DCA \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD\u0DCF \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.`
  },
  {
    id: "low-stock-inventory",
    suggestedTab: "site-stock",
    keywords: ["low stock", "out of stock", "reorder", "shortage", "balance", "site branch stock", "adu"],
    phrases: ["low stock items", "check stock balance", "stock level", "branch stock"],
    answerEn: (ctx) => `**How to Check Stock Balances & Low-Stock Alerts:**

\u2022 **Main Central Stock:** View central warehouse quantities, total received, dispatched, and low-stock indicators.
\u2022 **Site Branch Stock:** Inspect inventory held at each individual branch yard (*Received \u2212 Issued to Teams \u2212 Direct Project Usage + Team Returns \u2212 Branch Returns*).
\u2022 **Team In-Hand Stock:** View materials currently held by each field squad.

\u{1F4CC} *Live Workspace Status:* Out of **${ctx.activeItemsCount ?? 0}** active items, **${ctx.lowStockItemsCount ?? 0}** item(s) are currently at or below their low-stock threshold${ctx.lowStockItemNames && ctx.lowStockItemNames.length > 0 ? ` (${ctx.lowStockItemNames.slice(0, 4).join(", ")})` : ""}.`,
    answerSi: (ctx) => `**\u0DB6\u0DA9\u0DD4 \u0DAD\u0DDC\u0D9C (Stock Balances) \u0DC3\u0DC4 Low Stock \u0DB4\u0DBB\u0DD3\u0D9A\u0DCA\u0DC2\u0DCF \u0D9A\u0DBB\u0DB1 \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

\u2022 **Main Central Stock:** \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9C\u0DB6\u0DA9\u0DCF\u0DC0\u0DDA \u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DC0\u0DAD\u0DD2\u0DB1 \u0DAD\u0DDC\u0D9C \u0DB4\u0DCA\u200D\u0DBB\u0DB8\u0DCF\u0DAB\u0DBA\u0DB1\u0DCA \u0DB6\u0DBD\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7.
\u2022 **Site Branch Stock:** \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Branch / Site \u0D91\u0D9A\u0DD9\u0DC4\u0DD2 \u0DB4\u0DC0\u0DAD\u0DD2\u0DB1 \u0DB6\u0DA9\u0DD4 \u0DAD\u0DDC\u0D9C \u0DC0\u0DD9\u0DB1 \u0DC0\u0DD9\u0DB1\u0DB8 \u0DB6\u0DBD\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7.
\u2022 **Team In-Hand Stock:** \u0D91\u0D9A\u0DCA \u0D91\u0D9A\u0DCA Team \u0D91\u0D9A \u0D85\u0DAD\u0DDA \u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DC0\u0DAD\u0DD2\u0DB1 \u0DB6\u0DA9\u0DD4 \u0DB6\u0DBD\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7.

\u{1F4CC} *\u0DAF\u0DD0\u0DB1\u0DA7 \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA:* \u0DC3\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Items **${ctx.activeItemsCount ?? 0}** \u0D85\u0DAD\u0DBB\u0DD2\u0DB1\u0DCA Items **${ctx.lowStockItemsCount ?? 0}**\u0D9A\u0DCA Low Stock \u0DC3\u0DD3\u0DB8\u0DCF\u0DC0\u0DDA \u0DB4\u0DC0\u0DAD\u0DD3.`
  },
  {
    id: "format-settings-signers-digital-signatures",
    suggestedTab: "templates",
    keywords: [
      "format",
      "formats",
      "iso",
      "9001",
      "signer",
      "signers",
      "signature",
      "signatures",
      "digital signature",
      "letterhead",
      "tenant header",
      "prepared by",
      "approved by",
      "reviewed by",
      "athsana",
      "athsan"
    ],
    phrases: [
      "format settings",
      "document templates",
      "digital signature",
      "digital signatures",
      "iso format",
      "auto tenant header",
      "signers",
      "add digital signature",
      "draw signature",
      "upload signature",
      "prepared by",
      "approved by",
      "format hadanne",
      "signature danne",
      "signers hadanne",
      "digital signature"
    ],
    answerEn: () => `**How to Configure ISO 9001:2015 Format Settings, Auto Tenant Header, Signers & Digital Signatures ("Document Templates"):**

Open **Document Templates** from the left sidebar \u2014 it is organized into **3 clear tabs**:

**Tab 1 \u2014 "1. Section Formats (ISO Standard & Upload PDF/Image)":**
1. **Default ISO 9001:2015 Standard:** All 4 format groups (**FORMAT-01** to **FORMAT-04**) automatically default to the **ISO 9001:2015 Controlled Document Format** with your logged-in **Tenant Company Name**, Phone, Email, and Address auto-populated in the header.
` + `2. **Upload Custom PDF / Image Format (Optional):** Click **Upload PDF or Image Format** on any card to upload your company's `.concat(
      `own PDF or Image layout. Check **"Use FORMAT-01 across all GRN, FOC & Stock Return sections too"** to unify Format-01 & 02 in 1 click.
3. **Format Settings & Live A4 Studio:** Click **Customize Format Settings & Preview** on any card to adjust **Render Mode** (*Header Banner + System Table*, *Full Page Watermark*, or *Smart Grid*), **Header Crop %**, **Table Column Labels**, and **Sign-Off Titles**, then click **Save Format Settings**.

**Tab 2 \u2014 "2. Auto Tenant Header & Signers":**
1. **Company Identity & Logo:** Review your auto-loaded **Tenant Registered Company Name**, Scope Subtitle, Phone, Email, Address, and choose **Logo Monogram Text** or **Logo Image (Upload)** (click **Sync from Tenant Account** anytime to re-sync).
2. **ISO Signer Names, Designations & Department Matrix:** Enter the **Signer Full Name**, **Designation**, and **Department** for:
   \u2022 **Prepared & Checked By** (Field / Site / Store Officer)
   \u2022 **Authorized & Approved By** (Central Management / Logistics Controller)
   \u2022 **Reviewed By**, **ISO Issue Number**, and **ISO Revision Number**
3. Click **Save ISO Header & Signers**.

**Tab 3 \u2014 "3. Digital Signatures" (Draw or Upload):**
1. Click **+ Add Digital Signature**.
2. Enter the **Signer Full Name** (matching your Prepared By or Approved By name), **Designation / Role**, and **Department**.
3. Either **Draw Signature** directly on the interactive signature pad OR click **Upload Signature Image** (PNG/JPG), then click **Save Signature**.
4. **Auto-Match & Live Voucher Selection:** Saved signatures automatically appear on vouchers matching the signer's name, or you can manually pick any signature inside any voucher's **"Customize Voucher Header, Signers & Digital Signatures"** panel before clicking **Print** (isolated single-click A4 preview) or **Convert to PDF**!`
    ),
    answerSi: () => `**Document Templates \u0DC4\u0DD2 ISO 9001:2015 Format Settings, Auto Tenant Header, Signers \u0DC3\u0DC4 Digital Signatures \u0DC3\u0D9A\u0DC3\u0DCA \u0D9A\u0DBB\u0D9C\u0DB1\u0DCA\u0DB1\u0DCF \u0D86\u0D9A\u0DCF\u0DBB\u0DBA:**

\u0DC0\u0DB8\u0DCA \u0DB4\u0DC3 \u0DB8\u0DD9\u0DB1\u0DD4\u0DC0\u0DD9\u0DB1\u0DCA **"Document Templates"** \u0DC0\u0DD9\u0DAD \u0DB4\u0DD2\u0DC0\u0DD2\u0DC3\u0DD9\u0DB1\u0DCA\u0DB1. \u0D91\u0DC4\u0DD2 \u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2 **\u0DA7\u0DD0\u0DB6\u0DCA 3\u0D9A\u0DCA** \u0D87\u0DAD:

**1 \u0DC0\u0DB1 \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A \u2014 "1. Section Formats (ISO Standard & Upload PDF/Image)":**
1. **Default ISO 9001:2015 Format:** \u0D9A\u0DD2\u0DC3\u0DD2\u0DAF\u0DD4 \u0D9C\u0DDC\u0DB1\u0DD4\u0DC0\u0D9A\u0DCA Upload \u0DB1\u0DDC\u0D9A\u0DC5\u0DAF, \u0D9A\u0DCF\u0DAB\u0DCA\u0DA9 4\u0DB8 (**FORMAT-01** \u0DC3\u0DD2\u0DA7 **FORMAT-04**) \u0DA2\u0DCF\u0DAD\u0DCA\u200D\u0DBA\u0DB1\u0DCA\u0DAD\u0DBB **ISO 9001:2015 Controlled Document Format** \u0D91\u0D9A\u0DD9\u0DB1\u0DCA \u0DC3\u0DC4 \u0D94\u0DB6\u0DDA \u0D86\u0DBA\u0DAD\u0DB1\u0DBA\u0DDA \u0DB1\u0DB8 (**Tenant Company Name**), \u0DAF\u0DD4\u0DBB\u0D9A\u0DAE\u0DB1, Email \u0DC4\u0DCF \u0DBD\u0DD2\u0DB4\u0DD2\u0DB1\u0DBA \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 Header \u0D91\u0D9A\u0DA7 \u0DBA\u0DDC\u0DAF\u0DCF\u0D9C\u0DD9\u0DB1 \u0D9A\u0DCA\u200D\u0DBB\u0DD2\u0DBA\u0DCF\u0DAD\u0DCA\u0DB8\u0D9A \u0DC0\u0DDA.
2. **PDF / Image Upload \u0DC3\u0DC4 Unified Format:** \u0D94\u0DB6\u0DDA\u0DB8 PDF (.pdf) \u0DC4\u0DDD Image (.png/.jpg) \u0D86\u0D9A\u0DD8\u0DAD\u0DD2\u0DBA\u0D9A\u0DCA Upload \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7\u0DAD\u0DCA, **"Use FORMAT-01 across all GRN, FOC & Stock Return sections too"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA Format-01 \u0DC4\u0DCF 02 \u0D91\u0D9A\u0DC0\u0DBB \u0D92\u0D9A\u0DCF\u0DB6\u0DAF\u0DCA\u0DB0 \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7\u0DAD\u0DCA \u0DB4\u0DD4\u0DC5\u0DD4\u0DC0\u0DB1.
3. **Format Settings \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8:** \u0D95\u0DB1\u0DD1\u0DB8 \u0D9A\u0DCF\u0DAB\u0DCA\u0DA9\u0DBA\u0D9A **"Customize Format Settings & Preview"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB \u0DAF\u0D9A\u0DD4\u0DAB\u0DD4 \u0DB4\u0DC3 Live A4 Studio \u0D91\u0D9A\u0DD9\u0DB1\u0DCA **Render Mode**, **Header Crop %**, **Table Column Names** \u0DC3\u0DC4 **Sign-Off Titles** \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DBB Save \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A.

**2 \u0DC0\u0DB1 \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A \u2014 "2. Auto Tenant Header & Signers" (Signers \u0DC3\u0DC4 Logo \u0DC3\u0DD0\u0D9A\u0DC3\u0DD3\u0DB8):**
1. **Tenant Header & Logo:** \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 \u0DBD\u0DD0\u0DB6\u0DD3 \u0D87\u0DAD\u0DD2 \u0D86\u0DBA\u0DAD\u0DB1\u0DBA\u0DDA \u0DB1\u0DB8, \u0DAF\u0DD4\u0DBB\u0D9A\u0DAE\u0DB1, Email, \u0DBD\u0DD2\u0DB4\u0DD2\u0DB1\u0DBA \u0DB4\u0DBB\u0DD3\u0D9A\u0DCA\u0DC2\u0DCF \u0D9A\u0DBB **"Logo Monogram Text"** \u0DC4\u0DDD **"Logo Image (Upload)"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D86\u0DBA\u0DAD\u0DB1\u0DD2\u0D9A \u0DBD\u0DCF\u0D82\u0DA1\u0DB1\u0DBA \u0D91\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1 (**"Sync from Tenant Account"** \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0DB1\u0DD0\u0DC0\u0DAD Auto-fill \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A).
2. **Signers (\u0D85\u0DAD\u0DCA\u0DC3\u0DB1\u0DCA \u0D9A\u0DBB\u0DB1 \u0DB1\u0DD2\u0DBD\u0DB0\u0DCF\u0DBB\u0DD3\u0DB1\u0DCA\u0D9C\u0DDA \u0DB1\u0DB8\u0DCA \u0DC3\u0DC4 \u0DAD\u0DB1\u0DAD\u0DD4\u0DBB\u0DD4):** **"2. ISO Signer Names, Designations & Department Matrix"** \u0DBA\u0DA7\u0DAD\u0DDA:
   \u2022 **Prepared & Checked By:** \u0DC3\u0D9A\u0DC3\u0DCA \u0D9A\u0DBB\u0DB1 \u0DB1\u0DD2\u0DBD\u0DB0\u0DCF\u0DBB\u0DD2\u0DBA\u0DCF\u0D9C\u0DDA \u0DB1\u0DB8 (Signer Full Name), \u0DAD\u0DB1\u0DAD\u0DD4\u0DBB (Designation) \u0DC3\u0DC4 \u0D85\u0D82\u0DC1\u0DBA (Department)
   \u2022 **Authorized & Approved By:** \u0D85\u0DB1\u0DD4\u0DB8\u0DAD \u0D9A\u0DBB\u0DB1 \u0DB1\u0DD2\u0DBD\u0DB0\u0DCF\u0DBB\u0DD2\u0DBA\u0DCF\u0D9C\u0DDA \u0DB1\u0DB8, \u0DAD\u0DB1\u0DAD\u0DD4\u0DBB \u0DC3\u0DC4 \u0D85\u0D82\u0DC1\u0DBA
   \u2022 **Reviewed By** \u0DC3\u0DC4 **ISO Issue / Revision Numbers** \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB **"Save ISO Header & Signers"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.

**3 \u0DC0\u0DB1 \u0DA7\u0DD0\u0DB6\u0DCA \u0D91\u0D9A \u2014 "3. Digital Signatures" (\u0DA9\u0DD2\u0DA2\u0DD2\u0DA7\u0DBD\u0DCA \u0D85\u0DAD\u0DCA\u0DC3\u0DB1\u0DCA \u0D91\u0D9A\u0DAD\u0DD4 \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8):**
1. **"+ Add Digital Signature"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
2. \u0DB1\u0DD2\u0DBD\u0DB0\u0DCF\u0DBB\u0DD2\u0DBA\u0DCF\u0D9C\u0DDA \u0DB1\u0DB8 (**Signer Full Name**), \u0DAD\u0DB1\u0DAD\u0DD4\u0DBB (**Role**) \u0DC3\u0DC4 \u0D85\u0D82\u0DC1\u0DBA (**Department**) \u0D87\u0DAD\u0DD4\u0DC5\u0DAD\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
3. \u0DAD\u0DD2\u0DBB\u0DBA\u0DDA \u0D87\u0DAD\u0DD2 \u0D9A\u0DDC\u0DA7\u0DD4\u0DC0 \u0DB8\u0DAD Mouse/Touch \u0DB8\u0D9C\u0DD2\u0DB1\u0DCA \u0D9A\u0DD9\u0DBD\u0DD2\u0DB1\u0DCA\u0DB8 \u0D85\u0DAD\u0DCA\u0DC3\u0DB1 \u0D85\u0DB3\u0DD2\u0DB1\u0DCA\u0DB1 (**Draw Signature**) \u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA \u0D85\u0DAD\u0DCA\u0DC3\u0DB1\u0DDA PNG/JPG Image \u0D91\u0D9A\u0D9A\u0DCA **Upload** \u0D9A\u0DBB **"Save Signature"** \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
4. **\u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DCA \u0DC0\u0DBD\u0DA7 \u0DBA\u0DD9\u0DAF\u0DD3\u0DB8 \u0DC3\u0DC4 \u0DAD\u0DB1\u0DD2 \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA Print:** Save \u0D9A\u0DC5 Digital Signatures \u0DB1\u0DD2\u0DBD\u0DB0\u0DCF\u0DBB\u0DD2\u0DBA\u0DCF\u0D9C\u0DDA \u0DB1\u0DB8 \u0D85\u0DB1\u0DD4\u0DC0 \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DCA \u0DC0\u0DBD\u0DA7 \u0DC0\u0DD0\u0DA7\u0DD9\u0DB1 \u0D85\u0DAD\u0DBB, \u0D95\u0DB1\u0DD1\u0DB8 \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DBA\u0D9A\u0DCA Print \u0D9A\u0DBB\u0DB1 \u0DC0\u0DD2\u0DA7 \u0D8B\u0DA9\u0DD2\u0DB1\u0DCA \u0D87\u0DAD\u0DD2 **"Customize Voucher Header, Signers & Digital Signatures"** \u0D9A\u0DDC\u0DA7\u0DC3\u0DD2\u0DB1\u0DCA\u0DAF \u0D9A\u0DD0\u0DB8\u0DAD\u0DD2 \u0D85\u0DAD\u0DCA\u0DC3\u0DB1\u0D9A\u0DCA \u0DAD\u0DDD\u0DBB\u0DCF \u0D91\u0D9A\u0DC0\u0DBB\u0DB8 (Isolated Single-Click A4 Print) \u0DB8\u0DD4\u0DAF\u0DCA\u200D\u0DBB\u0DAB\u0DBA \u0DC4\u0DDD PDF \u0DB6\u0DCF\u0D9C\u0DAD \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A!`
  },
  {
    id: "directory-audit-letterhead-backup",
    suggestedTab: "branch-directory",
    keywords: ["directory", "audit", "report", "print", "backup", "flush", "theme", "config"],
    phrases: [
      "branch staff & teams",
      "audit trail",
      "system backup",
      "system config"
    ],
    answerEn: () => `**Branch Directory, Isolated Single-Click Printing, Audit Trail & System Backups:**

\u2022 **Branch Staff & Teams:** View, filter, export to Excel (**Export Members**), and print the complete hierarchy of branches, supervisors, field teams, and crew members.
\u2022 **Isolated Single-Click A4 Print & PDF Export:** Every Print button across all Vouchers, Full Site Reports, Barcode Labels, Team In-Hand, Branch Directory, and Audit Trail opens a clean, isolated A4 print preview of ONLY that document without printing the full web page.
\u2022 **Audit Trail:** Inspect chronological logs of every transaction and user action with PDF/CSV export.
\u2022 **System Backups & Config (Top Header):** Create/restore versioned JSON backups, open the **Offline Backup Viewer**, customize system theme/company settings, or perform an **Admin System Flush**.`,
    answerSi: () => `**Branch Directory, Isolated Single-Click Print, Audit Trail \u0DC3\u0DC4 System Backups:**

\u2022 **Branch Staff & Teams:** \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 Branches, Supervisors, Teams \u0DC3\u0DC4 \u0DC3\u0DCF\u0DB8\u0DCF\u0DA2\u0DD2\u0D9A\u0DBA\u0DD2\u0DB1\u0DCA\u0D9C\u0DDA \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB \u0DB6\u0DBD\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7 \u0DC3\u0DC4 Print / Excel Export \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7.
\u2022 **Isolated Single-Click A4 Print:** \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA \u0D95\u0DB1\u0DD1\u0DB8 \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DBA\u0D9A \u0DC4\u0DDD \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0\u0D9A Print \u0D91\u0DB6\u0DD6 \u0DC0\u0DD2\u0DA7 \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DC0\u0DD9\u0DB6\u0DCA \u0DB4\u0DD2\u0DA7\u0DD4\u0DC0 \u0DB1\u0DDC\u0DC0 \u0D85\u0DAF\u0DCF\u0DC5 \u0DC0\u0DC0\u0DD4\u0DA0\u0DBB\u0DBA/\u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF\u0DC0 \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA \u0D91\u0D9A\u0DC0\u0DBB\u0DB8 \u0DB4\u0DD0\u0DC4\u0DD0\u0DAF\u0DD2\u0DBD\u0DD2\u0DC0 Print Preview \u0DC0\u0DDA.
\u2022 **Audit Trail:** \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA \u0DC3\u0DD2\u0DAF\u0DD4 \u0D9A\u0DC5 \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 \u0D9C\u0DB1\u0DD4\u0DAF\u0DD9\u0DB1\u0DD4 \u0DB4\u0DD2\u0DC5\u0DD2\u0DB6\u0DB3 \u0DC0\u0DCF\u0DBB\u0DCA\u0DAD\u0DCF \u0DBD\u0DB6\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7.
\u2022 **System Backup & Config (\u0D89\u0DC4\u0DC5 Header \u0DAD\u0DD3\u0DBB\u0DD4\u0DC0):** \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB Backup \u0DBD\u0DB6\u0DCF\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7, Restore \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7 \u0DC3\u0DC4 \u0D86\u0DBA\u0DAD\u0DB1\u0DBA\u0DDA Theme/Settings \u0DC0\u0DD9\u0DB1\u0DC3\u0DCA \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8\u0DA7.`
  },
  {
    id: "email-verification-branding",
    suggestedTab: "dashboard",
    keywords: [
      "email",
      "verify",
      "verification",
      "apexstox",
      "support@apexstox.com",
      "domain",
      "inbox",
      "link"
    ],
    phrases: [
      "email verification",
      "send verification email",
      "verify email",
      "verify account",
      "email link",
      "verify karanne"
    ],
    answerEn: () => `**Automatic Email Verification & Official Support Contact (apexstox.com):**

1. **1-Click Send Verification Email:** In the email verification screen, click **Send Verification Email**.
2. **Instant Verification on Link Click:** Open your inbox (check Spam/Promotions if needed) and click the verification link from **apexstox.com** \u2014 your account automatically completes verification as soon as the link is clicked without extra confirmation buttons.
3. **Official Support Contact:** Need account or workspace help? Contact **support@apexstox.com** (Website: **apexstox.com**).`,
    answerSi: () => `**\u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA Email Verification \u0DC3\u0DC4 \u0DB1\u0DD2\u0DBD \u0DC3\u0DC4\u0DCF\u0DBA \u0DC3\u0DDA\u0DC0\u0DCF\u0DC0 (apexstox.com):**

1. **Send Verification Email:** Verification \u0DB4\u0DAB\u0DD2\u0DC0\u0DD2\u0DA9\u0DBA\u0DDA \u0D87\u0DAD\u0DD2 **"Send Verification Email"** \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1.
2. **\u0DBD\u0DD2\u0DB1\u0DCA\u0D9A\u0DCA \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DC5 \u0DC3\u0DD0\u0DAB\u0DD2\u0DB1\u0DCA Verify \u0DC0\u0DD3\u0DB8:** \u0D94\u0DB6\u0DDA Email Inbox \u0D91\u0D9A\u0DA7 (\u0DB1\u0DD0\u0DAD\u0DD2\u0DB1\u0DB8\u0DCA Spam folder \u0D91\u0D9A\u0DA7) **apexstox.com** \u0DC0\u0DD9\u0DAD\u0DD2\u0DB1\u0DCA \u0DBD\u0DD0\u0DB6\u0DD9\u0DB1 Email \u0D91\u0D9A\u0DDA Verification Link \u0D91\u0D9A \u0D9A\u0DCA\u0DBD\u0DD2\u0D9A\u0DCA \u0D9A\u0DC5 \u0DC3\u0DD0\u0DAB\u0DD2\u0DB1\u0DCA \u0D85\u0DB8\u0DAD\u0DBB \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0DB6\u0DD3\u0DB8\u0D9A\u0DD2\u0DB1\u0DCA \u0DAD\u0DDC\u0DBB\u0DC0 \u0D9C\u0DD2\u0DAB\u0DD4\u0DB8 \u0DC3\u0DCA\u0DC0\u0DBA\u0D82\u0D9A\u0DCA\u200D\u0DBB\u0DD3\u0DBA\u0DC0 Verify \u0DC0\u0DDA.
3. **\u0DB1\u0DD2\u0DBD \u0DC3\u0DB8\u0DCA\u0DB6\u0DB1\u0DCA\u0DB0\u0DAD\u0DCF \u0DC0\u0DD2\u0DC3\u0DCA\u0DAD\u0DBB:** \u0D95\u0DB1\u0DD1\u0DB8 \u0DAD\u0DCF\u0D9A\u0DCA\u0DC2\u0DAB\u0DD2\u0D9A \u0DC3\u0DC4\u0DCF\u0DBA\u0D9A\u0DCA \u0DC3\u0DB3\u0DC4\u0DCF **support@apexstox.com** \u0DC4\u0DDD **apexstox.com** \u0DC0\u0DD9\u0DAD \u0DB4\u0DD2\u0DC0\u0DD2\u0DC3\u0DD9\u0DB1\u0DCA\u0DB1.`
  }
];
function resolveSmartSystemSupportAnswer(userQuestion, ctx) {
  const q = userQuestion.trim().toLowerCase();
  const useSinhala = ctx.language === "si" || detectSinhalaOrSinglishInput(userQuestion);
  let bestTopic = null;
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
      suggestedTab: bestTopic.suggestedTab
    };
  }
  if (useSinhala) {
    return {
      suggestedTab: ctx.currentTab || "dashboard",
      reply: `**Apex Stock & Site Management System \u2014 \u0DC3\u0DB8\u0DCA\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB \u0DB8\u0D9C\u0DB4\u0DD9\u0DB1\u0DCA\u0DC0\u0DD3\u0DB8:**

\u0D94\u0DB6 \u0DAF\u0DD0\u0DB1\u0DA7 **${ctx.userRole || "Staff"}** \u0DBD\u0DD9\u0DC3 **${ctx.branchName || "All Branches"}** \u0DC4\u0DD2 \u0DC3\u0DD2\u0DA7\u0DD3. \u0DB4\u0DAF\u0DCA\u0DB0\u0DAD\u0DD2\u0DBA\u0DDA \u0DB4\u0DCA\u200D\u0DBB\u0DB0\u0DCF\u0DB1 \u0D9A\u0DDC\u0DA7\u0DC3\u0DCA:
1. **\u0DB4\u0DD2\u0DBA\u0DC0\u0DBB 5 Free Stock (FOC) Reconciliation & "ALL AREAS":** Central Receipt -> Site Issue -> Team Issue -> Usage/Wastage -> Completion Returnable Balance \u0DB4\u0DD2\u0DC5\u0DD2\u0DC0\u0DD9\u0DC5, \u0DC0\u0DBB\u0DCA\u0DAB \u0D9C\u0DD0\u0DB1\u0DCA\u0DC0\u0DD6 Main/Sub-Project Cards, Central Item/Project PDF Reports, Site Stock \u0DC4\u0DD2 **"Central FOC"** Badge \u0DC3\u0DC4 \u0D95\u0DB1\u0DD1\u0DB8 Site \u0D91\u0D9A\u0D9A\u0DA7 \u0DB7\u0DCF\u0DC0\u0DD2\u0DAD \u0D9A\u0DC5 \u0DC4\u0DD0\u0D9A\u0DD2 **"ALL AREAS"** Projects.
2. **Main Project -> Under New Connections (Telecom, Water, Electric, Solar):** \u0DC3\u0DD2\u0DBA\u0DBD\u0DD4\u0DB8 New Connection Section 4 \u0DC3\u0DB3\u0DC4\u0DCF\u0DB8 Main Project \u0DBA\u0DA7\u0DAD\u0DDA FOC \u0D9A\u0DC5\u0DB8\u0DB1\u0DCF\u0D9A\u0DBB\u0DAB\u0DBA \u0DC3\u0DC4 \u0D85\u0DAF\u0DCF\u0DC5 Section \u0D91\u0D9A\u0DA7 FOC \u0D87\u0DAD\u0DCA\u0DB1\u0DB8\u0DCA \u0DB4\u0DB8\u0DAB\u0D9A\u0DCA Filter \u0DC0\u0DB1 Dropdowns.
3. **Master Registrations & PO/Return Item Images (<200KB):** Items (PO/Requisition/Return Dropdown \u0DC0\u0DBD Photo \u0DC3\u0DB8\u0D9F), Branches, Teams (Transfer & Name Lock), Clients \u0DC3\u0DC4 Users.
4. **Field Team Site Transfer & Site-Separated Stock:** **"Temporary Assigned to - [New Site]"** -> Permanent **"[Team Name] (Ref: [Old Site])"** \u0DC3\u0DC4 **"Stock to Return - [Site Name]"**.
5. **Material Usage & Multi-Item Returns (RV / BRM):** 1-2-3 Connection Flow, **Qty Used + Wastage Qty**, **Full Report for This Site**, \u0DC3\u0DC4 \u0DB7\u0DCF\u0DAB\u0DCA\u0DA9 \u0D9A\u0DD2\u0DC4\u0DD2\u0DB4\u0DBA\u0D9A\u0DCA \u0D91\u0D9A\u0DC0\u0DBB Return \u0D9A\u0DD2\u0DBB\u0DD3\u0DB8.
6. **Document Templates (ISO 9001:2015 Formats, Signers & Digital Signatures):** Auto Tenant Header, Digital Signatures \u0DC3\u0DC4 Isolated Single-Click A4 Print.

\u0D89\u0DC4\u0DAD Quick Help \u0DB6\u0DA7\u0DB1\u0DCA \u0D91\u0D9A\u0D9A\u0DCA \u0DAD\u0DDD\u0DBB\u0DB1\u0DCA\u0DB1 \u0DC4\u0DDD \u0D94\u0DB6\u0DA7 \u0DAF\u0DD0\u0DB1\u0D9C\u0DD0\u0DB1\u0DD3\u0DB8\u0DA7 \u0D85\u0DC0\u0DC1\u0DCA\u200D\u0DBA \u0D95\u0DB1\u0DD1\u0DB8 \u0D9A\u0DDC\u0DA7\u0DC3\u0D9A\u0DCA \u0D9C\u0DD0\u0DB1 \u0D85\u0DC4\u0DB1\u0DCA\u0DB1!`
    };
  }
  return {
    suggestedTab: ctx.currentTab || "dashboard",
    reply: `**Apex Stock & Site Management System \u2014 Complete Feature Guide:**

You are logged in as **${ctx.userRole || "Staff"}** (${ctx.branchName || "All Branches"}). Here are all modules available in the system:
1. **5-Stage Client Free Stock (FOC) Reconciliation & "ALL AREAS":** Chronological flow (Central Receipt -> Site Issue -> Team Issue -> Usage & Wastage -> Completion Returnable Balance), color-coded Main & Sub-Project cards, per-item & full-project Central Reports, **"Central FOC"** badge in Site Branch Stock, and **"ALL AREAS"** multi-site projects.
2. **Main Project -> Under New Connections (Telecom, Water, Electric, Solar):** Unified Main Project FOC hierarchy across all 4 utility sections with section-filtered FOC dropdowns (only visible when FOC exists for that section).
3. **Master Registrations & Item Photos (<200KB):** Register Items (thumbnails displayed in PO, Requisition, RV & BRM dropdowns + "Print with Image"), Branches, Teams (with Name Lock), Suppliers, Clients, and Users.
4. **Field Team Site Transfer & Site-Separated In-Hand Stock:** **"Temporary Assigned to - [New Site]"** -> Permanent **"[Team Name] (Ref: [Previous Site])"** and strict separation of **"Stock to Return - [Previous Site Name]"** vs. Active Site Stock.
5. **Material Usage & Multi-Item Batch Returns (RV / BRM):** 1-2-3 Connection workflow, **Qty Used + Wastage Qty**, **Full Report for This Site (Project)**, and single-voucher batch returns.
6. **Document Templates (ISO 9001:2015 Format Settings, Signers & Digital Signatures):** Configure ISO formats, Signer designations, Digital Signatures, and Isolated Single-Click A4 Printing.

Click any **Quick Help** topic above or ask about any specific feature!`
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT || 3e3);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production" || req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const originHeader = req.get("origin");
    if (originHeader) {
      try {
        const originHost = new URL(originHeader).host.toLowerCase();
        const forwardedHost = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim().toLowerCase();
        let appUrlHost = "";
        if (process.env.APP_URL) {
          try {
            appUrlHost = new URL(process.env.APP_URL).host.toLowerCase();
          } catch {
            appUrlHost = "";
          }
        }
        const allowedHosts = [forwardedHost, appUrlHost].filter(Boolean);
        if (allowedHosts.length > 0 && !allowedHosts.includes(originHost)) {
          res.status(403).json({ error: "Cross-origin request blocked." });
          return;
        }
      } catch {
        res.status(403).json({ error: "Invalid Origin header." });
        return;
      }
    }
  }
  next();
});
var SESSION_SIGNING_SECRET = (process.env.SESSION_SECRET || "").trim() || crypto.randomBytes(32).toString("hex");
function signSessionToken(payload, ttlMs = 24 * 60 * 60 * 1e3) {
  const fullPayload = {
    ...payload,
    exp: Date.now() + ttlMs
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SIGNING_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}
function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;
  const expectedSig = crypto.createHmac("sha256", SESSION_SIGNING_SECRET).update(encoded).digest("base64url");
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
function extractBearerToken(req) {
  const auth = req.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return void 0;
  return auth.slice(7).trim();
}
var claimedMasterHash = null;
function hashScryptPasscode(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
function verifyScryptPasscode(plain, storedHash) {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const actualBuf = crypto.scryptSync(plain, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, "hex");
  return actualBuf.length === expectedBuf.length && crypto.timingSafeEqual(actualBuf, expectedBuf);
}
function verifyEnvPasscode(plain, envPasscode) {
  const a = crypto.createHash("sha256").update(plain).digest();
  const b = crypto.createHash("sha256").update(envPasscode).digest();
  return crypto.timingSafeEqual(a, b);
}
var authAttemptMap = /* @__PURE__ */ new Map();
function checkAuthRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1e3;
  const rec = authAttemptMap.get(ip);
  if (!rec || now - rec.windowStart > windowMs) {
    return true;
  }
  return rec.failures < 12;
}
function recordAuthFailure(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1e3;
  const rec = authAttemptMap.get(ip);
  if (!rec || now - rec.windowStart > windowMs) {
    authAttemptMap.set(ip, { failures: 1, windowStart: now });
  } else {
    rec.failures += 1;
  }
}
function clearAuthFailures(ip) {
  authAttemptMap.delete(ip);
}
app.get("/api/auth/master/status", (_req, res) => {
  const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || "").trim();
  if (envPasscode) {
    res.json({ configured: true, source: "env" });
    return;
  }
  if (claimedMasterHash) {
    res.json({ configured: true, source: "claimed" });
    return;
  }
  res.json({ configured: false, source: "unset" });
});
app.post("/api/auth/master/claim", (req, res) => {
  const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || "").trim();
  if (envPasscode || claimedMasterHash) {
    res.status(409).json({
      success: false,
      message: "Master Admin passcode is already configured and locked."
    });
    return;
  }
  const passcode = typeof req.body?.passcode === "string" ? req.body.passcode.trim() : "";
  if (passcode.length < 8) {
    res.status(400).json({
      success: false,
      message: "Master Admin passcode must be at least 8 characters long."
    });
    return;
  }
  claimedMasterHash = hashScryptPasscode(passcode);
  const token = signSessionToken({ sub: "usr-admin-1", scope: "master", tenantId: "tenant-apex-main" });
  res.json({
    success: true,
    token,
    message: "Master Admin security passcode claimed and hashed on server."
  });
});
app.post("/api/auth/master/verify", (req, res) => {
  const ip = String(req.ip || "unknown");
  if (!checkAuthRateLimit(ip)) {
    res.status(429).json({
      valid: false,
      message: "Too many failed authentication attempts. Please wait 15 minutes and try again."
    });
    return;
  }
  const passcode = typeof req.body?.passcode === "string" ? req.body.passcode.trim() : "";
  if (!passcode) {
    res.status(400).json({ valid: false, message: "Passcode is required." });
    return;
  }
  const envPasscode = (process.env.MASTER_ADMIN_PASSCODE || "").trim();
  if (!envPasscode && !claimedMasterHash) {
    res.status(409).json({
      valid: false,
      needsSetup: true,
      message: "Master Admin passcode has not been configured yet. Please complete first-run setup."
    });
    return;
  }
  const isMatch = envPasscode ? verifyEnvPasscode(passcode, envPasscode) : verifyScryptPasscode(passcode, claimedMasterHash);
  if (!isMatch) {
    recordAuthFailure(ip);
    res.status(401).json({ valid: false, message: "Invalid Master Admin credentials." });
    return;
  }
  clearAuthFailures(ip);
  const token = signSessionToken({ sub: "usr-admin-1", scope: "master", tenantId: "tenant-apex-main" });
  res.json({ valid: true, token });
});
app.post("/api/auth/workspace-session", (req, res) => {
  const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
  const tenantId = typeof req.body?.tenantId === "string" ? req.body.tenantId.trim() : "";
  if (!userId || !tenantId || userId === "usr-admin-1") {
    res.status(400).json({ error: "Valid non-master workspace userId and tenantId are required." });
    return;
  }
  const token = signSessionToken({ sub: userId, scope: "workspace", tenantId });
  res.json({ token });
});
var getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
var SYSTEM_KNOWLEDGE_PROMPT = `You are the official Chat System Support Assistant for the "Apex Stock & Site Management System" (Enterprise Warehouse, Branch Yard, Field Team Dispatch, Project & New Section Registry, and Material Usage ERP).

Your job is to help system users solve problems, understand every feature and workflow inside the system, and troubleshoot issues clearly, accurately, and politely.

LANGUAGE RULES:
1. If LanguagePreference is "en" (English Section) and the user writes in English:
   - Reply 100% in clear, structured English. Do NOT include any Sinhala words.
2. If LanguagePreference is "si" (Sinhala Section) OR if the user writes in Sinhala script or Singlish (e.g., "kohomada aluth project section ekak hadala template hadanne"):
   - Reply clearly in natural, easy-to-understand Sinhala (keeping exact English menu/button names in quotes so they can find them on screen).
3. Keep answers structured with numbered steps (1, 2, 3) and mention the exact sidebar menu names and button labels.

COMPLETE SYSTEM FEATURES & WORKFLOW GUIDE:
1. **Master Registrations ("Master Registrations" -> Items, Sites/Branches, Field Teams, Suppliers, Clients, Users)**:
   - **Items ("Item Catalog" & "Plant & Equipment") + Optional Item Photo (<200KB Auto-Compression) & "Print with Image"**: Register Materials (consumables) or Machinery (Plant & Equipment) with Item Code, Barcode, Unit, Unit Price, Low Stock Threshold, optional Project Reservation, and optional **Item Photo** (automatically resized and compressed to **under 200KB**). When printing any voucher or report, users can toggle the **"Print with Image"** checkbox in the print toolbar to include item thumbnail images. Supports Excel Import (Sync, Append, Replace), Excel Export, Barcode Sticker printing, USB HID Barcode Scanner, and Mobile Camera Barcode Scanner ("Scan Now").
   - **Sites / Branches**: Register Central Main Warehouse (HQ) and Operational Branch Yards, link a designated Branch Supervisor user, and assign system users.
   - **Field Teams, Team Name Lock After Stock Issue & Conflict-Free Site Transfer Workflow ("Temporary Assigned to - [New Site]" vs. Permanent "(Ref: [Previous Site])")**:
     1) Register field work squads with Team Name, Team Leader Name & NIC/ID, Assigned Site Base, Contact Phone, and individual **Team Members** (Crew Size auto-calculates as 1 Leader + N Members).
     2) **Team Name Lock After Stock Issue**: Once a team has received any stock item, its **Team Name** is locked against renaming to preserve historical voucher and audit integrity (while Team Leader, Phone, and Members remain editable).
     3) **Transferring a Team ("Transfer / Site History")**: When transferring a team to a new Site Branch, whether they still have unreturned stock on their current site or zero stock, the assignment starts in a **Temporary** state displayed as **"Temporary Assigned to - [New Site Name]"**.
     4) **Promotion to Permanent with Prior-Site Reference**: Once previous-site stock is returned/cleared (or when Branch Admin / System Admin clicks **"Confirm / Promote to Permanent"** for a team that had zero stock on the old site), the assignment promotes to **Permanent** and updates the displayed team name with a prior-site reference: **"[Team Name] (Ref: [Previous Site Name])"**.
     5) **Complete Assigned Sites History**: Inside **Transfer / Site History**, users can view all past and current assigned sites for that team, showing **Temporary** vs. **Permanent**, **Reference Site (Ref:)**, assignment dates, and **Stock Cleared / Stock Pending** status.
   - **Suppliers & Clients**: Register Suppliers (for Purchase Orders & Debit Notes) and Clients/Principals (for Projects & Client Free Issue Stock).
   - **User Management ("User Management")**: Create logins with Username, Password, Full Name, Role ("Super Admin Central", "All Site Branch Admin", "Branch Admin", "Branch System User"), and single or multi-branch assignment.

2. **Main Central Stock ("Main Central Stock"), Supplier Orders ("Supplier Orders (PO)"), & Client Free Stock ("Client Free Stock (FOC)")**:
   - **Main Central Stock & Item Lifecycle Summary**: Add stock via **"+ Add Stock (GRN)"** (Purchase or Manual Entry), perform **Direct Transfer to Site**, or manage the **Damaged Stock Ledger & Restoration**. Clicking any item row (or **"Summary"**) in **Main Central Stock** opens a complete **End-to-End Material Lifecycle & Custody Summary** right below the item (showing PO/GRN/Manual/FOC inbound sources, Site Branch distribution & Site In-Hand, Field Team distribution & Team In-Hand, Project Used/Wastage, Central Stock In-Hand, and **"Print A4 Summary"** / **"Download PDF"**).
   - **Supplier Orders (PO)**: Create Purchase Orders (**item dropdowns show Item Images alongside Item Code and Material Name**), receive Full or Partial batch GRNs against POs into Main Stock, close PO remainders, create **Supplier Returns (RTV)** for defective goods, dispatch with Gate Pass & vehicle details, print official **Debit Notes**, and record supplier settlements (Replacement, Credit Note, Refund).
   - **Client Free Stock (FOC) \u2014 Standard 5-Stage Reconciliation Flow, Color-Coded Project Cards, Individual & Full Reports, and "ALL AREAS" Branch Support**:
     1) Open **"Client Free Stock (FOC)"** and click **"+ Log Client Free Stock"**. Choose Target Project Mode (**"\u{1F3E2} Under Main Project"**, **"Main Project (For New Connections)"**, or **"\u{1F4C4} Individual Project"**). Selecting a project automatically **LOCKS** the **"Allocated Site Branch"** \u2014 unless the project is registered under **"\u{1F310} ALL AREAS (All Site Branches)"**, which allows any site branch to request and consume its FOC stock.
     2) **Standard 5-Stage FOC Reconciliation Flow**: All Client FOC summaries and reconciliation reports follow a clear chronological order: **(1) Initial FOC Receipt at Central -> (2) Site Issue -> (3) Team Issue -> (4) Usage & Wastage -> (5) Balance / Returnable Stock on Project Completion**.
     3) **Main Project & Sub-Project Flow + Color-Coded Cards**: Selecting a **Sub-Project** shows that Sub-Project's dedicated Usage Flow. Selecting a **Main Project** displays **distinct color-coded Main Project cards**, followed by each linked **Sub-Project (e.g., KT-RGL-0505, KT-ABK-0506)** in its own flow section below, and concludes at the bottom with a **Full Usage & Client Completion Returnable Balance Report**.
     4) **Central FOC Individual & Consolidated A4/PDF Reports + Admin Reassignment**: From Central Stock / Client Free Stock, users can generate clean printable reports both **per individual issued item** AND as **one full consolidated report for all items in a project**. Admins can also edit and reassign mis-logged FOC vouchers anytime.

3. **Stock Requisitions ("Stock Requisitions") & Site Branch Stock ("Site Branch Stock")**:
   - **How a Branch gets items from Main Stock**:
     1) Open **"Stock Requisitions"** -> click **"+ New Stock Requirement Form"** -> select Requesting Site Branch and switch between **Tab 1 ("1. Normal Stock Request")** or **Tab 2 ("2. Client Free Stock for Assigned Project Request")** \u2014 Tab 2 displays projects assigned to that Site Branch PLUS any **"\u{1F310} ALL AREAS (All Site Branches)"** island-wide projects.
     2) HQ Super Admin / Storekeeper clicks **"Approve & Dispatch"**. Branch Admin / Supervisor clicks **"Confirm Receipt (GRN)"** to add the items into **"Site Branch Stock"**.
   - **Site Branch Stock "Central FOC" Badge & 5-Stage Forward Traceability Summary**: Inside **Site Branch Stock**, stock received from Central FOC is clearly highlighted with a distinct **"\u{1F381} Central FOC"** badge/tag and color highlight so branch staff immediately distinguish Central FOC items from normal stock. Clicking any item row (or **"Forward Summary"**) expands its forward reconciliation flow (Transfers Received Normal vs. Central FOC -> Site Issues to Teams -> Usage & Wastage -> Site & Team In-Hand Balance) with **"Print A4 Summary"** and **"Download PDF"**.

4. **Issue to Field Teams ("Issue to Teams"), Site-Separated Team In-Hand ("Team In-Hand Stock"), & Branch Directory ("Branch Staff & Teams")**:
   - **Issue to Teams**: Select Branch Yard and Field Team -> pick items from available Site Branch Stock -> click **"Issue Material to Team"** and print the **Gate Pass / Issue Voucher**.
   - **Site-Separated Team In-Hand Stock ("Stock to Return - [Previous Site Name]")**:
     In **"Team In-Hand Stock"**, stock held by transferred teams is **NEVER combined or summed across sites**:
     \u2022 Any unreturned balance from a previous site is displayed separately in an amber section titled **"Stock to Return - [Previous Site Name]"** \u2014 those items must be returned to that previous site and cannot be used on the new site.
     \u2022 Stock issued at the team's new site is displayed separately under **"[Current Site Name] \u2014 Active Site Stock"**.
   - **Branch Staff & Teams**: Organizational directory showing every branch, supervisor, system staff, field teams, and verified team members with NIC numbers. Supports **Export Members (Excel)** and **Print Directory Report**.

5. **Project & New Section Registry ("Project & New Section Registry") \u2014 "Main Project -> Under New Connections", "ALL AREAS" Branch, Templates (Telecom, Water, Electric, Solar) & "+ Add Field"**:
   - **International Industry Section Templates (1-Click Auto-Load) & "+ Add Field" Custom Field Builder**:
     1) Open **"Project & New Section Registry"** -> **"New Section Registry & Material Templates"** tab and click **"+ Add New Section"** (or click the 1-click Quick-Load buttons) for **Telecom New Connection (ITU-T G.984)**, **Water Supply (ISO 4064)**, **Electrical Power (IEC 60364)**, **Solar PV (IEC 62446)**, or **Standard EPC Project**, plus unlimited **"+ Add Field"** custom fields and **Default Material Template (BOM)**.
   - **"Main Project -> Under New Connections" Across All 4 Utility Sections & "ALL AREAS" Branch Option**:
     1) In **Telecom, Water, Electrical, and Solar New Connection** sections, projects can be registered in 3 modes: **Standalone New Connection**, **\u{1F3E2} Main Project (For New Connections)** (umbrella project receiving bulk Client FOC), or **\u21B3 Under Main Project (New Connection)**.
     2) When registering any project, users select a specific **Assigned Site Branch *** OR choose **"\u{1F310} ALL AREAS (All Site Branches)"** for multi-site / island-wide projects so **any Site Branch** can request its Client FOC and log daily usage without branch locks.

6. **Material Usage / Daily Progress Entry ("Material Usage / Daily Progress Entry")**:
   - **Strict Active-Site-Only vs. "ALL AREAS" Stock Usage Rule**: A team can only consume materials issued under the project's own Site Branch \u2014 unless the project or its Parent Main Project is assigned to **"\u{1F310} ALL AREAS"**, in which case any site branch's field teams can log usage. Unreturned stock from a previous site (**"Stock to Return - [Previous Site Name]"**) is always excluded on a new site.
   - **Connection & Utility Sections (Telecom, Water, Electric, Solar) \u2014 Simple 1, 2, 3 Workflow & Section-Filtered FOC**:
     1) **Step 1 \u2014 Team & Area Selection (Locked Until Refresh)**: Select Site Branch, Field Team, and Working Area at the top and click **"Confirm & Lock Team / Area"**.
     2) **Step 2 \u2014 Select Connection or "+ Register New Connection" + Smart Section-Filtered FOC**: When linking a New Connection to a Main Project FOC pool, FOC dropdowns **ONLY appear if Client FOC stock exists AND filter strictly to Main Projects registered under the active section** (Telecom NC only shows Telecom NC FOC Main Projects, Water only shows Water FOC Main Projects, etc., keeping normal Company Stock workflows clean).
     3) **Step 3 \u2014 Material Usage**: Enter **Qty Used** + **Wastage Qty** (auto-deducts from Parent Main Project FOC pool).
   - **Full Site Reports & Reconciliation**: In **Usage Vouchers History**, select any project and click **"Full Report for This Site (Project)"** for **Part 1 (Team-by-Team Subtotals)** and **Part 2 (Consolidated Grand Total)**.

7. **Multi-Item Batch Returns in Team Returns ("Team Returns") & Branch Returns ("Branch Returns")**:
   - **Team Returns (RV) & Branch Returns (BRM) with Item Photos in Dropdowns**: Item thumbnail images display inside return item dropdowns. Users can add **multiple items at once** (**"+ Add Item"**, **"+ Add All Held / Available"**, or barcode scan), set per-item quantity and condition (**Good** / **Damaged**), and submit the entire batch on a single **RV** or **BRM** voucher.

8. **Document Templates ("Document Templates"), Admin Password Delete Protection & Enterprise Controls**:
   - **Document Templates (3 Tabs)**:
     \u2022 **Tab 1 ("1. Section Formats")**: ISO 9001:2015 Controlled Formats (**FORMAT-01** to **FORMAT-04**) with auto-populated Tenant Company Header, optional **PDF/Image Format Upload (limited to max 1MB file size)**, 1-click Format-01/02 unification, and Live A4 Studio settings.
     \u2022 **Tab 2 ("2. Auto Tenant Header & Signers")**: Company Logo & **ISO Signer Names, Designations & Department Matrix** (**Prepared & Checked By**, **Authorized & Approved By**, **Reviewed By**).
     \u2022 **Tab 3 ("3. Digital Signatures")**: Draw on the interactive signature pad or upload a PNG/JPG signature image; auto-matches signers on vouchers and supports isolated single-click A4 printing (with **"Print with Image"** option).
   - **Mandatory Admin Password Verification for Any Deletion**: Deleting any record or transaction across the entire system requires entering the **Admin Password** in the confirmation modal (never deletes on a simple click).
   - **Audit Trail & Recycle Bin**: Filterable chronological history with isolated A4 Print & CSV export; restore or permanently delete soft-deleted records.
   - **Automatic Email Verification & Support**: Clicking **"Send Verification Email"** sends a Firebase link from **apexstox.com**; clicking the email link verifies the account automatically. Official domain: **apexstox.com** | Support email: **support@apexstox.com**.
   - **System Backups & Config (Top Header)**: Create/restore backups, open the **Offline Backup Viewer**, run **Admin System Flush**, change theme/company settings, or use **Admin View-As Mode**.`;
var responseCache = /* @__PURE__ */ new Map();
var MAX_CACHE_ENTRIES = 300;
var CACHE_TTL_MS = 30 * 60 * 1e3;
function getNormalizedCacheKey(message, langPref, currentTab, userRole) {
  const cleanMsg = message.trim().toLowerCase().replace(/\s+/g, " ");
  return `${langPref}|${userRole}|${currentTab}|${cleanMsg}`;
}
function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry;
}
function setCachedResponse(key, entry) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, entry);
}
var inFlightRequests = /* @__PURE__ */ new Map();
var activeAiCalls = 0;
var HIGH_LOAD_THRESHOLD = 4;
var clientBurstMap = /* @__PURE__ */ new Map();
function checkClientFairRate(clientId) {
  const now = Date.now();
  const windowMs = 1e4;
  const maxPerWindow = 12;
  const record = clientBurstMap.get(clientId);
  if (!record || now - record.windowStart > windowMs) {
    clientBurstMap.set(clientId, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= maxPerWindow) {
    return false;
  }
  record.count += 1;
  return true;
}
function detectSuggestedModule(text) {
  const lower = text.toLowerCase();
  if (lower.includes("format setting") || lower.includes("document template") || lower.includes("letterhead") || lower.includes("digital signature") || lower.includes("signature") || lower.includes("signer") || lower.includes("iso 9001") || lower.includes("section format")) {
    return "templates";
  }
  if (lower.includes("stock to return") || lower.includes("temporary assigned") || lower.includes("team transfer") || lower.includes("transfer team") || lower.includes("team in-hand") || lower.includes("team inhand")) {
    return "team-stock";
  }
  if (lower.includes("section registry") || lower.includes("project section") || lower.includes("material template") || lower.includes("bom") || lower.includes("register project") || lower.includes("project registry") || lower.includes("main project") || lower.includes("major project") || lower.includes("sub project") || lower.includes("sub-project") || lower.includes("individual project")) {
    return "projects";
  }
  if (lower.includes("material usage") || lower.includes("daily progress") || lower.includes("project usage") || lower.includes("wastage") || lower.includes("full report") || lower.includes("full site") || lower.includes("usage vouchers") || lower.includes("reconciliation") || lower.includes("reconcile") || lower.includes("boq")) {
    return "project-usage";
  }
  if (lower.includes("client free") || lower.includes("free stock") || lower.includes("foc")) return "client-free-stock";
  if (lower.includes("transfer") || lower.includes("request") || lower.includes("requisition")) return "requests";
  if (lower.includes("grn") || lower.includes("main stock") || lower.includes("main central stock")) return "main-stock";
  if (lower.includes("supplier") || lower.includes("purchase order") || lower.includes("debit note")) return "procurement";
  if (lower.includes("issue to team") || lower.includes("dispatch")) return "dispatch";
  if (lower.includes("team return")) return "returns";
  if (lower.includes("branch return")) return "branch-returns";
  if (lower.includes("user") || lower.includes("login") || lower.includes("password") || lower.includes("role")) return "manage-users";
  if (lower.includes("team")) return "teams";
  if (lower.includes("site") || lower.includes("branch")) return "site-stock";
  if (lower.includes("recycle") || lower.includes("delete")) return "recycle-bin";
  if (lower.includes("item") || lower.includes("barcode") || lower.includes("excel") || lower.includes("print with image")) return "items";
  return void 0;
}
async function queryGeminiWithFallback(userMessage, history, context) {
  const ai = getAiClient();
  if (!ai) {
    const localAns2 = resolveSmartSystemSupportAnswer(userMessage, context);
    return { ...localAns2, modelUsed: "system-expert-kb" };
  }
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  const contextLine = `
[Current Live User Context: User="${context.userName || "User"}", Role="${context.userRole || "Staff"}", ActiveScreen="${context.currentTab || "dashboard"}", AssignedBranch="${context.branchName || "All Branches"}", LanguagePreference="${context.language || "en"}", ActiveItems=${context.activeItemsCount ?? 0}, LowStockItems=${context.lowStockItemsCount ?? 0}, ActiveBranches=${context.activeSitesCount ?? 0}, ActiveTeams=${context.activeTeamsCount ?? 0}, ActiveProjects=${context.activeProjectsCount ?? 0}, ActiveProjectSections=${context.activeProjectSectionsCount ?? 0}, PendingRequests=${context.pendingRequestsCount ?? 0}]`;
  const conversationTranscript = recentHistory.map((m) => `${m.role === "user" ? "User" : "Support Agent"}: ${m.text}`).join("\n");
  const fullPrompt = `${contextLine}
${conversationTranscript ? `Recent Chat:
${conversationTranscript}

` : ""}User Question: ${userMessage}`;
  const primaryModel = activeAiCalls >= HIGH_LOAD_THRESHOLD ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
  const fallbackModel = primaryModel === "gemini-4-hydrogen" ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
  const modelsToTry = [primaryModel, fallbackModel];
  activeAiCalls += 1;
  try {
    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        const configObj = {
          systemInstruction: SYSTEM_KNOWLEDGE_PROMPT
        };
        if (modelName === "gemini-4-hydrogen") {
          configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
          config: configObj
        });
        const replyText = (response.text || "").trim();
        if (replyText) {
          return {
            reply: replyText,
            suggestedTab: detectSuggestedModule(`${userMessage} ${replyText}`),
            modelUsed: modelName
          };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Chat System Support] Model ${modelName} attempt failed:`, errMsg);
        if (i < modelsToTry.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  } finally {
    activeAiCalls = Math.max(0, activeAiCalls - 1);
  }
  const localAns = resolveSmartSystemSupportAnswer(userMessage, context);
  return { ...localAns, modelUsed: "system-expert-kb" };
}
app.post("/api/support-chat", async (req, res) => {
  try {
    const bearer = extractBearerToken(req);
    const session = verifySessionToken(bearer);
    if (!session) {
      res.status(401).json({ error: "Authentication session required." });
      return;
    }
    const { message, history = [], context = {}, clientId = "anon" } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message is required." });
      return;
    }
    const trimmedMessage = message.trim().slice(0, 1200);
    const ipOrClient = `${session.tenantId}:${session.sub}:${String(clientId || req.ip || "anon")}`;
    const safeContext = {
      userName: context?.userName || "User",
      userRole: context?.userRole || "Staff",
      currentTab: context?.currentTab || "dashboard",
      branchName: context?.branchName || "All Branches",
      language: context?.language === "si" ? "si" : "en",
      activeItemsCount: Number(context?.activeItemsCount || 0),
      lowStockItemsCount: Number(context?.lowStockItemsCount || 0),
      lowStockItemNames: Array.isArray(context?.lowStockItemNames) ? context.lowStockItemNames : [],
      activeSitesCount: Number(context?.activeSitesCount || 0),
      activeTeamsCount: Number(context?.activeTeamsCount || 0),
      activeProjectsCount: Number(context?.activeProjectsCount || 0),
      activeProjectSectionsCount: Number(context?.activeProjectSectionsCount || 0),
      projectSectionNames: Array.isArray(context?.projectSectionNames) ? context.projectSectionNames : [],
      pendingRequestsCount: Number(context?.pendingRequestsCount || 0)
    };
    if (!checkClientFairRate(ipOrClient)) {
      res.status(429).json({
        reply: safeContext.language === "si" ? "\u0D94\u0DB6 \u0D89\u0DAD\u0DCF \u0DC0\u0DDA\u0D9C\u0DBA\u0DD9\u0DB1\u0DCA \u0DB4\u0DAB\u0DD2\u0DC0\u0DD2\u0DA9 \u0DBA\u0DC0\u0DB8\u0DD2\u0DB1\u0DCA \u0DC3\u0DD2\u0DA7\u0DD3. \u0D9A\u0DBB\u0DD4\u0DAB\u0DCF\u0D9A\u0DBB \u0DAD\u0DAD\u0DCA\u0DB4\u0DBB \u0D9A\u0DD2\u0DC4\u0DD2\u0DB4\u0DBA\u0D9A\u0DCA \u0DBB\u0DD0\u0DB3\u0DD3 \u0DB1\u0DD0\u0DC0\u0DAD \u0D8B\u0DAD\u0DCA\u0DC3\u0DCF\u0DC4 \u0D9A\u0DBB\u0DB1\u0DCA\u0DB1." : "You are sending messages too quickly. Please wait a few seconds and try again.",
        modelUsed: "rate-guard"
      });
      return;
    }
    const cacheKey = getNormalizedCacheKey(
      trimmedMessage,
      safeContext.language,
      String(safeContext.currentTab || ""),
      String(safeContext.userRole || "")
    );
    if (!Array.isArray(history) || history.length <= 2) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        res.json({
          reply: cached.reply,
          suggestedTab: cached.suggestedTab,
          modelUsed: `${cached.modelUsed} (cached)`,
          cached: true
        });
        return;
      }
    }
    let pendingPromise = inFlightRequests.get(cacheKey);
    if (!pendingPromise) {
      pendingPromise = queryGeminiWithFallback(trimmedMessage, history, safeContext).finally(() => {
        inFlightRequests.delete(cacheKey);
      });
      inFlightRequests.set(cacheKey, pendingPromise);
    }
    const result = await pendingPromise;
    setCachedResponse(cacheKey, {
      reply: result.reply,
      suggestedTab: result.suggestedTab,
      modelUsed: result.modelUsed,
      timestamp: Date.now()
    });
    res.json(result);
  } catch (error) {
    console.error("[Chat System Support Route Error]:", error);
    const fallbackCtx = {
      language: req.body?.context?.language === "si" ? "si" : "en",
      userRole: req.body?.context?.userRole,
      currentTab: req.body?.context?.currentTab,
      branchName: req.body?.context?.branchName
    };
    const fallback = resolveSmartSystemSupportAnswer(String(req.body?.message || ""), fallbackCtx);
    res.json({ ...fallback, modelUsed: "system-expert-kb" });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    activeAiCalls,
    cacheSize: responseCache.size,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
async function startServer() {
  const distPath = path.join(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite middleware not loaded, falling back to static dist if available:", e);
    }
  }
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  app.get("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application build in progress or dist/index.html not found.");
    }
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
