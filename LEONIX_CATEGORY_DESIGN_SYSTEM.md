# Leonix Category Design System

## Overview

This design system defines the visual and product rules for all Leonix Clasificados category experiences. Every category should feel unmistakably Leonix while maintaining its own category-specific personality.

---

## 1. Leonix Core Identity

### Brand Positioning
- **Spanish-first**: Primary language and cultural context
- **Latino-market focused**: Serves the Spanish-speaking community first
- **Open to everyone**: Inclusive while maintaining cultural authenticity
- **Premium local marketplace**: Trustworthy, high-quality experience
- **Warm & community-first**: Friendly, approachable, neighborhood feel
- **Business-ready**: Professional enough for commercial use

### Visual Foundation
- **Surfaces**: Cream / ivory backgrounds (`#FFFEF7`, `#FFFAF0`)
- **Accents**: Warm gold (`#D4A574`, `#C19A6B`)
- **Text**: Charcoal hierarchy (`#1A1A1A`, `#4A4A4A`, #7A7A7A`)
- **Borders**: Subtle warm borders (`#E5E5E5`, `#D5D5D5`)
- **Cards**: `rounded-2xl` (16px) and `rounded-3xl` (24px)
- **Shadows**: Soft, warm shadows (`0 4px 24px rgba(0,0,0,0.06)`)
- **Spacing**: Clean, generous breathing room
- **Hierarchy**: Strong visual organization
- **CTAs**: Clear, prominent action buttons
- **Mobile-first**: Responsive design priority

### Typography System
```css
/* Display */
.text-display-2xl { font-size: 2.5rem; line-height: 1.2; font-weight: 700; }
.text-display-xl { font-size: 2rem; line-height: 1.3; font-weight: 600; }
.text-display-lg { font-size: 1.5rem; line-height: 1.4; font-weight: 600; }

/* Headings */
.text-heading-2xl { font-size: 1.875rem; line-height: 1.3; font-weight: 600; }
.text-heading-xl { font-size: 1.5rem; line-height: 1.4; font-weight: 600; }
.text-heading-lg { font-size: 1.25rem; line-height: 1.5; font-weight: 600; }
.text-heading-md { font-size: 1.125rem; line-height: 1.5; font-weight: 600; }

/* Body */
.text-body-lg { font-size: 1.125rem; line-height: 1.6; font-weight: 400; }
.text-body-md { font-size: 1rem; line-height: 1.6; font-weight: 400; }
.text-body-sm { font-size: 0.875rem; line-height: 1.5; font-weight: 400; }

/* Small */
.text-small-md { font-size: 0.875rem; line-height: 1.4; font-weight: 500; }
.text-small-sm { font-size: 0.75rem; line-height: 1.4; font-weight: 500; }
```

---

## 2. Visual System Rules

### Spacing System
Based on 4px increments for consistency:
```css
.space-1 { 4px }    .space-8 { 32px }
.space-2 { 8px }    .space-10 { 40px }
.space-3 { 12px }   .space-12 { 48px }
.space-4 { 16px }   .space-16 { 64px }
.space-5 { 20px }   .space-20 { 80px }
.space-6 { 24px }   .space-24 { 96px }
.space-7 { 28px }
```

### Card Rules
- **Base Card**: `bg-[#FFFEF7] border border-[#E5E5E5] rounded-2xl shadow-sm`
- **Premium Card**: `bg-white border border-[#D5D5D5] rounded-3xl shadow-md`
- **Section Card**: `bg-[#FFFAF0] border border-[#E5E5E5]/50 rounded-2xl`
- **Padding**: `px-6 py-5` (mobile), `px-8 py-6` (desktop)
- **Hover**: `shadow-lg border-[#D4A574]/30`

### Button Hierarchy
```css
/* Primary CTA */
.btn-primary {
  @apply bg-[#D4A574] text-white rounded-full px-6 py-3 font-semibold
         hover:bg-[#C19A6B] transition-colors;
}

/* Secondary CTA */
.btn-secondary {
  @apply bg-white text-[#1A1A1A] border border-[#D4A574] rounded-full px-6 py-3 font-semibold
         hover:bg-[#FFFAF0] transition-colors;
}

/* Tertiary CTA */
.btn-tertiary {
  @apply text-[#D4A574] font-semibold underline underline-offset-4
         hover:text-[#C19A6B] transition-colors;
}
```

### Badge/Chip Styling
```css
.chip-primary {
  @apply bg-[#D4A574]/10 text-[#8B6939] border border-[#D4A574]/30
         rounded-full px-3 py-1 text-sm font-medium;
}

.chip-secondary {
  @apply bg-[#FFFAF0] text-[#4A4A4A] border border-[#E5E5E5]
         rounded-full px-3 py-1 text-sm font-medium;
}
```

### Border & Shadow Rules
- **Subtle Border**: `border border-[#E5E5E5]`
- **Accent Border**: `border border-[#D4A574]/30`
- **Soft Shadow**: `shadow-sm` (`0 1px 3px rgba(0,0,0,0.05)`)
- **Card Shadow**: `shadow-md` (`0 4px 24px rgba(0,0,0,0.06)`)
- **Hover Shadow**: `shadow-lg` (`0 8px 32px rgba(0,0,0,0.08)`)

### Image Gallery Rules
- **Hero Image**: `rounded-2xl overflow-hidden aspect-[16/9]`
- **Gallery Grid**: `grid grid-cols-2 gap-3` (mobile), `grid grid-cols-3 gap-4` (desktop)
- **Gallery Item**: `rounded-xl overflow-hidden aspect-[4/3]`
- **Lightbox**: `fixed inset-0 bg-black/80 z-50`

### Empty State Rules
- **Container**: `max-w-md mx-auto text-center py-12`
- **Icon**: `w-16 h-16 mx-auto mb-4 text-[#D4A574]/40`
- **Title**: `text-heading-lg text-[#1A1A1A] mb-2`
- **Description**: `text-body-md text-[#7A7A7A] mb-6`
- **CTA**: Primary button style

---

## 3. Shared Page Architecture

### Standard Layout Structure
```
LeonixCategoryPageShell
├── Breadcrumb/Category Context
├── Hero/Title Block
├── Main Content Area
│   ├── Primary Content
│   ├── Key Facts Area
│   └── Trust/Safety Area
├── Right-side Sticky Contact Card (desktop)
├── Related Listings Section
└── More-in-Category Section
```

### Mobile Layout Rules
- **Mobile Stack**: Single column, full-width cards
- **Spacing**: `space-y-6` between sections
- **Padding**: `px-4` (mobile), `px-6` (tablet)
- **CTA Placement**: Sticky bottom or prominent inline

### Desktop Layout Rules
- **Max Width**: `max-w-7xl mx-auto`
- **Two-Column**: Main content + sticky sidebar when useful
- **Sidebar Width**: `w-80` (320px)
- **Gap**: `gap-8` between columns

### Common Sections
- **Breadcrumb**: `text-small-sm text-[#7A7A7A] mb-4`
- **Hero Block**: Full-width with background/image
- **Section Cards**: Consistent padding and borders
- **Key Facts**: Grid layout, scannable format
- **Trust Strip**: Safety signals and verification
- **CTA Controls**: Clear edit/back on preview pages

---

## 4. Shared Component Strategy

### Recommended Components
```typescript
// Layout Components
LeonixCategoryPageShell      // Page wrapper with consistent layout
LeonixCategoryHero          // Hero section with title/media
LeonixPreviewHeroGallery    // Preview page hero with gallery
LeonixPreviewTitleBlock     // Title and metadata block

// Content Components
LeonixCategoryBadgeRow      // Category-specific badges/chips
LeonixStickyContactCard     // Desktop sticky contact CTA
LeonixSectionCard          // Reusable section container
LeonixDetailRows           // Key facts in row format
LeonixTrustStrip           // Safety/trust signals

// Navigation Components
LeonixRelatedListingsRail  // Related listings carousel
LeonixResultsCard          // Search results card
LeonixLandingHero          // Category landing hero

// State Components
LeonixEmptyPreviewState    // Empty preview state
LeonixEmptyResultsState    // Empty search results
```

### Component Rules
- **Consistent Props**: Use standardized prop interfaces
- **Responsive Design**: Mobile-first with desktop enhancements
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Lazy load images and optimize renders

---

## 5. Category Personality Rules

### Restaurantes
**Persona**: Premium restaurant profile
**Inspiration**: Yelp/OpenTable/Google restaurant profiles
**Priority Elements**:
- Food photography and gallery
- Cuisine type and service modes
- Hours and open status
- Call/directions/order/reserve CTAs
- Reviews and trust signals

**Visual Style**: Warm, appetizing, professional photography

### Servicios
**Persona**: Premium service provider
**Inspiration**: Yelp/Thumbtack/Angi
**Priority Elements**:
- Business name and service category
- Service area and coverage
- Quote/request contact CTA
- Trust badges and verification
- Services offered list
- Customer reviews

**Visual Style**: Professional, trustworthy, service-focused

### Bienes Raíces
**Persona**: Premium property profile
**Inspiration**: Zillow/Homes.com
**Priority Elements**:
- Property gallery and virtual tours
- Price and key facts (beds/baths/sqft)
- Location and neighborhood info
- Facts strip with quick details
- Contact agent card
- Mortgage calculator (if applicable)

**Visual Style**: Sophisticated, spacious, high-quality imagery

### Rentas
**Persona**: Rental-focused housing
**Priority Elements**:
- Monthly price prominence
- Bedroom/bathroom counts
- Availability dates
- Lease terms and requirements
- Renter-friendly contact flow
- Neighborhood amenities

**Visual Style**: Accessible, clear, renter-focused

### Autos
**Persona**: Premium vehicle showroom
**Inspiration**: AutoTrader/Cars.com
**Priority Elements**:
- Vehicle gallery (exterior/interior)
- Price and financing options
- Mileage and specifications
- Seller/dealer information
- Vehicle history reports
- Test drive scheduling

**Visual Style**: Sleek, technical, showroom-quality

### En Venta
**Persona**: Local marketplace items
**Inspiration**: Facebook Marketplace/eBay
**Priority Elements**:
- Product photos (multiple angles)
- Price and condition
- Seller information and ratings
- Safety/trust signals
- Pickup/delivery options
- Item specifications

**Visual Style**: Clean, product-focused, community-safe

### Empleos
**Persona**: Clean job opportunity page
**Inspiration**: Indeed/LinkedIn
**Priority Elements**:
- Job title and company branding
- Location and work type
- Salary/benefits information
- Job facts and requirements
- Apply/contact CTA
- Company culture insights

**Visual Style**: Professional, corporate, opportunity-focused

### Travel
**Persona**: Travel offer or agency
**Priority Elements**:
- Destination imagery and details
- Package inclusions and pricing
- Dates and availability
- Agency credentials
- Reserve/contact CTA
- Travel insurance options

**Visual Style**: Inspiring, destination-focused, trustworthy

### Clases
**Persona**: Class/instructor profile
**Priority Elements**:
- Class title and instructor info
- Schedule and duration
- Location/online format
- Skill level requirements
- Enrollment CTA and pricing
- Student reviews

**Visual Style**: Educational, inviting, skill-focused

### Comunidad
**Persona**: Local announcement/event
**Priority Elements**:
- Date and time prominence
- Location and organizer
- Event details and agenda
- Community safety features
- RSVP/registration CTA
- Attendance information

**Visual Style**: Community-focused, event-oriented, safe

---

## 6. Screenshot Reference Workflow

### Reference Gathering Rules
1. **Collect 3-5 competitor screenshots** per category
2. **Use only for layout analysis** - not branding
3. **Document patterns** before editing code
4. **Translate structure** into Leonix style
5. **Never copy competitor branding** or exact UI

### Analysis Process
1. **Layout Mapping**: Identify section organization
2. **Hierarchy Analysis**: Note title/subtitle/CTA placement
3. **Component Structure**: Break down reusable elements
4. **Spacing Patterns**: Measure gaps and padding
5. **Mobile Behavior**: Document responsive changes

### Translation Rules
- **Adapt structure**, don't copy exactly
- **Apply Leonix colors** and typography
- **Use Spanish-first** terminology
- **Maintain premium feel** with warm aesthetics
- **Ensure accessibility** and proper contrast

---

## 7. Layered Prompting Workflow

### Layer 1: Structure & Architecture
- Page layout and section organization
- Component hierarchy and placement
- Mobile vs desktop structure
- Navigation and flow patterns

### Layer 2: Category-Specific Details
- Metadata and facts display
- Category-specific CTAs
- Trust signals and verification
- Key information prioritization

### Layer 3: Visual Polish
- Spacing and typography refinement
- Shadows, borders, and visual effects
- Color application and contrast
- Responsive refinements

### Layer 4: Wording & Clarity
- Spanish-first terminology
- Clear, concise descriptions
- Action-oriented CTAs
- Helpful helper text

### Layer 5: Build & Audit
- `npm run build` verification
- TRUE/FALSE audit completion
- Performance validation
- Accessibility verification

---

## 8. QA Safety Rules

### Do Not Change (Runtime Systems)
- Supabase database operations
- Publish handlers and validation logic
- Route structure and auth behavior
- Image upload behavior and processing
- Payment logic and financial operations
- Dashboard/admin lifecycle actions
- Database contracts and schemas

### Bug Fix Exceptions
- Only fix documented, confirmed bugs
- Must be directly related to current task
- Document the issue and solution
- Test thoroughly before deployment

### Safe Modification Areas
- Component styling and layout
- Typography and spacing
- Visual hierarchy and presentation
- User experience flows
- Mobile responsiveness
- Accessibility improvements

---

## 9. Required Gates for Future Category Work

### Application Form Gates
- [ ] Spanish-first wording is clear and natural
- [ ] Required fields are understandable and properly labeled
- [ ] Helper text reduces confusion and provides guidance
- [ ] Layout feels Leonix premium (not generic)
- [ ] Mobile form experience is clean and accessible

### Preview Page Gates
- [ ] Preview feels premium enough to inspire publishing
- [ ] Important category details are visible and prominent
- [ ] CTA/contact presentation is clear and accessible
- [ ] Empty states look intentional and helpful
- [ ] Layout follows Leonix design system consistently

### Public Detail Page Gates
- [ ] Strong title/media hierarchy draws attention
- [ ] Key facts are easy to scan and understand
- [ ] Contact/CTA card is clear and prominent
- [ ] Trust/safety area exists or is intentionally handled
- [ ] Category-specific sections feel complete and useful

### Results Page Gates
- [ ] Listing cards are scannable and premium-looking
- [ ] Filters/search/sort are understandable and functional
- [ ] Empty states are helpful and on-brand
- [ ] Mobile results experience is clean and usable
- [ ] Featured/promoted treatment is polished (if present)

### Landing Page Gates
- [ ] Hero clearly explains category value proposition
- [ ] CTA wording is strong and Spanish-first
- [ ] Category feels tailored, not generic
- [ ] Search/filter entry is clear and accessible
- [ ] Visual style follows Leonix design system

---

## 10. Operational Directive

### Pre-Work Checklist
Before any UI work on Clasificados category pages:

1. **Read LEONIX_CATEGORY_DESIGN_SYSTEM.md** completely
2. **Inspect target category files** thoroughly
3. **Review shared components** for reuse opportunities
4. **Examine existing category patterns** for consistency
5. **Perform TRUE/FALSE audit** before making changes
6. **Fix only FALSE gates** - don't over-engineer
7. **Run `npm run build`** to verify changes
8. **Return completion audit** with results

### Implementation Rules
- **Follow layered prompting** workflow strictly
- **Use screenshot references** responsibly
- **Maintain Spanish-first** approach throughout
- **Preserve premium feel** in all interactions
- **Test mobile experience** at every layer
- **Verify accessibility** before completion

### Quality Standards
- **No generic styling** - always feel Leonix
- **Consistent spacing** using the defined system
- **Proper hierarchy** with clear typography
- **Warm, trustworthy aesthetic** throughout
- **Mobile-first responsive** design
- **Accessibility compliance** as standard

---

## Usage Guidelines

This design system is the single source of truth for all Leonix Clasificados category experiences. Any deviation from these rules must be intentional and documented.

When in doubt:
1. Choose the warmer, more premium option
2. Prioritize Spanish-first communication
3. Maintain consistency with existing patterns
4. Test thoroughly across devices
5. Verify build success before completion

**Leonix Clasificados should always feel like a premium, trustworthy, local marketplace that serves the Spanish-speaking community first while welcoming everyone.**
