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

  pantry_joinery: {
    presetId: 'pantry_joinery',
    title: 'Pantry Cupboards & Interior Joinery',
    shortBadge: 'Pantry / Joinery',
    defaultSectionName: 'Pantry Cupboards & Interior Joinery',
    defaultCode: 'PCJ',
    defaultColor: 'amber',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Modular pantry cupboards, wardrobes, boards, hinges/runners, countertop fabrication & offcut/wastage tracking across apartments and sites.',
    standardReference: 'AWI / Architectural Woodwork & Joinery Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Joinery Job / Unit Order No *',
      primaryIdPlaceholder: 'e.g. PCJ-2026-014 / Unit-A08 Kitchen',
      serialNoLabel: '2. Board Finish / Hardware Batch No',
      serialNoPlaceholder: 'e.g. EGGER-W1000 / Blum-Lot-44',
      customerNameLabel: '3. Client / Homeowner / Developer Name *',
      customerNamePlaceholder: 'e.g. Mrs. D. S. Perera / Skyline Residencies',
      addressLabel: '4. Unit / Apartment / Site Address',
      addressPlaceholder: 'e.g. Tower B, Floor 06, Apt 6B, Colombo 05',
      mobileLabel: '5. Client Mobile No',
      areaLabel: '6. Site / Building / Floor Zone *',
      areaPlaceholder: 'e.g. Skyline Tower B - Floor 06',
      bannerTitle: 'Pantry Cupboards & Interior Joinery Job Details',
      bannerSubtitle:
        'Capture unit/order ID, board & laminate specification, hardware package, and site zone for installation & offcuts tracking.',
      badgeLabel: 'Joinery / Pantry Format',
    },
    defaultCustomFields: [
      {
        id: 'joinery_board_spec',
        label: 'Board Core & Laminate Finish (MDF / Plywood / Melamine)',
        placeholder: 'e.g. 18mm Moisture-Resistant Plywood + High-Gloss Acrylic',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'joinery_countertop',
        label: 'Countertop & Splashback Material',
        placeholder: 'e.g. Engineered Quartz 20mm — Calacatta White',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'joinery_dimensions',
        label: 'Total Run Length (ft/m) & Cabinet Module Count',
        placeholder: 'e.g. 16 ft Base + 12 ft Wall (11 Modules)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'joinery_hardware',
        label: 'Hinges, Drawer Runners & Accessories Spec',
        placeholder: 'e.g. Soft-Close Concealed Hinges × 28 + Tandem Boxes × 6',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  ceiling_installation: {
    presetId: 'ceiling_installation',
    title: 'Ceiling Installation (Gypsum, PVC & T-Grid)',
    shortBadge: 'Ceiling Systems',
    defaultSectionName: 'Ceiling Installation (Gypsum, PVC & T-Grid)',
    defaultCode: 'CLG',
    defaultColor: 'indigo',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Gypsum false ceilings, PVC panel ceilings, 2x2 mineral fiber T-Grid & acoustic baffles with sheet usage, wastage/offcuts and return tracking.',
    standardReference: 'ASTM C754 / CISCA Ceiling Systems Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. Ceiling Job / Area Order No *',
      primaryIdPlaceholder: 'e.g. CLG-2026-082 / Hall-L2-North',
      serialNoLabel: '2. Board / Grid Lot / Batch Ref',
      serialNoPlaceholder: 'e.g. GYP-12MM-B42 / TGRID-24',
      customerNameLabel: '3. Client / Main Contractor Name *',
      customerNamePlaceholder: 'e.g. Horizon Office Complex / K. Silva',
      addressLabel: '4. Building / Floor / Room Address',
      addressPlaceholder: 'e.g. No. 18, Ward Place, Level 03 Conference Wing',
      mobileLabel: '5. Site Contact Mobile No',
      areaLabel: '6. Floor / Wing / Work Zone *',
      areaPlaceholder: 'e.g. Level 03 - North Wing / Lobby',
      bannerTitle: 'Ceiling Installation & Acoustic Framing Details',
      bannerSubtitle:
        'Log ceiling system type, area (sq.ft/m²), framing profiles, and lighting cutouts for accurate sheet & wastage reconciliation.',
      badgeLabel: 'Ceiling Systems Format',
    },
    defaultCustomFields: [
      {
        id: 'ceiling_system_type',
        label: 'Ceiling System Type (Gypsum / PVC / T-Grid / Acoustic)',
        placeholder: 'e.g. 12.5mm Moisture-Resistant Gypsum + Cove Drop',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'ceiling_area_drop',
        label: 'Net Ceiling Area (Sq.Ft / m²) & Plenum Drop Height',
        placeholder: 'e.g. 1,450 Sq.Ft @ 450mm Suspension Drop',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'ceiling_framing_spec',
        label: 'GI Framing / Main Tee & Wall Angle Profile',
        placeholder: 'e.g. 0.5mm GI Furring Channel @ 400mm Centers + L-Angle',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'ceiling_cutouts_access',
        label: 'LED Downlight Cutouts, AC Diffusers & Access Panels',
        placeholder: 'e.g. 24 LED Cutouts + 2 × 600x600mm Access Hatches',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  landscaping_irrigation: {
    presetId: 'landscaping_irrigation',
    title: 'Landscaping, Hardscaping & Irrigation',
    shortBadge: 'Landscaping',
    defaultSectionName: 'Landscaping, Hardscaping & Irrigation',
    defaultCode: 'LND',
    defaultColor: 'emerald',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Turfing, garden planting, interlocking pavers, hardscape kerbs & automated drip/sprinkler irrigation networks across villas, resorts & parks.',
    standardReference: 'ASLA / Irrigation Association Turf & Hardscape Std',
    coreFieldLabels: {
      primaryIdLabel: '1. Landscape / Irrigation Zone ID *',
      primaryIdPlaceholder: 'e.g. LND-ZN-04 / Villa-12 Garden',
      serialNoLabel: '2. Irrigation Pump / Controller Serial No',
      serialNoPlaceholder: 'e.g. HUNTER-PRO-C-4410 / Pump-1.5HP',
      customerNameLabel: '3. Client / Resort / Estate Name *',
      customerNamePlaceholder: 'e.g. Serendib Eco Resort / Mr. R. Jayawardena',
      addressLabel: '4. Plot / Garden / Site Address',
      addressPlaceholder: 'e.g. Plot 09, Coastal Boulevard, Bentota',
      mobileLabel: '5. Client Mobile No',
      areaLabel: '6. Garden Sector / Lawn / Plot Zone *',
      areaPlaceholder: 'e.g. Poolside Lawn Zone B / Entrance Driveway',
      bannerTitle: 'Landscaping, Hardscaping & Irrigation Details',
      bannerSubtitle:
        'Record turf area, irrigation pipe/sprinkler lines, hardscape pavers, and plant stock issued to site crews.',
      badgeLabel: 'Landscaping Format',
    },
    defaultCustomFields: [
      {
        id: 'landscape_area_turf',
        label: 'Landscape Area (Sq.Ft / m²) & Turf / Soil Spec',
        placeholder: 'e.g. 2,800 Sq.Ft Malaysian Carpet Grass + Topsoil Mix',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'landscape_irrigation',
        label: 'Irrigation Line Spec (Drip / Pop-Up Sprinkler / HDPE)',
        placeholder: 'e.g. 32mm HDPE Main + 12 × Pop-Up Rotors + Drip Line',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'landscape_hardscape',
        label: 'Hardscaping Pavers, Kerbs & Garden Lighting Spec',
        placeholder: 'e.g. 60mm Cobble Pavers (45 m²) + Concrete Kerbs',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'landscape_plants_count',
        label: 'Plants, Trees & Mulch / Pebble Volume',
        placeholder: 'e.g. Royal Palms × 6 + Hedge Shrubs × 180 + River Pebbles',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  aluminum_glazing: {
    presetId: 'aluminum_glazing',
    title: 'Aluminum Fabrication & Glazing',
    shortBadge: 'Aluminum / Glass',
    defaultSectionName: 'Aluminum Fabrication & Glazing',
    defaultCode: 'ALU',
    defaultColor: 'blue',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Curtain walls, sliding doors, casement windows, tempered glass partitions & shopfronts with profile bar length, glass & scrap tracking.',
    standardReference: 'BS EN 12600 / AAMA Architectural Fenestration Std',
    coreFieldLabels: {
      primaryIdLabel: '1. Window / Door / Curtain Wall Tag *',
      primaryIdPlaceholder: 'e.g. ALU-W04 / Shopfront-GF-02',
      serialNoLabel: '2. Glass / Profile Batch & Temper Cert No',
      serialNoPlaceholder: 'e.g. TPG-10MM-8841 / Alumex-PC-Matte',
      customerNameLabel: '3. Client / Building Owner Name *',
      customerNamePlaceholder: 'e.g. Apex Commercial Tower / A. Fernando',
      addressLabel: '4. Site / Building Elevation Address',
      addressPlaceholder: 'e.g. No. 210, Duplication Road, Colombo 03',
      mobileLabel: '5. Client Mobile No',
      areaLabel: '6. Building Elevation / Floor / Bay Zone *',
      areaPlaceholder: 'e.g. East Elevation - Floor 04 - Bay 02',
      bannerTitle: 'Aluminum Fabrication & Architectural Glazing Details',
      bannerSubtitle:
        'Track extruded aluminum profiles, tempered/DGU glass panes, hardware locksets, and offcut/scrap lengths.',
      badgeLabel: 'Aluminum & Glass Format',
    },
    defaultCustomFields: [
      {
        id: 'alu_profile_finish',
        label: 'Aluminum Profile Series & Powder-Coat / Anodized Finish',
        placeholder: 'e.g. 100mm Heavy Sliding Series — Matte Charcoal PC',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'alu_glass_spec',
        label: 'Glass Thickness & Type (Tempered / Laminated / DGU)',
        placeholder: 'e.g. 10mm Clear Toughened Safety Glass (BS EN 12600)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'alu_dimensions_qty',
        label: 'Opening Dimensions (W × H mm) & Panel Count',
        placeholder: 'e.g. 2400 × 2100 mm — 3-Track Sliding (4 Units)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'alu_hardware_sealant',
        label: 'Lockset, Rollers, Friction Stays & Silicone Spec',
        placeholder: 'e.g. Multi-Point Flush Lock + Heavy Duty Rollers + Weather Seal',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  hvac_cooling: {
    presetId: 'hvac_cooling',
    title: 'HVAC, Air Conditioning & Refrigeration',
    shortBadge: 'HVAC / AC',
    defaultSectionName: 'HVAC, Air Conditioning & Refrigeration',
    defaultCode: 'HVC',
    defaultColor: 'teal',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'Split/VRF air conditioning, chillers, cold rooms, insulated copper piping, ducting & refrigerant commissioning across commercial & residential sites.',
    standardReference: 'ASHRAE / ISO 5149 HVAC & Refrigeration Standard',
    coreFieldLabels: {
      primaryIdLabel: '1. HVAC Unit / System Tag No *',
      primaryIdPlaceholder: 'e.g. HVC-VRF-03 / FCU-L4-08',
      serialNoLabel: '2. Indoor & Outdoor Unit Serial No',
      serialNoPlaceholder: 'e.g. IDU: DK994120 / ODU: DK882104',
      customerNameLabel: '3. Client / Facility Owner Name *',
      customerNamePlaceholder: 'e.g. Lanka MedCare Hospital / K. Rajapaksa',
      addressLabel: '4. Building / Floor / Room Address',
      addressPlaceholder: 'e.g. No. 55, Kandy Road, Kadawatha — ICU Block',
      mobileLabel: '5. Facility Contact Mobile No',
      areaLabel: '6. Chiller Zone / Floor / Circuit *',
      areaPlaceholder: 'e.g. Level 02 - East Wing / VRF Loop A',
      bannerTitle: 'HVAC & Refrigeration Commissioning Details (ASHRAE)',
      bannerSubtitle:
        'Capture indoor/outdoor unit serials, BTU/TR capacity, copper pipe runs, refrigerant charge & vacuum pressure test.',
      badgeLabel: 'HVAC Utility Format',
    },
    defaultCustomFields: [
      {
        id: 'hvac_capacity_type',
        label: 'Cooling Capacity (BTU/hr / TR) & System Type',
        placeholder: 'e.g. 24,000 BTU/hr Inverter Split / 12 HP VRF Outdoor',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'hvac_copper_insulation',
        label: 'Copper Pipe Sizes (Liquid / Suction) & Armaflex Insulation',
        placeholder: 'e.g. 3/8" & 5/8" Hard Copper (18m) + 19mm Class-0 Insulation',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'hvac_refrigerant_test',
        label: 'Refrigerant Type, N2 Pressure Test & Vacuum Micron',
        placeholder: 'e.g. R32 / R410A — 400 PSI N2 Hold + 350 Microns Vacuum',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'hvac_drain_controls',
        label: 'Condensate Drain, Ducting & Thermostat Controller',
        placeholder: 'e.g. 25mm uPVC Insulated Drain + Wired Central Controller',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  cctv_security: {
    presetId: 'cctv_security',
    title: 'CCTV, Security & Fire Alarm Systems',
    shortBadge: 'CCTV / Fire',
    defaultSectionName: 'CCTV, Security & Fire Alarm Systems',
    defaultCode: 'SEC',
    defaultColor: 'rose',
    defaultWorkflowMode: 'new_connection',
    defaultDescription:
      'IP CCTV cameras, NVR racks, biometric access control, and addressable/conventional fire alarm loops across multi-site commercial premises.',
    standardReference: 'NFPA 72 / IEC 62676 Security & Fire Alarm Std',
    coreFieldLabels: {
      primaryIdLabel: '1. Camera / Fire Node / Panel ID *',
      primaryIdPlaceholder: 'e.g. CAM-EXT-04 / FACP-ZN-02',
      serialNoLabel: '2. Device / NVR / Camera Serial & MAC',
      serialNoPlaceholder: 'e.g. HIK-DS2CD-992014 / MAC: 4C:BD:8F:12:04',
      customerNameLabel: '3. Client / Premises Name *',
      customerNamePlaceholder: 'e.g. Prime Logistics Warehouse / P. Perera',
      addressLabel: '4. Premises / Gate / Installation Point',
      addressPlaceholder: 'e.g. Gate 02 Loading Bay, Ekala Industrial Zone',
      mobileLabel: '5. Security Contact Mobile No',
      areaLabel: '6. Perimeter / Floor / Fire Loop Zone *',
      areaPlaceholder: 'e.g. Warehouse Bay B / Fire Loop 01',
      bannerTitle: 'CCTV, Access Control & Fire Alarm Installation Details',
      bannerSubtitle:
        'Log camera/panel serials, Cat6/fire-rated cable runs, PoE ports, NVR storage & zone commissioning tests.',
      badgeLabel: 'Security & Fire Format',
    },
    defaultCustomFields: [
      {
        id: 'sec_device_spec',
        label: 'Device Model & Spec (IP Cam / NVR / Smoke Detector)',
        placeholder: 'e.g. 4MP PoE Turret IP Camera + 32-Ch NVR / Optical Smoke',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'sec_cable_run',
        label: 'Cable Type, Conduit & Run Length (Cat6 / Fire-Rated)',
        placeholder: 'e.g. Cat6 FTP Outdoor 85m in 25mm PVC Conduit',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'sec_network_storage',
        label: 'PoE Switch Port / IP Address & Storage Retention',
        placeholder: 'e.g. 192.168.10.44 / PoE Port 08 / 16TB HDD (30 Days)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'sec_commissioning',
        label: 'Field of View / Fire Loop Address & Functional Test',
        placeholder: 'e.g. Loading Gate Wide View / Loop-01 Addr-14 Verified',
        required: false,
        fieldType: 'text',
      },
    ],
  },

  civil_road: {
    presetId: 'civil_road',
    title: 'Civil, Road & Municipal Maintenance',
    shortBadge: 'Civil / Road',
    defaultSectionName: 'Civil, Road & Municipal Maintenance',
    defaultCode: 'CVL',
    defaultColor: 'amber',
    defaultWorkflowMode: 'standard',
    defaultDescription:
      'Highway patching, asphalt/concrete paving, stormwater drains, culverts, kerbs & municipal civil maintenance across depots and work zones.',
    standardReference: 'ASTM / FIDIC Civil & Municipal Infrastructure Std',
    coreFieldLabels: {
      primaryIdLabel: '1. Road Section / Work Order ID *',
      primaryIdPlaceholder: 'e.g. CVL-RD-2026-09 / KM-14+200',
      serialNoLabel: '2. Batch / Mix / Machinery Asset Ref',
      serialNoPlaceholder: 'e.g. ASPHALT-MIX-04 / Roller-CAT-02',
      customerNameLabel: '3. Authority / Client / Council Name *',
      customerNamePlaceholder: 'e.g. Road Development Authority / Municipal Council',
      addressLabel: '4. Highway / Street / Chainage Location',
      addressPlaceholder: 'e.g. A02 Highway — Km 24+100 to Km 25+400',
      mobileLabel: '5. Site Engineer Mobile No',
      areaLabel: '6. Road Chainage / Municipal Ward / Sector *',
      areaPlaceholder: 'e.g. Sector B / Km 24+100 – 25+400',
      bannerTitle: 'Civil, Road & Municipal Works Details',
      bannerSubtitle:
        'Track depot-to-site bulk aggregates, bitumen, cement, drainage pipes, heavy machinery & daily section progress.',
      badgeLabel: 'Civil & Road Format',
    },
    defaultCustomFields: [
      {
        id: 'civil_chainage',
        label: 'Road Chainage / Kilometer Post (From – To)',
        placeholder: 'e.g. Ch 12+400 to Ch 13+150 (LHS Shoulder)',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'civil_mix_grade',
        label: 'Concrete / Asphalt Mix Grade & Layer Thickness',
        placeholder: 'e.g. Grade 30 Ready-Mix Concrete / 50mm Wearing Course',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'civil_drainage_kerb',
        label: 'Drainage, Culvert & Road Kerb Specification',
        placeholder: 'e.g. 600mm RCC Hume Pipe Culvert + Precast Mountable Kerbs',
        required: false,
        fieldType: 'text',
      },
      {
        id: 'civil_compaction_qa',
        label: 'Compaction Density (%) / Cube Strength QA Result',
        placeholder: 'e.g. 98.5% MDD Compaction Verified / Slump 75mm',
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
    name.includes('pantry') ||
    name.includes('cupboard') ||
    name.includes('joinery') ||
    name.includes('cabinet') ||
    code === 'PCJ'
  ) {
    return 'pantry_joinery';
  }
  if (
    name.includes('ceiling') ||
    name.includes('gypsum') ||
    name.includes('t-grid') ||
    name.includes('acoustic') ||
    code === 'CLG'
  ) {
    return 'ceiling_installation';
  }
  if (
    name.includes('landscap') ||
    name.includes('hardscap') ||
    name.includes('irrigat') ||
    name.includes('garden') ||
    code === 'LND'
  ) {
    return 'landscaping_irrigation';
  }
  if (
    name.includes('alumin') ||
    name.includes('glazing') ||
    name.includes('curtain wall') ||
    code === 'ALU'
  ) {
    return 'aluminum_glazing';
  }
  if (
    name.includes('hvac') ||
    name.includes('air condition') ||
    name.includes('refrigerat') ||
    name.includes('chiller') ||
    code === 'HVC'
  ) {
    return 'hvac_cooling';
  }
  if (
    name.includes('cctv') ||
    name.includes('security') ||
    name.includes('fire alarm') ||
    code === 'SEC'
  ) {
    return 'cctv_security';
  }
  if (
    name.includes('civil') ||
    name.includes('road') ||
    name.includes('municipal') ||
    name.includes('asphalt') ||
    code === 'CVL'
  ) {
    return 'civil_road';
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
    case 'pantry_joinery':
      return {
        label: 'Site / Building / Floor Zone *',
        cleanLabel: 'Site / Building / Floor Zone',
        placeholder: 'e.g. Tower B - Floor 06 / Villa Kitchen',
      };
    case 'ceiling_installation':
      return {
        label: 'Floor / Wing / Work Zone *',
        cleanLabel: 'Floor / Wing / Work Zone',
        placeholder: 'e.g. Level 03 - North Wing / Lobby',
      };
    case 'landscaping_irrigation':
      return {
        label: 'Garden Sector / Lawn / Plot Zone *',
        cleanLabel: 'Garden Sector / Lawn / Plot Zone',
        placeholder: 'e.g. Poolside Lawn Zone B / Entrance',
      };
    case 'aluminum_glazing':
      return {
        label: 'Elevation / Floor / Bay Zone *',
        cleanLabel: 'Elevation / Floor / Bay Zone',
        placeholder: 'e.g. East Elevation - Floor 04 / Bay 02',
      };
    case 'hvac_cooling':
      return {
        label: 'Chiller Zone / Floor / Circuit *',
        cleanLabel: 'Chiller Zone / Floor / Circuit',
        placeholder: 'e.g. Level 02 - East Wing / VRF Loop A',
      };
    case 'cctv_security':
      return {
        label: 'Perimeter / Floor / Fire Zone *',
        cleanLabel: 'Perimeter / Floor / Fire Zone',
        placeholder: 'e.g. Warehouse Bay B / Fire Loop 01',
      };
    case 'civil_road':
      return {
        label: 'Road Chainage / Municipal Sector *',
        cleanLabel: 'Road Chainage / Municipal Sector',
        placeholder: 'e.g. Sector B / Km 24+100 - 25+400',
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
