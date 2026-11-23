import { OFFICIAL_SUPPORT_EMAIL, OFFICIAL_SYSTEM_DOMAIN, OFFICIAL_SYSTEM_URL } from '../../firebase';

export type LegalDocId = 'privacy' | 'refund' | 'terms';

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: { label: string; text: string }[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface LegalDocumentContent {
  id: LegalDocId;
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  summary: string;
  sections: LegalSection[];
}

export interface LegalPricingSnapshot {
  trialDays: number;
  monthlyPriceFormatted: string;
  annualPriceClean: string;
  annualPriceFormatted: string;
  annualSavingsPercent: number;
  includedSiteBranches?: number;
  extraSiteMonthlyPriceFormatted?: string;
  extraSiteAnnualPriceFormatted?: string;
}

export function getLegalDocuments(
  rawPricing: LegalPricingSnapshot
): Record<LegalDocId, LegalDocumentContent> {
  const pricing = {
    ...rawPricing,
    includedSiteBranches: rawPricing.includedSiteBranches ?? 20,
    extraSiteMonthlyPriceFormatted: rawPricing.extraSiteMonthlyPriceFormatted ?? '10.00',
    extraSiteAnnualPriceFormatted: rawPricing.extraSiteAnnualPriceFormatted ?? '120.00',
  };
  const effectiveDate = 'November 20, 2026';
  const lastUpdated = 'November 20, 2026';

  return {
    privacy: {
      id: 'privacy',
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      shortTitle: 'Privacy Policy',
      subtitle:
        'How Apex Stock Enterprise SaaS collects, isolates, protects, and processes workspace, inventory, project, and user information.',
      effectiveDate,
      lastUpdated,
      version: '2026.1',
      summary:
        'Apex Stock is engineered on a strict multi-tenant architecture. Your company owns 100% of its inventory catalogs, purchase orders, Client FOC balances, field team custody records, and uploaded letterheads. We never sell or share tenant operational data with third parties or rival organizations.',
      sections: [
        {
          id: 'privacy-scope',
          number: '01',
          title: 'Scope, Service Provider & Definitions',
          paragraphs: [
            `This Privacy Policy describes how Apex Developer ("we", "us", or "our"), operator of the Apex Stock & Site Management System (${OFFICIAL_SYSTEM_URL}), collects, stores, uses, and protects personal and operational business information across our web platform, cloud synchronization services, and client workspaces.`,
            `When a subscribing company ("Tenant" or "Customer") creates a private workspace on ${OFFICIAL_SYSTEM_DOMAIN}, the Customer acts as the data controller for its internal employee, supplier, client, and field crew records, while Apex Developer acts as the cloud data processor providing isolated storage, authentication, reporting, and synchronization infrastructure.`,
          ],
        },
        {
          id: 'privacy-collection',
          number: '02',
          title: 'Information We Collect & Process',
          paragraphs: [
            'We collect only the information necessary to provision secure multi-tenant workspaces, authenticate authorized personnel, execute inventory and project workflows, and verify subscription billing.',
          ],
          table: {
            headers: ['Category', 'Data Elements Processed', 'Operational Purpose'],
            rows: [
              [
                'Workspace & Account Identity',
                'Company name, workspace code (slug), administrator full name, work email, recovery email, contact phone, business address, company logo/monogram.',
                'Tenant provisioning, workspace routing, ISO document headers, email verification, and password recovery.',
              ],
              [
                'Staff & Field Crew Directory',
                'Usernames, roles (Super Admin Central, All Site Branch Admin, Branch Admin, Branch System User), assigned branch IDs, team leader names, NIC/ID numbers, and contact phone numbers.',
                'Branch-locked access control (RBAC), field crew stock custody ledgers, and printable dispatch vouchers.',
              ],
              [
                'Inventory, PO & Client FOC Records',
                'Master SKU catalogs, item photos (<200KB), barcodes, supplier details, purchase orders (PO), GRNs, RTV debit notes, Client FOC receipts, project/sub-project usage, and wastage logs.',
                'Real-time Central-to-Site stock tracking, 5-stage Client FOC reconciliation, and A4/PDF/Excel reporting.',
              ],
              [
                'Templates & Digital Signatures',
                'Custom PDF/image company letterheads, ISO 9001:2015 signer names, designations, and drawn or uploaded digital signature images.',
                'Generating official company-branded A4 vouchers, gate passes, and reconciliation certificates.',
              ],
              [
                'Billing & Security Telemetry',
                'Subscription plan selection, bank wire/QR transaction references, uploaded payment slip filenames, email verification status, and system audit trail timestamps.',
                'Manual/automated plan activation, fraud prevention, and tamper-evident audit logging.',
              ],
            ],
          },
        },
        {
          id: 'privacy-usage',
          number: '03',
          title: 'How We Use Your Information',
          paragraphs: [
            'Information processed within Apex Stock is strictly utilized to deliver and secure the contracted SaaS platform services:',
          ],
          bullets: [
            {
              label: 'Workspace Synchronization & Operations',
              text: 'Synchronizing Central Warehouse receipts, Site Branch requisitions, Team issues/returns, and Project material usage across authorized company devices in real time.',
            },
            {
              label: 'Authentication & Password Recovery',
              text: 'Delivering account email verification links and time-limited password reset links directly to registered work or recovery email addresses without transmitting plaintext passwords.',
            },
            {
              label: 'ISO 9001:2015 Document & Reconciliation Reporting',
              text: 'Populating your official company name, logo, signer matrix, and signatures onto isolated A4 printable vouchers (RN, IN, PU, TSR, GRN, FOC, RV, BRM, PO, RTV).',
            },
            {
              label: 'Subscription Administration & Technical Support',
              text: `Verifying ${pricing.trialDays}-day trial eligibility, confirming paid Monthly/Annual subscription transfers, and resolving technical inquiries sent to ${OFFICIAL_SUPPORT_EMAIL}.`,
            },
          ],
        },
        {
          id: 'privacy-isolation',
          number: '04',
          title: 'Multi-Tenant Isolation & Security Controls',
          paragraphs: [
            'Every registered organization operates within a dedicated cryptographic tenant namespace (tenantId). Operational records stored in one company workspace are logically partitioned from all other tenants.',
          ],
          bullets: [
            {
              label: 'Transport & Cloud Encryption',
              text: 'All browser-to-cloud communications occur over encrypted HTTPS/TLS channels backed by Google Cloud and Firebase Realtime Database & Authentication infrastructure.',
            },
            {
              label: 'Role-Based & Branch-Locked Permissions',
              text: 'Branch Admins and Branch System Users are restricted at the application layer to their assigned site branches, preventing unauthorized cross-branch stock visibility or FOC usage.',
            },
            {
              label: 'Destructive Action & Credential Safeguards',
              text: 'Critical record deletions require Admin password confirmation and route recoverable items through an internal Recycle Bin. Password reset requests use time-limited token links rather than exposing stored credentials.',
            },
          ],
        },
        {
          id: 'privacy-sharing',
          number: '05',
          title: 'Data Ownership, Third-Party Processors & Zero Data Sale',
          paragraphs: [
            'Your company retains full legal ownership and intellectual property rights over all business data, catalogs, pricing, supplier relationships, client FOC records, and uploaded graphics entered into your workspace.',
            'We do NOT sell, rent, lease, or trade tenant business data or user email addresses to third parties, data brokers, or advertising networks.',
            'We rely solely on essential cloud sub-processors required to operate the platform—specifically Google Cloud Platform / Firebase (cloud hosting, real-time database synchronization, and email verification/password reset delivery) and the customer-selected payment channel when processing subscription settlements.',
          ],
        },
        {
          id: 'privacy-retention',
          number: '06',
          title: 'Data Portability, Retention & Deletion',
          paragraphs: [
            'Workspace administrators may export complete operational records anytime via the built-in 1-Click Full System JSON Backup tool, Excel/CSV exports, or A4 PDF document generation.',
            'Upon subscription cancellation or account expiration, we retain your workspace data in an encrypted, read-protected state for a 30-day grace period so your organization may renew or request a final data export. Following the 30-day grace period—or upon a verified written deletion request from the registered Workspace Owner—workspace records are permanently purged from active cloud partitions.',
          ],
        },
        {
          id: 'privacy-cookies',
          number: '07',
          title: 'Browser Storage & Session Persistence',
          paragraphs: [
            'Apex Stock uses essential browser localStorage and sessionStorage solely to maintain authenticated workspace context, active tenant identifiers, local offline resiliency caches, and user display preferences. We do not deploy third-party cross-site advertising trackers.',
          ],
        },
        {
          id: 'privacy-contact',
          number: '08',
          title: 'Your Privacy Rights & Contact Information',
          paragraphs: [
            `Authorized workspace owners and individual users may request access, correction, export, or deletion of their personal account details at any time by contacting our data protection & support desk at ${OFFICIAL_SUPPORT_EMAIL} or visiting ${OFFICIAL_SYSTEM_URL}. We respond to verified requests within 5 business days.`,
          ],
        },
      ],
    },

    refund: {
      id: 'refund',
      slug: 'refund-policy',
      title: 'Refund & Cancellation Policy',
      shortTitle: 'Refund Policy',
      subtitle:
        'Clear, transparent rules governing our risk-free trial, subscription billing, cancellations, duplicate payment reversals, and refund eligibility.',
      effectiveDate,
      lastUpdated,
      version: '2026.1',
      summary: `Every new company workspace receives an unrestricted ${pricing.trialDays}-Day Free Trial with no credit card required so your team can thoroughly evaluate all features before paying. Paid subscriptions are backed by clear protections against billing errors, duplicate transfers, and unresolved technical faults.`,
      sections: [
        {
          id: 'refund-trial',
          number: '01',
          title: `${pricing.trialDays}-Day Unrestricted Free Trial`,
          paragraphs: [
            `Apex Stock provides a complimentary ${pricing.trialDays}-day free trial for every newly registered company workspace (${OFFICIAL_SYSTEM_DOMAIN}). No credit card, bank transfer, or advance payment is required to start the trial.`,
            `During the trial, all core enterprise modules—including unlimited users, unlimited field teams, 1 Central HQ Warehouse + up to ${pricing.includedSiteBranches} regional site branches, Client FOC 5-stage reconciliation, Telecom/Water/Electrical/Solar project tracking, Purchase Orders, and ISO PDF printing—are unlocked for full evaluation before any financial commitment.`,
          ],
        },
        {
          id: 'refund-plans',
          number: '02',
          title: 'Subscription Plans & Accepted Payment Methods',
          paragraphs: [
            `Following the trial period, customers may upgrade to either the Pro Monthly Plan ($${pricing.monthlyPriceFormatted}/month) or the Pro Annual VIP Plan ($${pricing.annualPriceClean}/year, saving ${pricing.annualSavingsPercent}%), covering 1 Central HQ + ${pricing.includedSiteBranches} regional site branches. Additional regional site branches can be added anytime for $${pricing.extraSiteMonthlyPriceFormatted}/month ($${pricing.extraSiteAnnualPriceFormatted}/year) per extra site branch. Subscription settlements are processed via Bank QR transfer, direct bank wire transfer with slip verification, or authorized online checkout gateways.`,
            'All operational data, catalogs, and transactions entered during your free trial automatically carry forward upon plan activation.',
          ],
        },
        {
          id: 'refund-eligibility',
          number: '03',
          title: 'Refund Eligibility & Covered Scenarios',
          paragraphs: [
            'Because customers are given full system access during the free trial prior to payment, paid subscription fees are generally final once a billing cycle activates. However, we issue prompt 100% or pro-rated refunds under the following verified circumstances:',
          ],
          table: {
            headers: ['Scenario', 'Eligibility Window', 'Refund Resolution'],
            rows: [
              [
                '7-Day New Upgrade Technical Guarantee',
                'Within 7 calendar days of first paid Monthly or Annual upgrade',
                '100% full refund if a verified critical platform defect prevents normal workspace operation and our engineering team cannot resolve it within 48 hours of report.',
              ],
              [
                'Duplicate Payment or Overpayment',
                'Within 30 calendar days of transaction',
                '100% refund of the duplicate or excess amount upon verification of bank receipts or payment gateway transaction IDs.',
              ],
              [
                'Unauthorized or Erroneous Billing',
                'Within 30 calendar days of statement date',
                '100% refund after verifying that the charge occurred without workspace owner authorization or due to a billing system error.',
              ],
              [
                'Prolonged Unplanned Service Outage',
                'Measured across billing cycle',
                'Pro-rated service credit or partial refund if verified platform downtime exceeds 72 consecutive hours outside scheduled maintenance.',
              ],
            ],
          },
        },
        {
          id: 'refund-exclusions',
          number: '04',
          title: 'Non-Refundable Situations',
          paragraphs: [
            'To maintain fair enterprise SaaS pricing with unlimited users and zero per-seat fees, refunds are not issued for:',
          ],
          bullets: [
            {
              label: 'Mid-Cycle Monthly Cancellations',
              text: 'Partial or unused days remaining in an active Monthly billing period after the initial 7-day technical guarantee window.',
            },
            {
              label: 'Unused Active Workspaces',
              text: 'Inactivity or lack of staff login during a paid billing period where the workspace remained online and accessible.',
            },
            {
              label: 'Policy or Terms Violations',
              text: 'Accounts suspended or terminated due to verified breach of Terms & Conditions, fraudulent slip uploads, or abuse.',
            },
          ],
        },
        {
          id: 'refund-cancellation',
          number: '05',
          title: 'Subscription Cancellation & Data Access',
          paragraphs: [
            'You may cancel automatic renewal or discontinue your subscription at any time without cancellation penalties or lock-in contracts.',
            'When a paid plan is cancelled before the end of its current Monthly or Annual term, your workspace stays active through the last day of the paid period. Afterwards, we preserve your records for 30 calendar days so administrators can download JSON backups, Excel exports, or A4 PDF reports.',
          ],
        },
        {
          id: 'refund-process',
          number: '06',
          title: 'How to Submit a Refund Request & Processing Time',
          paragraphs: [
            `To request a refund or report a duplicate transfer, email ${OFFICIAL_SUPPORT_EMAIL} from your registered Workspace Admin email with the following details:`,
          ],
          bullets: [
            {
              label: 'Required Verification Details',
              text: 'Company Name, Workspace Code (slug), Payment Date, Transaction Reference Number / Bank Slip copy, and a brief explanation of the issue.',
            },
            {
              label: 'Review & Settlement Timeline',
              text: 'Our billing team reviews requests within 2–3 business days. Approved refunds are credited back to the original bank account, Bank QR source, or payment method within 5–10 business days (depending on local/interbank clearing cycles).',
            },
          ],
        },
      ],
    },

    terms: {
      id: 'terms',
      slug: 'terms-and-conditions',
      title: 'Terms & Conditions',
      shortTitle: 'Terms & Conditions',
      subtitle:
        'The governing service agreement for organizations and authorized users operating on the Apex Stock Enterprise SaaS platform.',
      effectiveDate,
      lastUpdated,
      version: '2026.1',
      summary: `By registering a company workspace or accessing ${OFFICIAL_SYSTEM_DOMAIN}, you agree to these Terms & Conditions governing your ${pricing.trialDays}-day free trial, paid subscriptions, multi-tenant access controls, Client FOC & inventory data responsibilities, and intellectual property rights.`,
      sections: [
        {
          id: 'terms-acceptance',
          number: '01',
          title: 'Acceptance of Terms & Contracting Parties',
          paragraphs: [
            `These Terms & Conditions ("Terms") form a binding agreement between the registering business entity ("Customer" or "Tenant") and Apex Developer ("Service Provider", "we", or "us"), provider of the Apex Stock & Site Management System (${OFFICIAL_SYSTEM_URL}).`,
            'The individual registering a company workspace represents and warrants that they have full authority to bind that organization to these Terms.',
          ],
        },
        {
          id: 'terms-trial-billing',
          number: '02',
          title: 'Free Trial, Subscription Pricing & Renewals',
          paragraphs: [
            `New company workspaces receive a ${pricing.trialDays}-day unrestricted free trial with no upfront payment card required. Upon trial expiration, continued operational access requires selecting either the Pro Monthly Plan ($${pricing.monthlyPriceFormatted}/month) or Pro Annual VIP Plan ($${pricing.annualPriceClean}/year — ${pricing.annualSavingsPercent}% savings) and completing payment verification.`,
          ],
          bullets: [
            {
              label: 'Workspace Capacity & Site Branch Quotas',
              text: `Active paid and trial workspaces include unlimited company user accounts, unlimited field crews, SKUs, and monthly transactions, plus 1 Central HQ Warehouse and ${pricing.includedSiteBranches} regional site branches. Additional regional site branches may be provisioned anytime at $${pricing.extraSiteMonthlyPriceFormatted}/month per extra site branch.`,
            },
            {
              label: 'Fee Adjustments',
              text: 'Published pricing applies for the duration of your active paid billing cycle. Any future pricing changes will be announced at least 30 days in advance prior to the next renewal.',
            },
          ],
        },
        {
          id: 'terms-accounts',
          number: '03',
          title: 'Workspace Administration, Roles & Account Security',
          paragraphs: [
            'The Customer is solely responsible for managing internal user permissions, safeguarding administrator credentials, and verifying staff email addresses configured for Forgot Password recovery.',
          ],
          bullets: [
            {
              label: 'Role Assignment & Branch Locks',
              text: 'Workspace Super Admins must assign appropriate permission levels (Super Admin Central, All Site Branch Admin, Branch Admin, or Branch System User) and verify site branch assignments before granting live stock access.',
            },
            {
              label: 'Authentic Payment Proofs & Reassignments',
              text: 'Uploading falsified bank transfer slips or attempting to bypass tenant isolation or Admin delete password protections is strictly prohibited and grounds for immediate workspace suspension.',
            },
          ],
        },
        {
          id: 'terms-operations',
          number: '04',
          title: 'Inventory, Client FOC Reconciliation & Operational Responsibility',
          paragraphs: [
            'Apex Stock provides structured digital workflows for Central Warehouse stock, Purchase Orders, Supplier Returns, Team In-Hand custody, Telecom/Water/Electrical/Solar daily project progress, Client-Supplied Free Stock (FOC) 5-stage reconciliation, and ISO 9001:2015 printable templates.',
            'Customer retains exclusive responsibility for verifying physical stock counts, unit prices, tax rates, wastage percentages, Client FOC returnable balances, and regulatory compliance of documents issued using your uploaded company letterheads and digital signatures. The platform is an operational management tool and does not replace certified financial auditing or legal counsel.',
          ],
        },
        {
          id: 'terms-ip',
          number: '05',
          title: 'Intellectual Property Rights',
          paragraphs: [
            'All software architecture, source code, database schemas, UI designs, ISO layout studio tools, comparison engines, documentation, and the "Apex Stock" / "Apex Developer" / "apexstox.com" trademarks belong exclusively to Apex Developer.',
            'Customer retains 100% ownership and copyright over all company logos, uploaded PDF/image stationery templates, digital signatures, item photographs, and business transaction records stored inside their workspace.',
          ],
        },
        {
          id: 'terms-acceptable-use',
          number: '06',
          title: 'Acceptable Use & Prohibited Conduct',
          paragraphs: [
            'You agree not to misuse the platform or interfere with service reliability for other tenants. Specifically, Users and Tenants shall not:',
          ],
          bullets: [
            {
              label: 'Cross-Tenant Probing',
              text: 'Attempt to access, enumerate, scrape, or reverse-engineer another company workspace, Firebase path, or authentication endpoint.',
            },
            {
              label: 'Automated Abuse & Malicious Uploads',
              text: 'Upload executable malware, excessively oversized payloads designed to degrade cloud synchronization, or execute automated denial-of-service scripts.',
            },
            {
              label: 'Unauthorized Commercial Reselling',
              text: 'Sublicense, white-label resell, or rent access to third parties outside your own corporate group without prior written reseller authorization.',
            },
          ],
        },
        {
          id: 'terms-liability',
          number: '07',
          title: 'Service Availability, Backups & Limitation of Liability',
          paragraphs: [
            'We strive for continuous cloud availability and automatic real-time synchronization. However, scheduled maintenance, regional ISP outages, or third-party cloud service disruptions may occasionally affect connectivity. Workspace Admins are encouraged to download periodic 1-Click Full System JSON Backups for independent archival assurance.',
            'To the maximum extent permitted by applicable law, Apex Developer shall not be liable for indirect, incidental, consequential, or lost-profit damages (including physical site inventory shrinkage or contractor project delays). Our aggregate direct liability for any claim arising from platform use shall not exceed the total subscription fees actually paid by the Customer during the twelve (12) months preceding the claim.',
          ],
        },
        {
          id: 'terms-termination',
          number: '08',
          title: 'Term, Termination & Policy Updates',
          paragraphs: [
            `Customer may terminate usage at any time by cancelling their subscription and exporting workspace backups. We retain workspace data for 30 days following cancellation or non-renewal before permanent purge. Refunds are governed by our Refund & Cancellation Policy.`,
            `We may update these Terms periodically to reflect platform improvements or legal requirements; material changes will be posted on ${OFFICIAL_SYSTEM_URL} with an updated effective date. Questions or legal notices may be directed to ${OFFICIAL_SUPPORT_EMAIL}.`,
          ],
        },
      ],
    },
  };
}
