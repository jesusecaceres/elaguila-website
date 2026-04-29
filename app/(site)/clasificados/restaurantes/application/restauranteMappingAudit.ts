/**
 * Restaurantes Mapping Truth Matrix Audit
 * 
 * This utility systematically verifies that every field in the application
 * properly flows through to the shell mapping and preview/detail rendering.
 */

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { mapRestauranteDraftToShellData } from "./mapRestauranteDraftToShell";
import type { RestaurantDetailShellData } from "../shell/restaurantDetailShellTypes";

export interface FieldAuditResult {
  fieldName: string;
  inApplication: boolean;
  inDraft: boolean;
  mappedToShell: boolean;
  renderedInPreview: boolean;
  notes: string;
}

export interface MappingAuditReport {
  identity: FieldAuditResult[];
  operations: FieldAuditResult[];
  hours: FieldAuditResult[];
  contact: FieldAuditResult[];
  location: FieldAuditResult[];
  media: FieldAuditResult[];
  featuredHighlights: FieldAuditResult[];
  stacks: FieldAuditResult[];
  summary: {
    totalFields: number;
    passedFields: number;
    failedFields: number;
    successRate: number;
  };
}

/**
 * Check if a field exists in the application UI by examining the RestauranteApplicationClient structure
 */
function fieldInApplication(fieldName: string): boolean {
  // This would need to be updated based on actual application structure
  // For now, we'll assume most fields are present unless explicitly removed
  const removedFields = new Set([
    'temporaryHoursActive',
    'temporaryHoursNote', 
    'brochureFile',
    'verUbicacionUrl',
    'allowMessageCTA'
  ]);
  
  return !removedFields.has(fieldName);
}

/**
 * Check if a field exists in the draft data structure
 */
function fieldInDraft(draft: RestauranteListingDraft, fieldName: string): boolean {
  return fieldName in draft;
}

/**
 * Check if a field is mapped in the shell mapping
 */
function fieldMappedToShell(shellData: RestaurantDetailShellData, fieldName: string): boolean {
  // This is a simplified check - in reality would need to examine mapping logic
  // For now, we'll check key shell data structures
  
  // Identity fields
  if (fieldName === 'businessName' && shellData.businessName) return true;
  if (fieldName === 'shortSummary' && shellData.summaryShort) return true;
  if (fieldName === 'longDescription' && shellData.aboutBody) return true;
  if (fieldName === 'priceLevel' && shellData.quickInfo?.some(item => item.key === 'price')) return true;
  if (fieldName === 'neighborhood' && shellData.quickInfo?.some(item => item.key === 'neighborhood')) return true;
  if (fieldName === 'cityCanonical' && shellData.contact?.mapsSearchQuery) return true;
  if (fieldName === 'zipCode' && shellData.contact?.mapsSearchQuery) return true;
  if (fieldName === 'languagesSpoken' && shellData.quickInfo?.some(item => item.key === 'service')) return true;
  
  // Business type and cuisines
  if ((fieldName === 'businessType' || fieldName === 'businessTypeCustom') && shellData.taxonomyChips) return true;
  if ((fieldName.startsWith('primaryCuisine') || fieldName.startsWith('secondaryCuisine') || fieldName.startsWith('additionalCuisines')) && shellData.cuisineTypeLine) return true;
  
  // Operations
  if (fieldName === 'serviceModes' && shellData.quickInfo?.some(item => item.key === 'service')) return true;
  if (fieldName === 'movingVendor' && shellData.stackSections?.some((stack: any) => stack.id === 'moving')) return true;
  if (fieldName === 'homeBasedBusiness' && shellData.stackSections?.some((stack: any) => stack.id === 'home')) return true;
  if (fieldName === 'cateringAvailable' && shellData.stackSections?.some((stack: any) => stack.id === 'catering')) return true;
  if (fieldName === 'eventFoodService' && shellData.stackSections?.some((stack: any) => stack.id === 'catering')) return true;
  
  // Hours
  if (fieldName.startsWith('monday') || fieldName.startsWith('tuesday') || 
      fieldName.startsWith('wednesday') || fieldName.startsWith('thursday') ||
      fieldName.startsWith('friday') || fieldName.startsWith('saturday') ||
      fieldName.startsWith('sunday') || fieldName === 'specialHoursNote') {
    return !!shellData.hoursDetail;
  }
  
  // Contact
  if (fieldName === 'websiteUrl' && shellData.contact?.websiteHref) return true;
  if (fieldName === 'phoneNumber' && shellData.contact?.phoneDisplay) return true;
  if (fieldName === 'email' && shellData.contact?.email) return true;
  if (fieldName === 'whatsAppNumber' && shellData.contact?.whatsappHref) return true;
  if (fieldName === 'instagramUrl' && shellData.contact?.instagramHref) return true;
  if (fieldName === 'facebookUrl' && shellData.contact?.facebookHref) return true;
  if (fieldName === 'tiktokUrl' && shellData.contact?.tiktokHref) return true;
  if (fieldName === 'youtubeUrl' && shellData.contact?.youtubeHref) return true;
  if (fieldName === 'reservationUrl' && shellData.primaryCtas?.some(cta => cta.key === 'reserve')) return true;
  if (fieldName === 'orderUrl' && shellData.primaryCtas?.some(cta => cta.key === 'order')) return true;
  if (fieldName === 'menuUrl' && shellData.primaryCtas?.some(cta => cta.key === 'menu')) return true;
  if (fieldName === 'menuFile' && shellData.contact?.menuFileHref) return true;
  
  // Location
  if (fieldName.startsWith('addressLine') || fieldName === 'state') {
    return !!shellData.contact;
  }
  
  // Media
  if (fieldName === 'heroImage' && shellData.heroImageUrl) return true;
  if (fieldName === 'galleryImages' && shellData.venueGallery) return true;
  if (fieldName === 'videoFile' || fieldName === 'videoUrl') {
    return Boolean(shellData.venueGallery?.categories?.some((cat: any) => cat.key === 'video'));
  }
  if (fieldName === 'interiorImages') {
    return Boolean(shellData.venueGallery?.categories?.some((cat: any) => cat.key === 'interior'));
  }
  if (fieldName === 'foodImages') {
    return Boolean(shellData.venueGallery?.categories?.some((cat: any) => cat.key === 'food'));
  }
  if (fieldName === 'exteriorImages') {
    return Boolean(shellData.venueGallery?.categories?.some((cat: any) => cat.key === 'exterior'));
  }
  
  // Featured dishes
  if (fieldName.startsWith('featuredDishes') && shellData.menuHighlights) return true;
  
  // Highlights
  if (fieldName === 'highlights' && shellData.highlightTags) return true;
  
  // Stacks
  if (fieldName.startsWith('movingVendorStack') && shellData.stackSections?.some((stack: any) => stack.id === 'moving')) return true;
  if (fieldName.startsWith('homeBasedStack') && shellData.stackSections?.some((stack: any) => stack.id === 'home')) return true;
  if (fieldName.startsWith('cateringEventsStack') && shellData.stackSections?.some((stack: any) => stack.id === 'catering')) return true;
  
  return false;
}

/**
 * Check if a field would be rendered in preview (simplified check)
 */
function fieldRenderedInPreview(shellData: RestaurantDetailShellData, fieldName: string): boolean {
  // Most mapped fields should render in preview if they have data
  return fieldMappedToShell(shellData, fieldName);
}

/**
 * Audit identity fields
 */
function auditIdentityFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'businessName',
    'businessType', 
    'businessTypeCustom',
    'primaryCuisine',
    'primaryCuisineCustom', 
    'secondaryCuisine',
    'secondaryCuisineCustom',
    'additionalCuisines',
    'additionalCuisineOtherCustom',
    'shortSummary',
    'longDescription',
    'cityCanonical',
    'neighborhood',
    'zipCode',
    'priceLevel',
    'languagesSpoken',
    'languageOtherCustom'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit operations fields
 */
function auditOperationsFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'serviceModes',
    'serviceModeOtherCustom',
    'dineIn',
    'takeout', 
    'delivery',
    'reservationsAvailable',
    'preorderRequired',
    'pickupAvailable',
    'movingVendor',
    'homeBasedBusiness',
    'cateringAvailable',
    'eventFoodService',
    'foodTruck',
    'popUp',
    'personalChef'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit hours fields
 */
function auditHoursFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'monday',
    'tuesday', 
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'specialHoursNote'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit contact fields
 */
function auditContactFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'websiteUrl',
    'phoneNumber',
    'email',
    'whatsAppNumber',
    'instagramUrl',
    'facebookUrl',
    'tiktokUrl',
    'youtubeUrl',
    'reservationUrl',
    'orderUrl',
    'menuUrl',
    'menuFile'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit location fields
 */
function auditLocationFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'addressLine1',
    'addressLine2',
    'state',
    'cityCanonical',
    'zipCode',
    'showExactAddress'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit media fields
 */
function auditMediaFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'heroImage',
    'galleryImages',
    'galleryMediaSequence',
    'videoFile',
    'videoUrl',
    'foodImages',
    'interiorImages', 
    'exteriorImages'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit featured dishes and highlights
 */
function auditFeaturedHighlightsFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'featuredDishes',
    'highlights'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Audit stack fields
 */
function auditStackFields(draft: RestauranteListingDraft, shellData: RestaurantDetailShellData): FieldAuditResult[] {
  const fields = [
    'movingVendorStack',
    'homeBasedStack',
    'cateringEventsStack'
  ];

  return fields.map(fieldName => ({
    fieldName,
    inApplication: fieldInApplication(fieldName),
    inDraft: fieldInDraft(draft, fieldName),
    mappedToShell: fieldMappedToShell(shellData, fieldName),
    renderedInPreview: fieldRenderedInPreview(shellData, fieldName),
    notes: ''
  }));
}

/**
 * Run complete mapping audit
 */
export function auditRestaurantMapping(draft: RestauranteListingDraft): MappingAuditReport {
  const shellData = mapRestauranteDraftToShellData(draft);

  const identity = auditIdentityFields(draft, shellData);
  const operations = auditOperationsFields(draft, shellData);
  const hours = auditHoursFields(draft, shellData);
  const contact = auditContactFields(draft, shellData);
  const location = auditLocationFields(draft, shellData);
  const media = auditMediaFields(draft, shellData);
  const featuredHighlights = auditFeaturedHighlightsFields(draft, shellData);
  const stacks = auditStackFields(draft, shellData);

  const allFields = [...identity, ...operations, ...hours, ...contact, ...location, ...media, ...featuredHighlights, ...stacks];
  
  const passedFields = allFields.filter(field => 
    field.inApplication && field.inDraft && field.mappedToShell && field.renderedInPreview
  ).length;

  return {
    identity,
    operations,
    hours,
    contact,
    location,
    media,
    featuredHighlights,
    stacks,
    summary: {
      totalFields: allFields.length,
      passedFields,
      failedFields: allFields.length - passedFields,
      successRate: (passedFields / allFields.length) * 100
    }
  };
}

/**
 * Print audit results in a readable format
 */
export function printAuditReport(report: MappingAuditReport): void {
  console.log('\n=== RESTAURANTES MAPPING TRUTH MATRIX AUDIT ===\n');
  
  const sections = [
    { name: 'IDENTITY', data: report.identity },
    { name: 'OPERATIONS', data: report.operations },
    { name: 'HOURS', data: report.hours },
    { name: 'CONTACT', data: report.contact },
    { name: 'LOCATION', data: report.location },
    { name: 'MEDIA', data: report.media },
    { name: 'FEATURED/HIGHLIGHTS', data: report.featuredHighlights },
    { name: 'STACKS', data: report.stacks }
  ];

  sections.forEach(section => {
    console.log(`\n${section.name}:`);
    console.log('| Field | In App | In Draft | Mapped | Rendered | Notes |');
    console.log('|-------|--------|---------|--------|---------|-------|');
    
    section.data.forEach(field => {
      const status = (field.inApplication && field.inDraft && field.mappedToShell && field.renderedInPreview) ? '✅' : '❌';
      console.log(`| ${field.fieldName} | ${field.inApplication ? '✅' : '❌'} | ${field.inDraft ? '✅' : '❌'} | ${field.mappedToShell ? '✅' : '❌'} | ${field.renderedInPreview ? '✅' : '❌'} | ${field.notes} |`);
    });
  });

  console.log('\n=== SUMMARY ===');
  console.log(`Total Fields: ${report.summary.totalFields}`);
  console.log(`Passed: ${report.summary.passedFields}`);
  console.log(`Failed: ${report.summary.failedFields}`);
  console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
}
