/**
 * Mock data for utility providers and tariffs
 */

export const mockUtilityProviders = [
  // Gas providers
  {
    id: 1,
    name: "GasEnergy",
    utilityType: "gas",
    website: "https://www.gasenergy.com",
    customerServicePhone: "0800-123-4567",
    customerServiceEmail: "support@gasenergy.com",
    apiIntegration: true,
    apiEndpoint: "https://api.gasenergy.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=GasEnergy",
    notes: "One of the leading gas suppliers in the country"
  },
  {
    id: 2,
    name: "National Gas",
    utilityType: "gas",
    website: "https://www.nationalgas.com",
    customerServicePhone: "0800-765-4321",
    customerServiceEmail: "help@nationalgas.com",
    apiIntegration: false,
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=NationalGas",
    notes: "Traditional gas provider with nationwide coverage"
  },
  
  // Electricity providers
  {
    id: 3,
    name: "PowerElectric",
    utilityType: "electricity",
    website: "https://www.powerelectric.com",
    customerServicePhone: "0800-555-6789",
    customerServiceEmail: "contact@powerelectric.com",
    apiIntegration: true,
    apiEndpoint: "https://api.powerelectric.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=PowerElectric",
    notes: "Renewable energy focused electricity provider"
  },
  {
    id: 4,
    name: "Volt Energy",
    utilityType: "electricity",
    website: "https://www.voltenergy.com",
    customerServicePhone: "0800-987-6543",
    customerServiceEmail: "support@voltenergy.com",
    apiIntegration: true,
    apiEndpoint: "https://api.voltenergy.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=VoltEnergy",
    notes: "Competitive rates and excellent customer service"
  },
  
  // Dual fuel providers
  {
    id: 5,
    name: "Complete Energy",
    utilityType: "dual_fuel",
    website: "https://www.completeenergy.com",
    customerServicePhone: "0800-111-2222",
    customerServiceEmail: "info@completeenergy.com",
    apiIntegration: true,
    apiEndpoint: "https://api.completeenergy.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=CompleteEnergy",
    notes: "Comprehensive dual fuel packages with discounts"
  },
  {
    id: 6,
    name: "Unified Utilities",
    utilityType: "dual_fuel",
    website: "https://www.unifiedutilities.com",
    customerServicePhone: "0800-333-4444",
    customerServiceEmail: "care@unifiedutilities.com",
    apiIntegration: true,
    apiEndpoint: "https://api.unifiedutilities.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=UnifiedUtilities",
    notes: "Simplified billing with combined gas and electricity packages"
  },
  
  // Water providers
  {
    id: 7,
    name: "Pure Water",
    utilityType: "water",
    website: "https://www.purewater.com",
    customerServicePhone: "0800-222-3333",
    customerServiceEmail: "help@purewater.com",
    apiIntegration: false,
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=PureWater",
    notes: "Local water supplier with excellent service record"
  },
  {
    id: 8,
    name: "Aqua Services",
    utilityType: "water",
    website: "https://www.aquaservices.com",
    customerServicePhone: "0800-444-5555",
    customerServiceEmail: "contact@aquaservices.com",
    apiIntegration: true,
    apiEndpoint: "https://api.aquaservices.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=AquaServices",
    notes: "Environmentally conscious water supplier"
  },
  
  // Broadband providers
  {
    id: 9,
    name: "FastConnect",
    utilityType: "broadband",
    website: "https://www.fastconnect.com",
    customerServicePhone: "0800-666-7777",
    customerServiceEmail: "support@fastconnect.com",
    apiIntegration: true,
    apiEndpoint: "https://api.fastconnect.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=FastConnect",
    notes: "High-speed fiber broadband packages"
  },
  {
    id: 10,
    name: "NetWave",
    utilityType: "broadband",
    website: "https://www.netwave.com",
    customerServicePhone: "0800-888-9999",
    customerServiceEmail: "help@netwave.com",
    apiIntegration: true,
    apiEndpoint: "https://api.netwave.com",
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=NetWave",
    notes: "Student-friendly broadband packages with no long-term contracts"
  },
  
  // TV License providers
  {
    id: 11,
    name: "TV Licensing Authority",
    utilityType: "tv",
    website: "https://www.tvlicensing.org",
    customerServicePhone: "0800-100-0288",
    customerServiceEmail: "info@tvlicensing.org",
    apiIntegration: false,
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=TVLicensing",
    notes: "Official TV licensing authority"
  },
  {
    id: 12,
    name: "Student TV License",
    utilityType: "tv",
    website: "https://www.studenttvlicense.org",
    customerServicePhone: "0800-123-0088",
    customerServiceEmail: "students@tvlicensing.org",
    apiIntegration: false,
    active: true,
    logoUrl: "https://via.placeholder.com/150?text=StudentTVLicense",
    notes: "Specialized TV license service for students"
  }
];

export const mockUtilityTariffs = [
  // Gas tariffs
  {
    id: 1,
    providerId: 1,
    name: "Standard Gas",
    description: "Standard variable rate gas tariff",
    utilityType: "gas",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "27p per day",
    unitRate: "4.5p per kWh",
    estimatedAnnualCost: "£650",
    greenEnergy: false,
    specialOffers: ["Online account management", "Monthly billing"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    providerId: 1,
    name: "Fixed Saver Gas",
    description: "Fixed rate gas tariff with price protection",
    utilityType: "gas",
    fixedTerm: true,
    termLength: 12,
    earlyExitFee: "£30",
    standingCharge: "25p per day",
    unitRate: "4.2p per kWh",
    estimatedAnnualCost: "£620",
    greenEnergy: false,
    specialOffers: ["Price protection", "Online account management"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    providerId: 2,
    name: "Value Gas",
    description: "Value gas tariff with competitive rates",
    utilityType: "gas",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "28p per day",
    unitRate: "4.6p per kWh",
    estimatedAnnualCost: "£670",
    greenEnergy: false,
    specialOffers: ["Paperless billing discount"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Electricity tariffs
  {
    id: 4,
    providerId: 3,
    name: "Green Electricity",
    description: "100% renewable electricity tariff",
    utilityType: "electricity",
    fixedTerm: true,
    termLength: 12,
    earlyExitFee: "£25",
    standingCharge: "24p per day",
    unitRate: "16.5p per kWh",
    estimatedAnnualCost: "£950",
    greenEnergy: true,
    specialOffers: ["100% renewable energy", "Tree planting scheme"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    providerId: 3,
    name: "Economy Electricity",
    description: "Budget-friendly electricity tariff",
    utilityType: "electricity",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "26p per day",
    unitRate: "17.2p per kWh",
    estimatedAnnualCost: "£980",
    greenEnergy: false,
    specialOffers: ["Smart meter installation", "Energy usage insights"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    providerId: 4,
    name: "Volt Standard",
    description: "Reliable electricity at competitive rates",
    utilityType: "electricity",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "25p per day",
    unitRate: "16.8p per kWh",
    estimatedAnnualCost: "£960",
    greenEnergy: false,
    specialOffers: ["24/7 customer support"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Dual fuel tariffs
  {
    id: 7,
    providerId: 5,
    name: "Complete Home",
    description: "Comprehensive dual fuel package",
    utilityType: "dual_fuel",
    fixedTerm: true,
    termLength: 24,
    earlyExitFee: "£50",
    standingCharge: "50p per day",
    unitRate: "Electricity: 16p, Gas: 4p per kWh",
    estimatedAnnualCost: "£1,500",
    greenEnergy: true,
    specialOffers: ["Dual fuel discount", "Smart home thermostat"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    providerId: 5,
    name: "Complete Saver",
    description: "Budget dual fuel option with great savings",
    utilityType: "dual_fuel",
    fixedTerm: true,
    termLength: 12,
    earlyExitFee: "£40",
    standingCharge: "48p per day",
    unitRate: "Electricity: 15.8p, Gas: 3.9p per kWh",
    estimatedAnnualCost: "£1,450",
    greenEnergy: false,
    specialOffers: ["£50 welcome credit", "Loyalty rewards"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9,
    providerId: 6,
    name: "Unified Standard",
    description: "Simple combined gas and electricity package",
    utilityType: "dual_fuel",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "52p per day",
    unitRate: "Electricity: 16.2p, Gas: 4.1p per kWh",
    estimatedAnnualCost: "£1,520",
    greenEnergy: false,
    specialOffers: ["Single monthly bill", "Online account management"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Water tariffs
  {
    id: 10,
    providerId: 7,
    name: "Standard Water",
    description: "Standard water supply tariff",
    utilityType: "water",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "£60 per year",
    unitRate: "£1.50 per cubic meter",
    estimatedAnnualCost: "£400",
    greenEnergy: false,
    specialOffers: ["Water saving advice", "Leak detection service"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 11,
    providerId: 8,
    name: "Aqua Essential",
    description: "Essential water service package",
    utilityType: "water",
    fixedTerm: false,
    termLength: null,
    earlyExitFee: "£0",
    standingCharge: "£65 per year",
    unitRate: "£1.45 per cubic meter",
    estimatedAnnualCost: "£390",
    greenEnergy: false,
    specialOffers: ["Water efficiency devices", "Online usage tracking"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Broadband tariffs
  {
    id: 12,
    providerId: 9,
    name: "Fast Fiber",
    description: "High-speed fiber broadband",
    utilityType: "broadband",
    fixedTerm: true,
    termLength: 12,
    earlyExitFee: "£85",
    standingCharge: "N/A",
    unitRate: "N/A",
    estimatedAnnualCost: "£360",
    greenEnergy: false,
    specialOffers: ["Free router", "Unlimited usage"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 13,
    providerId: 9,
    name: "Fast Fiber Plus",
    description: "Ultra-fast fiber broadband with TV streaming package",
    utilityType: "broadband",
    fixedTerm: true,
    termLength: 18,
    earlyExitFee: "£95",
    standingCharge: "N/A",
    unitRate: "N/A",
    estimatedAnnualCost: "£480",
    greenEnergy: false,
    specialOffers: ["Free router", "Unlimited usage", "Streaming service discount"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 14,
    providerId: 10,
    name: "Student Connect",
    description: "Student-focused broadband with flexible terms",
    utilityType: "broadband",
    fixedTerm: false,
    termLength: 1,
    earlyExitFee: "£0",
    standingCharge: "N/A",
    unitRate: "N/A",
    estimatedAnnualCost: "£300",
    greenEnergy: false,
    specialOffers: ["Student discount", "Monthly rolling contract", "Free setup"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // TV License tariffs
  {
    id: 15,
    providerId: 11,
    name: "Standard TV License",
    description: "Standard television license",
    utilityType: "tv",
    fixedTerm: true,
    termLength: 12,
    earlyExitFee: "£0",
    standingCharge: "N/A",
    unitRate: "N/A",
    estimatedAnnualCost: "£159",
    greenEnergy: false,
    specialOffers: ["All UK television channels", "BBC iPlayer access"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 16,
    providerId: 12,
    name: "Student TV License",
    description: "Television license designed for students",
    utilityType: "tv",
    fixedTerm: true,
    termLength: 9,
    earlyExitFee: "£0",
    standingCharge: "N/A",
    unitRate: "N/A",
    estimatedAnnualCost: "£120",
    greenEnergy: false,
    specialOffers: ["Academic year coverage", "Refund for summer months"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Generate cheapest tariffs grouped by utility type
export const mockCheapestTariffs = {
  gas: [
    mockUtilityTariffs.find(t => t.id === 2), // Fixed Saver Gas
    mockUtilityTariffs.find(t => t.id === 1), // Standard Gas
    mockUtilityTariffs.find(t => t.id === 3), // Value Gas
  ],
  electricity: [
    mockUtilityTariffs.find(t => t.id === 4), // Green Electricity
    mockUtilityTariffs.find(t => t.id === 6), // Volt Standard
    mockUtilityTariffs.find(t => t.id === 5), // Economy Electricity
  ],
  dual_fuel: [
    mockUtilityTariffs.find(t => t.id === 8), // Complete Saver
    mockUtilityTariffs.find(t => t.id === 7), // Complete Home
    mockUtilityTariffs.find(t => t.id === 9), // Unified Standard
  ],
  water: [
    mockUtilityTariffs.find(t => t.id === 11), // Aqua Essential
    mockUtilityTariffs.find(t => t.id === 10), // Standard Water
  ],
  broadband: [
    mockUtilityTariffs.find(t => t.id === 14), // Student Connect
    mockUtilityTariffs.find(t => t.id === 12), // Fast Fiber
    mockUtilityTariffs.find(t => t.id === 13), // Fast Fiber Plus
  ],
  tv: [
    mockUtilityTariffs.find(t => t.id === 16), // Student TV License
    mockUtilityTariffs.find(t => t.id === 15), // Standard TV License
  ]
};