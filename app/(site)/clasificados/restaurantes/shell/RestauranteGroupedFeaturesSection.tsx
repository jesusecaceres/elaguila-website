"use client";

import type { GroupedFeatures } from "../lib/restauranteFeaturesNormalization";

// Leonix visual tokens
const SECTION_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden";
const SECTION_PADDING = "p-4 sm:p-6 md:p-8";

// Header: compact left on mobile, centered on md+
const HEADER_CONTAINER = "mb-6 text-left md:mb-12 md:text-center";
const SECTION_TITLE = "mb-3 text-xl font-bold leading-tight tracking-tight text-[#1F1A17] md:mb-4 md:text-2xl lg:text-3xl";
const SECTION_DIVIDER = "mx-auto mb-3 h-1 w-20 bg-gradient-to-r from-transparent via-[#BEA98E] to-transparent md:mb-4 md:w-24";
const SECTION_DESCRIPTION = "max-w-2xl text-sm leading-relaxed text-[#5A5148] md:mx-auto md:text-base";

// Grouped block: tighter on mobile
const GROUP_BLOCK = "rounded-2xl border border-[#D8C2A0]/50 bg-[#FFFAF3] p-3 shadow-sm md:p-6";
const GROUP_CONTAINER = "flex items-start gap-2 md:gap-4";
const ICON_MEDALLION =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6EBDD] text-base md:h-12 md:w-12 md:text-xl";
const GROUP_CONTENT = "flex-1 min-w-0";
const GROUP_TITLE = "mb-1 text-base font-semibold text-[#1F1A17] md:mb-2 md:text-lg";
const GROUP_DESCRIPTION = "mb-2 text-xs leading-snug text-[#5A5148] md:mb-4 md:text-sm";
const FEATURE_CHIP =
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-[#D8C2A0] bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17] md:px-3 md:py-1.5 md:text-xs";
const CHIPS_CONTAINER =
  "-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:flex-wrap md:overflow-visible md:gap-2";

// Layout containers
const FULL_WIDTH_GROUPS = "space-y-6 mb-6";
const BOTTOM_ROW_GROUPS = "grid grid-cols-1 md:grid-cols-2 gap-6";

interface RestauranteGroupedFeaturesSectionProps {
  features: GroupedFeatures;
  className?: string;
}

export function RestauranteGroupedFeaturesSection({ 
  features, 
  className = "" 
}: RestauranteGroupedFeaturesSectionProps) {
  // Filter out empty groups
  const nonEmptyGroups = Object.entries(features).filter(([_, group]) => group.items.length > 0);

  if (nonEmptyGroups.length === 0) {
    return null;
  }

  // Organize groups by layout position
  const fullWidthGroups = nonEmptyGroups.filter(([key]) => 
    ['servicios', 'cocina_y_estilo', 'ambiente_y_amenidades'].includes(key)
  );
  const bottomRowGroups = nonEmptyGroups.filter(([key]) => 
    ['idiomas', 'precio'].includes(key)
  );

  return (
    <section className={`${SECTION_CARD} ${className}`}>
      <div className={SECTION_PADDING}>
        {/* Centered Section Header */}
        <div className={HEADER_CONTAINER}>
          <h2 className={SECTION_TITLE}>Servicios y Características</h2>
          <div className={SECTION_DIVIDER}></div>
          <p className={SECTION_DESCRIPTION}>
            Descubre todo lo que este restaurante tiene para ofrecer, desde sus servicios especializados hasta el ambiente único que lo distingue.
          </p>
        </div>

        {/* Desktop Layout - Grouped Structure */}
        <div className="hidden md:block">
          {/* Full-width groups */}
          {fullWidthGroups.length > 0 && (
            <div className={FULL_WIDTH_GROUPS}>
              {fullWidthGroups.map(([groupKey, group]) => (
                <GroupBlock key={groupKey} group={group} />
              ))}
            </div>
          )}
          
          {/* Bottom row with two half-width groups */}
          {bottomRowGroups.length > 0 && (
            <div className={BOTTOM_ROW_GROUPS}>
              {bottomRowGroups.map(([groupKey, group]) => (
                <GroupBlock key={groupKey} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="space-y-3 md:hidden">
          {nonEmptyGroups.map(([groupKey, group]) => (
            <GroupBlock key={groupKey} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface GroupBlockProps {
  group: GroupedFeatures[keyof GroupedFeatures];
}

function GroupBlock({ group }: GroupBlockProps) {
  // Icon mapping for groups
  const getGroupIcon = (title: string) => {
    switch (title) {
      case 'Servicios':
        return '🍽️';
      case 'Cocina y estilo':
        return '👨‍🍳';
      case 'Ambiente y amenidades':
        return '✨';
      case 'Idiomas':
        return '🗣️';
      case 'Precio':
        return '💰';
      default:
        return '📍';
    }
  };

  // Clean up "Otro:" prefixes from items
  const cleanItems = group.items.map(item => {
    if (item.startsWith('Otro: ')) {
      return item.replace('Otro: ', '').trim();
    }
    return item;
  });

  return (
    <div className={GROUP_BLOCK}>
      <div className={GROUP_CONTAINER}>
        {/* Icon medallion */}
        <div className={ICON_MEDALLION}>
          {getGroupIcon(group.title)}
        </div>
        
        {/* Content */}
        <div className={GROUP_CONTENT}>
          <h3 className={GROUP_TITLE}>{group.title}</h3>
          <p className={GROUP_DESCRIPTION}>{group.description}</p>
          
          <div className={CHIPS_CONTAINER}>
            {cleanItems.map((item, index) => (
              <span key={index} className={FEATURE_CHIP}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
