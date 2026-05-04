"use client";

import type { GroupedFeatures } from "../lib/restauranteFeaturesNormalization";

// Leonix visual tokens
const SECTION_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden";
const SECTION_PADDING = "p-6 sm:p-8";

// Centered section header styling
const HEADER_CONTAINER = "text-center mb-12";
const SECTION_TITLE = "text-2xl sm:text-3xl font-bold text-[#1F1A17] leading-tight mb-4";
const SECTION_DIVIDER = "w-24 h-1 bg-gradient-to-r from-transparent via-[#BEA98E] to-transparent mx-auto mb-4";
const SECTION_DESCRIPTION = "text-base text-[#5A5148] leading-relaxed max-w-2xl mx-auto";

// Grouped block styling (matches mockup)
const GROUP_BLOCK = "rounded-2xl border border-[#D8C2A0]/50 bg-[#FFFAF3] p-6 shadow-sm";
const GROUP_CONTAINER = "flex items-start gap-4";
const ICON_MEDALLION = "w-12 h-12 rounded-full bg-[#F6EBDD] flex items-center justify-center text-xl flex-shrink-0";
const GROUP_CONTENT = "flex-1 min-w-0";
const GROUP_TITLE = "text-lg font-semibold text-[#1F1A17] mb-2";
const GROUP_DESCRIPTION = "text-sm text-[#5A5148] mb-4";
const FEATURE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] inline-flex items-center gap-1";
const CHIPS_CONTAINER = "flex flex-wrap gap-2";

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
        <div className="md:hidden space-y-6">
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
