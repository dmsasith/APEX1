import {
  ProjectType,
  SectionCoreFieldLabels,
  SectionCustomFieldDef,
  SectionIndustryPreset,
} from '../types';

export interface IndustrySectionTemplatePreset {
  presetId: SectionIndustryPreset;
  title: string;
  shortBadge: string;
  defaultSectionName: string;
  defaultCode: string;
  defaultColor: string;
  defaultWorkflowMode: 'new_connection' | 'standard';
  defaultDescription: string;
  standardReference: string;
  coreFieldLabels: SectionCoreFieldLabels;
  defaultCustomFields: SectionCustomFieldDef[];
}

export const INDUSTRY_SECTION_PRESETS: Record<SectionIndustryPreset, IndustrySectionTemplatePreset> = {
  telecom_nc: {
    presetId: 'telecom_nc',
    title: 'Telecom New Connection (FTTH / Fiber)',
    shortBadge: 'Telecom / FTTH',
    defaultSectionName: 'Telecom New Connection',
    defaultCode: 'TNC',
    defaultColor: 'emerald',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'FTTH GPON/XGS-PON subscriber drop fiber, ONT/ONU installation, rosette termination & customer line commissioning.',
    standardReference: 'ITU-T G.984 / FTTH Council International Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Customer FTTH / NC Number *',
      primaryIdPlaceholder: 'e.g. FTTH-NC-00142 / NC-88420 / circuit ID',
      serialNoLabel: '2. ONT / ONU Serial No',
      serialNoPlaceholder: 'e.g. HWTC-48575443 / ZTEG-9012',
      customerNameLabel: '3. Customer / Subscriber Name *',
      customerNamePlaceholder: 'e.g. K. A. Sunil Perera',
      addressLabel: '4. Customer Installation Address',
      addressPlaceholder: 'e.g. No. 45/B, Galle Road, Kalutara North',
      mobileLabel: '5. Customer Mobile No',
      areaLabel: '6. Exchange Area / OLT Zone *',
      areaPlaceholder: 'e.g. Kalutara (KLL), Maharagama Exchange',
      bannerTitle: 'Telecom New Connection (FTTH / NC) Subscriber Details',
      bannerSubtitle:
        'Enter the subscriber connection & ONT commissioning fields below to register this Telecom line.',
      badgeLabel: 'Telecom NC Format',
    },
    defaultCustomFields: [
      {
        id: 'telecom_fdp_port',
        label: 'FDP / FAT / Splitter Box & Port No',
        placeholder: 'e.g. FDP-KLL-14 / Splitter-02 / Port-06',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'telecom_optical_power',
        label: 'Optical Rx Signal Power (dBm)',
        placeholder: 'e.g. -18.5 dBm (Acceptable: -15 to -25 dBm)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'telecom_service_package',
        label: 'Service Type / Voice & Broadband Package',
        placeholder: 'e.g. FTTH Triple Play 100Mbps + VoIP + IPTV',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  water_project: {
    presetId: 'water_project',
    title: 'Water Supply & Utility Connection',
    shortBadge: 'Water Project',
    defaultSectionName: 'Water Supply & Connection Project',
    defaultCode: 'WTR',
    defaultColor: 'blue',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Potable water service connections, water meter installation, HDPE/uPVC distribution tapping & pressure testing (ISO 4064 / AWWA).',
    standardReference: 'ISO 4064 / AWWA Utility Water Connection Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Water Account / Application No *',
      primaryIdPlaceholder: 'e.g. WTR-CON-2026-0412 / Acct #883019',
      serialNoLabel: '2. Water Meter Serial No & Make',
      serialNoPlaceholder: 'e.g. WM-ITRON-774120 / Class-C DN15',
      customerNameLabel: '3. Consumer / Applicant Name *',
      customerNamePlaceholder: 'e.g. M. R. Nimal Fernando',
      addressLabel: '4. Premises / Service Address',
      addressPlaceholder: 'e.g. No. 112, Temple Road, Panadura',
      mobileLabel: '5. Consumer Mobile No',
      areaLabel: '6. WSS Zone / DMA / Distribution Area *',
      areaPlaceholder: 'e.g. Kalutara WSS - DMA Zone 03',
      bannerTitle: 'Water Supply Connection & Meter Commissioning Details',
      bannerSubtitle:
        'International water utility connection details (ISO 4064 meter serial, pipe size, pressure & initial reading).',
      badgeLabel: 'Water Utility Format',
    },
    defaultCustomFields: [
      {
        id: 'water_pipe_diameter',
        label: 'Pipe Diameter & Material Class (DN / PN)',
        placeholder: 'e.g. DN20 (1/2") uPVC PN16 / HDPE PE100 SDR11',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'water_tariff_category',
        label: 'Connection Tariff Category',
        placeholder: 'e.g. Domestic / Commercial / Industrial / Bulk',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'water_initial_reading',
        label: 'Initial Meter Reading (m³) & Line Pressure (Bar)',
        placeholder: 'e.g. 00000.00 m³ @ 2.4 Bar Static Pressure',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'water_ferrule_main',
        label: 'Distribution Main Size & Ferrule / Saddle Size',
        placeholder: 'e.g. 110mm PVC Main — 110×20mm Electrofusion Saddle',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  electric_project: {
    presetId: 'electric_project',
    title: 'Electrical Power & Service Connection',
    shortBadge: 'Electric Project',
    defaultSectionName: 'Electrical Power & Service Connection',
    defaultCode: 'ELC',
    defaultColor: 'amber',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'LV/MV electrical consumer service connections, smart kWh energy meter installation, overhead ABC / underground cable & earthing (IEC 60364).',
    standardReference: 'IEC 60364 / IEEE Power Distribution & Metering Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Consumer Account / Service Order No *',
      primaryIdPlaceholder: 'e.g. ELC-SRV-44021 / Acct #71049281',
      serialNoLabel: '2. Energy Meter Serial No (kWh / Smart)',
      serialNoPlaceholder: 'e.g. EM-LGYR-994012 / EDMI-3P-4410',
      customerNameLabel: '3. Consumer / Account Holder Name *',
      customerNamePlaceholder: 'e.g. S. P. Jayasinghe / Apex Commercial Complex',
      addressLabel: '4. Service Installation Address',
      addressPlaceholder: 'e.g. No. 78, High Level Road, Nugegoda',
      mobileLabel: '5. Consumer Mobile No',
      areaLabel: '6. Transformer Substation / Feeder / Pole No *',
      areaPlaceholder: 'e.g. Sub #AZ-104 / Feeder 02 / Pole LT-18',
      bannerTitle: 'Electrical Service Connection & Metering Details (IEC Standard)',
      bannerSubtitle:
        'Record consumer account, kWh energy meter serial, phase/voltage supply, breaker rating & earthing resistance.',
      badgeLabel: 'Electrical Utility Format',
    },
    defaultCustomFields: [
      {
        id: 'elec_phase_voltage',
        label: 'Supply Phase, Voltage & Current Rating',
        placeholder: 'e.g. Single Phase 230V 30A / Three Phase 400V 60A',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'elec_contract_demand',
        label: 'Contract Demand (kVA) & Main Breaker (MCB / MCCB)',
        placeholder: 'e.g. 21 kVA — 32A 4-Pole MCB + 30mA RCCB',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'elec_earth_resistance',
        label: 'Earth Electrode Resistance (Ω) & Insulation Test',
        placeholder: 'e.g. 2.1 Ω (< 5 Ω IEC Standard) / >100 MΩ @ 500V',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'elec_meter_seal_reading',
        label: 'Utility Security Seal No & Initial Reading (kWh)',
        placeholder: 'e.g. Seal #CEB-88120 / Initial: 00001.2 kWh',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  solar_project: {
    presetId: 'solar_project',
    title: 'Solar PV & Net-Metering Project',
    shortBadge: 'Solar Project',
    defaultSectionName: 'Solar PV & Renewable Energy Project',
    defaultCode: 'SLR',
    defaultColor: 'purple',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'On-Grid, Hybrid & Off-Grid Solar PV array installation, string/hybrid inverter commissioning, battery storage & bi-directional net metering (IEC 62446).',
    standardReference: 'IEC 62446 / UL 1741 Solar PV Commissioning Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Solar Project ID / Net-Metering Ref No *',
      primaryIdPlaceholder: 'e.g. SLR-NM-2026-084 / Utility Net-Ref #9921',
      serialNoLabel: '2. Solar Inverter Serial No & Model',
      serialNoPlaceholder: 'e.g. Huawei SUN2000-10KTL-M1 — S/N: HV23901182',
      customerNameLabel: '3. Client / Roof Owner Name *',
      customerNamePlaceholder: 'e.g. Dr. H. M. Wijeratne / GreenLine Factory',
      addressLabel: '4. Site / Roof Installation Address',
      addressPlaceholder: 'e.g. No. 24, Lake Drive, Rajagiriya (GPS: 6.912, 79.891)',
      mobileLabel: '5. Client Mobile No',
      areaLabel: '6. Grid Substation & Net-Metering Scheme *',
      areaPlaceholder: 'e.g. Net Accounting / Net Plus — Grid Feeder Sub-07',
      bannerTitle: 'Solar PV System & Inverter Commissioning Details (IEC 62446)',
      bannerSubtitle:
        'Capture Solar PV capacity (kWp), inverter serial, PV module string spec, battery storage & net-meter export ID.',
      badgeLabel: 'Solar PV Format',
    },
    defaultCustomFields: [
      {
        id: 'solar_system_capacity',
        label: 'System Capacity (kWp DC / kW AC) & System Type',
        placeholder: 'e.g. 11.0 kWp DC / 10.0 kW AC — On-Grid / Hybrid',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'solar_pv_modules',
        label: 'PV Module Make, Wattage & Total Panel Count',
        placeholder: 'e.g. Jinko Tiger Neo 550W N-Type × 20 Panels (2 Strings)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'solar_battery_bess',
        label: 'Battery Energy Storage (kWh / Serial) — If Hybrid',
        placeholder: 'e.g. LUNA2000 10.0 kWh LiFePO4 (or N/A — On-Grid Only)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'solar_bidirectional_meter',
        label: 'Bi-Directional Import/Export Meter No & Voc/Isc Test',
        placeholder: 'e.g. Export Meter #BM-44901 / String 1 Voc: 465V DC',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  standard: {
    presetId: 'standard',
    title: 'Standard / Custom Engineering Project',
    shortBadge: 'Standard / Custom',
    defaultSectionName: '',
    defaultCode: '',
    defaultColor: 'teal',
    defaultWorkflowMode: 'standard',
    defaultDescription:
      'Main Project, Sub-Project & Individual Project structure with customizable technical data fields.',
    standardReference: 'ISO 21500 / EPC Engineering Project Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Project / Connection / Order ID *',
      primaryIdPlaceholder: 'e.g. PRJ-2026-001 / JOB-1042',
      serialNoLabel: '2. Equipment / Meter / Device Serial No',
      serialNoPlaceholder: 'e.g. S/N-884920 / Asset Tag',
      customerNameLabel: '3. Customer / Client Name *',
      customerNamePlaceholder: 'e.g. Client or Subscriber Name',
      addressLabel: '4. Site / Installation Address',
      addressPlaceholder: 'e.g. Physical Site Street Address',
      mobileLabel: '5. Contact Mobile No',
      areaLabel: '6. Operational Zone / Sub-Area *',
      areaPlaceholder: 'e.g. District / Zone / Exchange Area',
      bannerTitle: 'Project & Connection Technical Details',
      bannerSubtitle: 'Enter the required project/connection identifiers and custom technical parameters below.',
      badgeLabel: 'Custom Section Format',
    },
    defaultCustomFields: [],
  },
};

export function inferSectionIndustryPreset(
  section?: Pick<ProjectType, 'id' | 'name' | 'code' | 'workflowMode' | 'industryPreset'> | null,
  nameFallback?: string
): SectionIndustryPreset {
  if (section?.industryPreset && INDUSTRY_SECTION_PRESETS[section.industryPreset]) {
    return section.industryPreset;
  }
  const name = (section?.name || nameFallback || '').trim().toLowerCase();
  const code = (section?.code || '').trim().toUpperCase();

  if (name.includes('water') || code === 'WTR' || code.startsWith('WTR-')) {
    return 'water_project';
  }
  if (
    name.includes('electric') ||
    name.includes('power') ||
    name.includes('grid') ||
    code === 'ELC' ||
    code === 'PWR'
  ) {
    return 'electric_project';
  }
  if (name.includes('solar') || name.includes('pv') || code === 'SLR') {
    return 'solar_project';
  }
  if (
    section?.id === 'pt-tnc' ||
    code === 'TNC' ||
    code === 'NC' ||
    code === 'FTTH-NC' ||
    name.includes('new connection') ||
    name.includes('telecom') ||
    section?.workflowMode === 'new_connection'
  ) {
    return section?.workflowMode === 'standard' ? 'standard' : 'telecom_nc';
  }
  return 'standard';
}

export function getEffectiveSectionCoreLabels(
  section?: ProjectType | null,
  nameFallback?: string
): SectionCoreFieldLabels {
  const presetKey = inferSectionIndustryPreset(section, nameFallback);
  const preset = INDUSTRY_SECTION_PRESETS[presetKey] || INDUSTRY_SECTION_PRESETS.telecom_nc;
  if (section?.coreFieldLabels) {
    return {
      ...preset.coreFieldLabels,
      ...section.coreFieldLabels,
    };
  }
  return preset.coreFieldLabels;
}

export function getEffectiveSectionCustomFields(
  section?: ProjectType | null,
  nameFallback?: string
): SectionCustomFieldDef[] {
  if (section && Array.isArray(section.customFields)) {
    return section.customFields;
  }
  const presetKey = inferSectionIndustryPreset(section, nameFallback);
  if (presetKey !== 'standard') {
    return INDUSTRY_SECTION_PRESETS[presetKey].defaultCustomFields;
  }
  return [];
}

export interface Card1WorkAreaMeta {
  label: string;
  cleanLabel: string;
  placeholder: string;
}

export function getEffectiveCard1WorkAreaMeta(
  section?: ProjectType | null,
  nameFallback?: string
): Card1WorkAreaMeta {
  const presetKey = inferSectionIndustryPreset(section, nameFallback);
  const nameLower = (section?.name || nameFallback || '').trim().toLowerCase();

  switch (presetKey) {
    case 'telecom_nc':
      return {
        label: 'Exchange / LEA Area *',
        cleanLabel: 'Exchange / LEA Area',
        placeholder: 'e.g. Kalutara (KLL) / LEA-04 / OLT Zone',
      };
    case 'water_project':
      return {
        label: 'WSS Zone / DMA Area *',
        cleanLabel: 'WSS Zone / DMA Area',
        placeholder: 'e.g. Kalutara WSS / DMA Zone 03 / Scheme',
      };
    case 'electric_project':
      return {
        label: 'Substation / Feeder / Transformer Area *',
        cleanLabel: 'Substation / Feeder / Transformer Area',
        placeholder: 'e.g. Sub #AZ-104 / Feeder 02 / Pole Zone',
      };
    case 'solar_project':
      return {
        label: 'Grid Feeder / Solar Site Zone *',
        cleanLabel: 'Grid Feeder / Solar Site Zone',
        placeholder: 'e.g. Grid Feeder Sub-07 / Zone West',
      };
    case 'standard':
    default: {
      if (
        nameLower.includes('cable') ||
        nameLower.includes('fiber') ||
        nameLower.includes('fibre') ||
        nameLower.includes('telecom') ||
        nameLower.includes('ftth') ||
        nameLower.includes('lea') ||
        nameLower.includes('exchange') ||
        nameLower.includes('shifting')
      ) {
        return {
          label: 'Exchange / LEA / Work Route *',
          cleanLabel: 'Exchange / LEA / Work Route',
          placeholder: 'e.g. Kalutara (KLL) / LEA-04 / Route Section',
        };
      }
      if (
        nameLower.includes('water') ||
        nameLower.includes('pipe') ||
        nameLower.includes('plumb')
      ) {
        return {
          label: 'WSS Zone / DMA Area *',
          cleanLabel: 'WSS Zone / DMA Area',
          placeholder: 'e.g. WSS Zone 03 / Distribution Line',
        };
      }
      if (
        nameLower.includes('electric') ||
        nameLower.includes('power') ||
        nameLower.includes('grid')
      ) {
        return {
          label: 'Substation / Feeder Area *',
          cleanLabel: 'Substation / Feeder Area',
          placeholder: 'e.g. Sub #AZ-104 / Feeder 02',
        };
      }
      if (
        nameLower.includes('civil') ||
        nameLower.includes('road') ||
        nameLower.includes('construct') ||
        nameLower.includes('trench') ||
        nameLower.includes('building')
      ) {
        return {
          label: 'Work Zone / Chainage / Site Sector *',
          cleanLabel: 'Work Zone / Chainage / Site Sector',
          placeholder: 'e.g. Sector B / Km 12+400 / Route 02',
        };
      }
      return {
        label: 'Work Area / Operational Zone *',
        cleanLabel: 'Work Area / Operational Zone',
        placeholder: 'e.g. Work Site / Zone / Sub-Area',
      };
    }
  }
}
