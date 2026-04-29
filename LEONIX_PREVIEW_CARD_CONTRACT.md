# Leonix Preview Card Contract

## Overview

This contract defines the mandatory preview card standard for every Leonix Clasificados category. Every preview card must follow these standards to ensure consistency, premium quality, and proper field preservation across the platform.

---

## 1. Core Card Anatomy

Every preview card should intentionally handle:

### Required Sections
- **Media Block**: Hero image or intentional fallback with proper aspect ratio
- **Category Badge**: Clear category identification
- **Title**: Strong hierarchy with business/item name
- **Location/Context**: City, neighborhood, or relevant context
- **Category-Specific Facts**: Price, cuisine, service modes, etc.
- **Price/Status Row**: When relevant to the category
- **Trust/Safety Row**: Ratings, verification status, or trust indicators
- **Engagement Metrics Row**: Planned space for Vistas, Me gusta, Guardados, Compartidos
- **CTA/Action Area**: Clear primary actions based on available data
- **Empty/Missing Data State**: Intentional fallbacks for incomplete listings
- **Mobile Behavior**: Responsive, touch-friendly layout

### Optional Sections (Category-Specific)
- **Service Mode Indicators**: dine-in, takeout, delivery, etc.
- **Operating Hours**: Current status or hours preview
- **Special Features**: Highlights, amenities, or unique attributes
- **Secondary Media**: Gallery preview or additional images

---

## 2. Shared Visual Rules

### Color System
- **Card Surface**: Warm cream/ivory (`#FFFAF0`, `#FFFEF7`)
- **Border**: Subtle gold (`#D4A574`, `#E5E5E5`)
- **Text Hierarchy**: Charcoal (`#1A1A1A`, `#4A4A4A`, `#7A7A7A`)
- **Accent Elements**: Gold (`#D4A574`, `#C19A6B`)
- **Background**: Ivory (`#F9F6F1`)

### Typography
- **Spanish-first labels**: Primary labels in Spanish, English as fallback
- **Clear hierarchy**: Strong title, readable body text, muted secondary info
- **Consistent sizing**: Use Leonix design system scale
- **Premium fonts**: Clean, readable typography

### Layout
- **Rounded corners**: `rounded-2xl` (16px) or `rounded-3xl` (24px)
- **Soft shadows**: `0 8px 32px rgba(42,36,22,0.1)` or similar
- **Generous spacing**: Clean breathing room between elements
- **Consistent padding**: Standard internal spacing
- **Mobile-first**: Responsive design with touch targets

### Design Principles
- **Premium marketplace look**: High-quality, trustworthy appearance
- **No generic dashboard styling**: Avoid admin/panel aesthetics
- **No competitor branding**: Original Leonix identity only
- **Clean, scannable layout**: Easy to parse key information
- **Professional yet warm**: Balance business credibility with approachable feel

---

## 3. Full Data Rule

### Field Preservation Requirement
Every application field must be mapped to an output destination before UI work begins.

### Destination Categories
1. **Preview card primary**: Most important compact information
2. **Preview card secondary**: Supporting details for cards
3. **Public detail page**: Full listing information
4. **Results card**: Search/browse listing cards
5. **Owner dashboard**: Analytics and management interface
6. **Contact/CTA logic**: Action buttons and communication channels
7. **Analytics/metrics**: Engagement tracking and reporting
8. **Admin/moderation**: Review and management tools
9. **SEO/share metadata**: Search optimization and social sharing
10. **Publish payload only**: Backend processing and storage

### Compact Card Priority
Preview cards should prioritize the highest-value fields only:
- Essential identification (name, title, business name)
- Key category information (price, type, location)
- Primary visual elements (hero image)
- Core contact/CTA options
- Trust indicators

### No Field Loss
- **Do not drop fields**: Every field must have a destination
- **Do not ignore fields**: Even admin-only fields must be mapped
- **Do not rename fields**: Preserve original field names
- **Do not disconnect fields**: Maintain data flow integrity

---

## 4. Engagement Metrics Rule

### Required Metrics Space
Every preview card should have a planned place for:
- **Vistas**: View count
- **Me gusta**: Like count  
- **Guardados**: Save/favorite count
- **Compartidos**: Share count

### Implementation Guidelines
- **Use shared analytics components**: LeonixEngagementBar, LeonixMetricPill, etc.
- **Real metrics only**: Use actual analytics data when available
- **Reserve layout intentionally**: If metrics not available, reserve space
- **No fake counts**: Never display fabricated engagement numbers
- **Spanish-first labels**: Vistas, Me gusta, Guardados, Compartidos

### Analytics Integration
- **Track real events**: Use clasificadosAnalytics.ts for tracking
- **Double-count protection**: Prevent duplicate engagement tracking
- **Category-aware metrics**: Respect category-specific event types
- **Owner-safe display**: Show counts only, no user identities

---

## 5. Category-Specific Card Priorities

### Restaurantes
**Primary card fields:**
- Restaurant/business name
- Hero image or fallback
- Cuisine/type
- City/neighborhood or address context
- Open status/hours if available
- Service modes if available
- Primary CTA when available
- Engagement metrics area when available or intentionally reserved

**Secondary/detail fields:**
- Full address
- ZIP
- Website
- Phone
- Menu/order/reservation fields
- Notes
- Specialties
- Owner/dashboard-only fields
- Admin/moderation fields
- SEO/share fields

**Possible CTAs:**
- Llamar
- Cómo llegar
- Sitio web
- Ordenar
- Reservar

### Servicios
**Primary card fields:**
- Business/service name
- Service category
- Service area
- City/location
- Quote/contact CTA
- Trust badge
- Hero image or fallback

### Bienes Raíces
**Primary card fields:**
- Price
- Property type
- Beds
- Baths
- Square feet if available
- City/address context
- Hero image
- Contact CTA

### Rentas
**Primary card fields:**
- Monthly rent
- Beds
- Baths
- Availability
- Rental type
- City/address context
- Contact CTA

### Autos
**Primary card fields:**
- Year
- Make
- Model
- Price
- Mileage
- Condition
- City/location
- Seller/dealer CTA

### En Venta
**Primary card fields:**
- Item title
- Price
- Condition
- City/location
- Hero image
- Seller/contact CTA

### Empleos
**Primary card fields:**
- Job title
- Company
- Location
- Pay range if available
- Job type
- Apply/contact CTA

### Travel / Viajes
**Primary card fields:**
- Destination
- Package/trip type
- Dates if available
- Price if available
- Provider/agency
- Reserve/contact CTA

### Clases
**Primary card fields:**
- Class title
- Instructor/provider
- Schedule
- Location or online status
- Price if available
- Enrollment CTA

### Comunidad
**Primary card fields:**
- Event/announcement title
- Date/time if available
- Location
- Organizer
- Category/type
- Details/contact CTA

---

## 6. Implementation Requirements

### Technical Standards
- **TypeScript**: Strong typing for all card components
- **Responsive design**: Mobile-first approach
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Optimized images and lazy loading
- **Error handling**: Graceful fallbacks for missing data

### Quality Assurance
- **Visual consistency**: Follow design system exactly
- **Data integrity**: No field loss or corruption
- **Cross-category compatibility**: Shared components work everywhere
- **Analytics integration**: Proper event tracking
- **Build compliance**: Must pass all build gates

### Maintenance
- **Documentation**: Clear component props and usage
- **Testing**: Comprehensive test coverage
- **Version compatibility**: Backward compatible when possible
- **Performance monitoring**: Track card rendering performance

---

## 7. Compliance and Safety

### Data Protection
- **No user identity exposure**: Show counts only, not who engaged
- **Privacy compliance**: Respect user privacy settings
- **Secure data handling**: Protect sensitive information

### Content Standards
- **Appropriate content**: Safe for all audiences
- **Quality control**: Maintain high visual standards
- **Brand consistency**: Leonix identity throughout

### Legal Compliance
- **Terms of service**: All cards comply with platform terms
- **Regional regulations**: Respect local laws and requirements
- **Accessibility standards**: WCAG compliance where applicable

---

## 8. Success Metrics

### User Experience
- **Visual appeal**: Premium, trustworthy appearance
- **Information clarity**: Easy to scan and understand
- **Mobile experience**: Smooth touch interactions
- **Loading performance**: Fast rendering and interactions

### Business Metrics
- **Engagement rates**: Higher interaction with listings
- **Conversion rates**: More successful CTA actions
- **User satisfaction**: Positive feedback on card design
- **Category consistency**: Uniform experience across categories

### Technical Metrics
- **Build success**: All cards compile without errors
- **Performance scores**: Fast loading and rendering
- **Error rates**: Minimal rendering or data errors
- **Analytics coverage**: Complete engagement tracking

---

## 9. Future Considerations

### Scalability
- **New categories**: Framework supports future category additions
- **Feature expansion**: Easy to add new card features
- **Design evolution**: Adaptable to future design updates

### Internationalization
- **Multi-language support**: Framework ready for expansion
- **Regional variations**: Adaptable to different markets
- **Cultural sensitivity**: Respect local customs and preferences

### Technology Evolution
- **Modern frameworks**: Compatible with latest React/Next.js
- **Device support**: Works on new device types and sizes
- **Performance optimization**: Leverages new web technologies

---

This contract ensures that every Leonix preview card maintains premium quality, consistency, and proper data management while providing excellent user experiences across all categories.
