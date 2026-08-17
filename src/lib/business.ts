/**
 * Single source of truth for business facts.
 *
 * Anything in SQUARE BRACKETS is a placeholder the client must supply before
 * launch. The pre-deploy gate greps the built site for these markers and
 * blocks deployment while any remain (see CHECKLIST.md).
 */
export const business = {
  name: 'WW Roofing & Building',
  legalName: 'WW Roofing & Building',
  phone: '07565 301143',
  phoneHref: 'tel:+447565301143',
  email: 'info@wwroofingandbuilding.co.uk',
  emailHref: 'mailto:info@wwroofingandbuilding.co.uk',
  baseLocality: 'Crossgates, Leeds',
  region: 'West Yorkshire',
  serviceAreaSummary: 'Leeds and surrounding areas',
  facebook: 'https://www.facebook.com/wwroofingandbuilding/',
} as const;

/** Areas served; the first four have dedicated pages at launch. */
export const areasServed = [
  'Crossgates',
  'Garforth',
  'Wetherby',
  'Roundhay',
  'Halton',
  'Seacroft',
  'Colton',
  'Kippax',
  'Chapel Allerton',
  'Alwoodley',
  'Horsforth',
  'Cookridge',
  'Adel',
  'Shadwell',
  'Leeds City Centre',
  'Selby',
] as const;

export const hasPlaceholders = () =>
  Object.values(business).some((v) => typeof v === 'string' && v.includes('['));
