import type { ConsentContext } from './legal';

// ─── BUSINESS TYPES ──────────────────────────────────────────────────────────
// One definition of what a business account can be, used by registration,
// login, routing and the application forms.
//
// The reason this file exists: the approved-status vocabulary was previously
// duplicated between /dealer/login and /api/admin/suspend, and the two drifted.
// Login required 'approved' for every type, while the admin route only permits
// 'active' for clubs and services — so no club or service could ever satisfy
// the login check, and no setting in the admin console could fix it. Every
// club and service provider was locked out permanently.
//
// If a status vocabulary changes, it changes here and in
// /api/admin/suspend/route.ts together. Nowhere else should hard-code them.

export type BusinessTypeId = 'dealer' | 'club' | 'range' | 'service' | 'advocacy';

export interface BusinessType {
  id: BusinessTypeId;
  label: string;
  /** Shown on the registration chooser. */
  blurb: string;
  icon: string;
  /** Where to send them to complete their application. */
  applyPath: string;
  /** Where they land once approved. */
  dashboardPath: string;
  /** Table holding the business record. */
  table: 'dealers' | 'clubs' | 'services' | 'advocacy_groups';
  /** The status value that means "approved" for this type. */
  approvedStatus: string;
  /** Consent bundle recorded when the application is submitted. */
  consentContext: ConsentContext;
  /** Short note on what the application will require. */
  requirements: string;
}

export const BUSINESS_TYPES: Record<BusinessTypeId, BusinessType> = {
  dealer: {
    id: 'dealer',
    label: 'Firearms Dealer',
    blurb: 'Sell firearms, ammunition and accessories from a licensed storefront.',
    icon: '🏪',
    applyPath: '/dealer/apply',
    dashboardPath: '/dealer-dashboard',
    table: 'dealers',
    approvedStatus: 'approved',
    consentContext: 'dealer_application',
    requirements: 'SAPS dealer number and certificate, business registration, ID document',
  },
  club: {
    id: 'club',
    label: 'Shooting Club',
    blurb: 'List your club, disciplines, shoot days and membership details.',
    icon: '🎯',
    applyPath: '/clubs/apply',
    dashboardPath: '/club-dashboard',
    table: 'clubs',
    approvedStatus: 'active',
    consentContext: 'club_application',
    requirements: 'Club details, disciplines and association memberships',
  },
  range: {
    id: 'range',
    label: 'Shooting Range',
    blurb: 'Publish lanes, live availability, range fees and booking slots.',
    icon: '🔫',
    applyPath: '/clubs/range-apply',
    dashboardPath: '/club-dashboard',
    table: 'clubs',
    approvedStatus: 'active',
    consentContext: 'club_application',
    requirements: 'SAPS registration number and range compliance certificate',
  },
  service: {
    id: 'service',
    label: 'Service Provider',
    blurb: 'Gunsmiths, trainers, legal specialists, security companies and more.',
    icon: '🔧',
    applyPath: '/services/apply',
    dashboardPath: '/service-dashboard',
    table: 'services',
    approvedStatus: 'active',
    consentContext: 'service_application',
    requirements: 'Service category and, for security companies, PSIRA registration',
  },
  advocacy: {
    id: 'advocacy',
    label: 'Advocacy Organisation',
    blurb: 'Firearm rights associations and industry bodies. A directory profile and a press release feed — not membership management.',
    icon: '⚖️',
    applyPath: '/advocacy/apply',
    dashboardPath: '/advocacy-dashboard',
    table: 'advocacy_groups',
    approvedStatus: 'active',
    consentContext: 'advocacy_application',
    requirements: 'Organisation name, mission statement and website',
  },
};

export const BUSINESS_TYPE_LIST: BusinessType[] = [
  BUSINESS_TYPES.dealer,
  BUSINESS_TYPES.club,
  BUSINESS_TYPES.range,
  BUSINESS_TYPES.service,
  BUSINESS_TYPES.advocacy,
];

/** Business types stored in a given table, in lookup order. */
export function typesForTable(table: BusinessType['table']): BusinessType[] {
  return BUSINESS_TYPE_LIST.filter(t => t.table === table);
}