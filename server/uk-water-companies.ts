/**
 * UK Water Companies Database with Geo-location Mapping
 * Comprehensive database of all UK water providers with regional coverage
 */

export interface WaterCompany {
  id: string;
  name: string;
  type: 'water_only' | 'water_and_sewerage';
  regions: string[];
  cities: string[];
  postcodeAreas: string[];
  owner: string;
  website: string;
  customerService: string;
  emergencyNumber: string;
  tariffs: {
    standingCharge: number; // pence per day
    unitRate: number; // pence per cubic meter
    sewerageRate?: number; // pence per cubic meter (if applicable)
  };
}

export const UK_WATER_COMPANIES: WaterCompany[] = [
  // Water and Sewerage Companies (Regional Monopolies)
  {
    id: 'anglian-water',
    name: 'Anglian Water',
    type: 'water_and_sewerage',
    regions: ['East of England'],
    cities: ['Cambridge', 'Norwich', 'Peterborough', 'Ipswich', 'Lincoln', 'Grimsby', 'Lowestoft', 'Great Yarmouth', 'King\'s Lynn', 'Huntingdon'],
    postcodeAreas: ['CB', 'NR', 'PE', 'IP', 'LN', 'DN', 'NR', 'CO'],
    owner: 'Camulodunum Investments/CPP Investments/IFM Investors',
    website: 'https://www.anglianwater.co.uk',
    customerService: '03457 919155',
    emergencyNumber: '08457 145145',
    tariffs: {
      standingCharge: 89.5,
      unitRate: 187.3,
      sewerageRate: 201.4
    }
  },
  {
    id: 'northumbrian-water',
    name: 'Northumbrian Water',
    type: 'water_and_sewerage',
    regions: ['North East England'],
    cities: ['Newcastle', 'Sunderland', 'Durham', 'Middlesbrough', 'Darlington', 'Hartlepool', 'Gateshead', 'South Shields', 'Stockton-on-Tees'],
    postcodeAreas: ['NE', 'DH', 'SR', 'TS', 'DL'],
    owner: 'Cheung Kong Infrastructure/CK Asset Holdings',
    website: 'https://www.nwl.co.uk',
    customerService: '0345 717 1100',
    emergencyNumber: '0345 717 1100',
    tariffs: {
      standingCharge: 85.2,
      unitRate: 183.7,
      sewerageRate: 195.8
    }
  },
  {
    id: 'severn-trent-water',
    name: 'Severn Trent Water',
    type: 'water_and_sewerage',
    regions: ['West Midlands', 'East Midlands', 'Chester'],
    cities: ['Birmingham', 'Coventry', 'Leicester', 'Nottingham', 'Derby', 'Stoke-on-Trent', 'Wolverhampton', 'Chester', 'Shrewsbury', 'Worcester'],
    postcodeAreas: ['B', 'CV', 'LE', 'NG', 'DE', 'ST', 'WV', 'CH', 'SY', 'WR'],
    owner: 'London Stock Exchange Listed',
    website: 'https://www.stwater.co.uk',
    customerService: '0345 750 0500',
    emergencyNumber: '0800 783 4444',
    tariffs: {
      standingCharge: 91.8,
      unitRate: 189.4,
      sewerageRate: 203.7
    }
  },
  {
    id: 'southern-water',
    name: 'Southern Water',
    type: 'water_and_sewerage',
    regions: ['South East England'],
    cities: ['Brighton', 'Canterbury', 'Dover', 'Eastbourne', 'Folkestone', 'Hastings', 'Maidstone', 'Margate', 'Ramsgate', 'Tunbridge Wells'],
    postcodeAreas: ['BN', 'CT', 'ME', 'TN', 'RH'],
    owner: 'Greensands Holdings',
    website: 'https://www.southernwater.co.uk',
    customerService: '0330 303 0368',
    emergencyNumber: '0330 303 0368',
    tariffs: {
      standingCharge: 94.3,
      unitRate: 192.8,
      sewerageRate: 208.5
    }
  },
  {
    id: 'south-west-water',
    name: 'South West Water',
    type: 'water_and_sewerage',
    regions: ['South West England'],
    cities: ['Plymouth', 'Exeter', 'Torquay', 'Paignton', 'Barnstaple', 'Bideford', 'Bodmin', 'Falmouth', 'Penzance', 'St Austell', 'Truro'],
    postcodeAreas: ['PL', 'EX', 'TQ', 'TR'],
    owner: 'Pennon Group',
    website: 'https://www.southwestwater.co.uk',
    customerService: '0344 346 2020',
    emergencyNumber: '0800 169 1144',
    tariffs: {
      standingCharge: 98.7,
      unitRate: 195.6,
      sewerageRate: 212.3
    }
  },
  {
    id: 'thames-water',
    name: 'Thames Water',
    type: 'water_and_sewerage',
    regions: ['Greater London', 'Thames Valley'],
    cities: ['London', 'Reading', 'Slough', 'Swindon', 'Oxford', 'Bracknell', 'Maidenhead', 'Windsor', 'Guildford', 'Woking'],
    postcodeAreas: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'RG', 'SL', 'SN', 'OX', 'GU', 'KT'],
    owner: 'Kemble Water Holdings',
    website: 'https://www.thameswater.co.uk',
    customerService: '0800 980 8800',
    emergencyNumber: '0800 714 614',
    tariffs: {
      standingCharge: 105.2,
      unitRate: 201.4,
      sewerageRate: 218.7
    }
  },
  {
    id: 'united-utilities',
    name: 'United Utilities',
    type: 'water_and_sewerage',
    regions: ['North West England'],
    cities: ['Manchester', 'Liverpool', 'Preston', 'Blackpool', 'Lancaster', 'Carlisle', 'Kendal', 'Barrow-in-Furness', 'Warrington', 'Wigan'],
    postcodeAreas: ['M', 'L', 'PR', 'FY', 'LA', 'CA', 'WA', 'WN'],
    owner: 'London Stock Exchange Listed',
    website: 'https://www.unitedutilities.com',
    customerService: '0345 672 3723',
    emergencyNumber: '0345 672 3723',
    tariffs: {
      standingCharge: 88.9,
      unitRate: 185.3,
      sewerageRate: 199.8
    }
  },
  {
    id: 'welsh-water',
    name: 'Welsh Water',
    type: 'water_and_sewerage',
    regions: ['Wales', 'West Midlands (parts)'],
    cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Bangor', 'Aberystwyth', 'Carmarthen', 'Llanelli', 'Rhondda', 'Merthyr Tydfil'],
    postcodeAreas: ['CF', 'SA', 'NP', 'LL', 'SY', 'LD', 'HR'],
    owner: 'Glas Cymru (not-for-profit)',
    website: 'https://www.dwrcymru.com',
    customerService: '0800 052 0130',
    emergencyNumber: '0800 052 0132',
    tariffs: {
      standingCharge: 82.4,
      unitRate: 178.9,
      sewerageRate: 192.5
    }
  },
  {
    id: 'wessex-water',
    name: 'Wessex Water',
    type: 'water_and_sewerage',
    regions: ['South West England'],
    cities: ['Bath', 'Bristol', 'Bournemouth', 'Poole', 'Salisbury', 'Swindon', 'Taunton', 'Bridgwater', 'Yeovil', 'Weymouth'],
    postcodeAreas: ['BA', 'BS', 'BH', 'SP', 'TA', 'DT'],
    owner: 'YTL Corporation',
    website: 'https://www.wessexwater.co.uk',
    customerService: '0345 600 4600',
    emergencyNumber: '0345 600 4600',
    tariffs: {
      standingCharge: 92.6,
      unitRate: 188.7,
      sewerageRate: 204.1
    }
  },
  {
    id: 'yorkshire-water',
    name: 'Yorkshire Water',
    type: 'water_and_sewerage',
    regions: ['Yorkshire and the Humber'],
    cities: ['Leeds', 'Sheffield', 'Bradford', 'Hull', 'York', 'Doncaster', 'Rotherham', 'Barnsley', 'Wakefield', 'Huddersfield'],
    postcodeAreas: ['LS', 'S', 'BD', 'HU', 'YO', 'DN', 'WF', 'HD'],
    owner: 'Kelda Group',
    website: 'https://www.yorkshirewater.com',
    customerService: '0345 124 2424',
    emergencyNumber: '0345 124 2424',
    tariffs: {
      standingCharge: 87.1,
      unitRate: 184.6,
      sewerageRate: 198.2
    }
  },

  // Water Only Companies
  {
    id: 'affinity-water',
    name: 'Affinity Water',
    type: 'water_only',
    regions: ['Central England', 'East England', 'Southeast England'],
    cities: ['Luton', 'St Albans', 'Hemel Hempstead', 'Stevenage', 'Harlow', 'Bishop\'s Stortford', 'Chelmsford', 'Colchester'],
    postcodeAreas: ['LU', 'AL', 'HP', 'SG', 'CM', 'CO', 'EN', 'WD'],
    owner: 'Allianz/HICL Infrastructure/DIF',
    website: 'https://www.affinitywater.co.uk',
    customerService: '0345 357 2407',
    emergencyNumber: '0345 357 2407',
    tariffs: {
      standingCharge: 96.8,
      unitRate: 193.4
    }
  },
  {
    id: 'albion-water',
    name: 'Albion Water',
    type: 'water_only',
    regions: ['Hampshire', 'Essex', 'Gloucestershire'],
    cities: ['Chigwell', 'Stansted', 'Shotgate'],
    postcodeAreas: ['IG', 'CM', 'SS'],
    owner: 'Albion Water Group Limited',
    website: 'https://www.albionwater.co.uk',
    customerService: '01279 626 040',
    emergencyNumber: '01279 626 040',
    tariffs: {
      standingCharge: 102.3,
      unitRate: 198.7
    }
  },
  {
    id: 'bournemouth-water',
    name: 'Bournemouth Water',
    type: 'water_only',
    regions: ['Dorset', 'Hampshire'],
    cities: ['Bournemouth', 'Christchurch', 'Lymington', 'Ringwood', 'Verwood', 'Wimborne Minster'],
    postcodeAreas: ['BH', 'SO'],
    owner: 'Pennon Group',
    website: 'https://www.bournemouthwater.co.uk',
    customerService: '01202 590 059',
    emergencyNumber: '01202 590 059',
    tariffs: {
      standingCharge: 89.4,
      unitRate: 186.2
    }
  },
  {
    id: 'bristol-water',
    name: 'Bristol Water',
    type: 'water_only',
    regions: ['Somerset', 'Gloucestershire'],
    cities: ['Bristol', 'Burnham-on-Sea', 'Frome', 'Tetbury', 'Wells', 'Weston-super-Mare'],
    postcodeAreas: ['BS', 'BA', 'GL'],
    owner: 'Pennon Group',
    website: 'https://www.bristolwater.co.uk',
    customerService: '0345 702 3797',
    emergencyNumber: '0345 702 3797',
    tariffs: {
      standingCharge: 91.7,
      unitRate: 188.9
    }
  },
  {
    id: 'cambridge-water',
    name: 'Cambridge Water Company',
    type: 'water_only',
    regions: ['Cambridgeshire'],
    cities: ['Cambridge', 'St Ives'],
    postcodeAreas: ['CB', 'PE'],
    owner: 'South Staffordshire Water',
    website: 'https://www.cambridge-water.co.uk',
    customerService: '01223 706 050',
    emergencyNumber: '01223 706 050',
    tariffs: {
      standingCharge: 88.6,
      unitRate: 185.7
    }
  },
  {
    id: 'cholderton-water',
    name: 'Cholderton and District Water Company',
    type: 'water_only',
    regions: ['Hampshire', 'Wiltshire'],
    cities: ['Amport', 'Bulford', 'Cholderton', 'Quarley', 'Shipton Bellinger', 'Thruxton'],
    postcodeAreas: ['SP'],
    owner: 'Cholderton Estate',
    website: 'https://www.choldertonwater.co.uk',
    customerService: '01264 710 204',
    emergencyNumber: '01264 710 204',
    tariffs: {
      standingCharge: 95.3,
      unitRate: 191.8
    }
  },
  {
    id: 'essex-suffolk-water',
    name: 'Essex and Suffolk Water',
    type: 'water_only',
    regions: ['Essex', 'Suffolk'],
    cities: ['Chelmsford', 'Colchester', 'Ipswich', 'Lowestoft', 'Clacton-on-Sea', 'Southend-on-Sea'],
    postcodeAreas: ['CM', 'CO', 'IP', 'NR', 'SS'],
    owner: 'Northumbrian Water Group',
    website: 'https://www.eswater.co.uk',
    customerService: '0345 782 0999',
    emergencyNumber: '0345 782 0888',
    tariffs: {
      standingCharge: 86.9,
      unitRate: 184.3
    }
  },
  {
    id: 'hartlepool-water',
    name: 'Hartlepool Water',
    type: 'water_only',
    regions: ['County Durham'],
    cities: ['Hartlepool'],
    postcodeAreas: ['TS'],
    owner: 'Anglian Water',
    website: 'https://www.hartlepoolwater.co.uk',
    customerService: '01429 266 646',
    emergencyNumber: '01429 266 646',
    tariffs: {
      standingCharge: 84.7,
      unitRate: 182.4
    }
  },
  {
    id: 'portsmouth-water',
    name: 'Portsmouth Water',
    type: 'water_only',
    regions: ['Hampshire', 'West Sussex'],
    cities: ['Portsmouth', 'Bognor Regis', 'Chichester', 'Fareham', 'Gosport', 'Havant', 'Hayling Island'],
    postcodeAreas: ['PO', 'GU'],
    owner: 'Ancala Partners',
    website: 'https://www.portsmouthwater.co.uk',
    customerService: '023 9249 9888',
    emergencyNumber: '023 9249 9888',
    tariffs: {
      standingCharge: 93.8,
      unitRate: 190.6
    }
  },
  {
    id: 'south-east-water',
    name: 'South East Water',
    type: 'water_only',
    regions: ['Kent', 'Surrey', 'East Sussex'],
    cities: ['Maidstone', 'Canterbury', 'Dover', 'Ashford', 'Tunbridge Wells', 'Sevenoaks', 'Dartford', 'Gravesend'],
    postcodeAreas: ['ME', 'CT', 'TN', 'DA', 'BR'],
    owner: 'Utilities Trust of Australia/Desjardins Group',
    website: 'https://www.southeastwater.co.uk',
    customerService: '0333 000 0002',
    emergencyNumber: '0333 000 0002',
    tariffs: {
      standingCharge: 97.2,
      unitRate: 194.8
    }
  },
  {
    id: 'south-staffordshire-water',
    name: 'South Staffordshire Water',
    type: 'water_only',
    regions: ['Staffordshire', 'West Midlands'],
    cities: ['Aldridge', 'Brownhills', 'Burton upon Trent', 'Cannock', 'Kinver', 'Lichfield', 'Rugeley', 'Sutton Coldfield', 'Tamworth', 'Uttoxeter', 'Walsall', 'West Bromwich'],
    postcodeAreas: ['WS', 'B', 'DE', 'ST'],
    owner: 'Independent',
    website: 'https://www.south-staffs-water.co.uk',
    customerService: '0345 352 4444',
    emergencyNumber: '0345 352 4444',
    tariffs: {
      standingCharge: 90.1,
      unitRate: 187.5
    }
  },
  {
    id: 'sutton-east-surrey-water',
    name: 'Sutton and East Surrey Water',
    type: 'water_only',
    regions: ['Surrey', 'Greater London'],
    cities: ['Sutton', 'Cobham', 'Dorking', 'Horley', 'Leatherhead', 'Oxted', 'Redhill', 'Reigate'],
    postcodeAreas: ['SM', 'KT', 'RH', 'CR'],
    owner: 'Pennon Group',
    website: 'https://www.waterplc.com',
    customerService: '01737 772 000',
    emergencyNumber: '01737 772 000',
    tariffs: {
      standingCharge: 94.6,
      unitRate: 191.3
    }
  },
  {
    id: 'youlgrave-waterworks',
    name: 'Youlgrave Waterworks',
    type: 'water_only',
    regions: ['Derbyshire'],
    cities: ['Youlgrave'],
    postcodeAreas: ['DE'],
    owner: 'Independent non-profit company',
    website: 'https://www.youlgravewaterworks.co.uk',
    customerService: '01629 636 203',
    emergencyNumber: '01629 636 203',
    tariffs: {
      standingCharge: 78.9,
      unitRate: 176.4
    }
  }
];

/**
 * Determines the appropriate water company based on city or postcode
 */
export function getWaterCompanyForLocation(city: string, postcode?: string): WaterCompany | null {
  const normalizedCity = city.toLowerCase().trim();
  const normalizedPostcode = postcode?.toLowerCase().replace(/\s/g, '') || '';
  
  // First try exact city match
  for (const company of UK_WATER_COMPANIES) {
    if (company.cities.some(c => c.toLowerCase() === normalizedCity)) {
      return company;
    }
  }
  
  // Then try postcode area match
  if (normalizedPostcode) {
    const postcodeArea = normalizedPostcode.replace(/\d.*$/, '').toUpperCase();
    
    for (const company of UK_WATER_COMPANIES) {
      if (company.postcodeAreas.includes(postcodeArea)) {
        return company;
      }
    }
  }
  
  // Fallback to partial city name matching
  for (const company of UK_WATER_COMPANIES) {
    if (company.cities.some(c => 
      c.toLowerCase().includes(normalizedCity) || 
      normalizedCity.includes(c.toLowerCase())
    )) {
      return company;
    }
  }
  
  return null;
}

/**
 * Gets all water companies by type
 */
export function getWaterCompaniesByType(type: 'water_only' | 'water_and_sewerage'): WaterCompany[] {
  return UK_WATER_COMPANIES.filter(company => company.type === type);
}

/**
 * Gets all water companies serving a specific region
 */
export function getWaterCompaniesByRegion(region: string): WaterCompany[] {
  const normalizedRegion = region.toLowerCase();
  return UK_WATER_COMPANIES.filter(company => 
    company.regions.some(r => r.toLowerCase().includes(normalizedRegion))
  );
}

/**
 * Calculates annual water bill estimate
 */
export function calculateWaterBill(company: WaterCompany, annualUsage: number = 150): number {
  const standingChargeAnnual = (company.tariffs.standingCharge * 365) / 100; // Convert pence to pounds
  const usageCharge = (company.tariffs.unitRate * annualUsage) / 100; // Convert pence to pounds
  const sewerageCharge = company.tariffs.sewerageRate ? (company.tariffs.sewerageRate * annualUsage) / 100 : 0;
  
  return Math.round((standingChargeAnnual + usageCharge + sewerageCharge) * 100) / 100;
}