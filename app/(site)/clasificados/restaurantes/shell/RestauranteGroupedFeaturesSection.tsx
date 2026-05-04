"use client";

import type { GroupedFeatures } from "../lib/restauranteFeaturesNormalization";

// Leonix visual tokens
const SECTION_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden";
const SECTION_PADDING = "p-6 sm:p-8";
const SECTION_TITLE = "text-2xl sm:text-3xl font-bold text-[#1F1A17] leading-tight";
const SECTION_DESCRIPTION = "text-base text-[#5A5148] leading-relaxed mt-2";

// Group section styling
const GROUP_CARD = "rounded-2xl border border-[#D8C2A0]/30 bg-[#FFFAF3] p-5 shadow-sm";
const GROUP_TITLE = "text-lg font-semibold text-[#1F1A17] mb-2";
const GROUP_DESCRIPTION = "text-sm text-[#5A5148] mb-4";
const FEATURE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] inline-flex items-center gap-1";
const CHIPS_CONTAINER = "flex flex-wrap gap-2";

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

  return (
    <section className={`${SECTION_CARD} ${className}`}>
      <div className={SECTION_PADDING}>
        {/* Section Header */}
        <div className="mb-8">
          <h2 className={SECTION_TITLE}>Servicios y Características</h2>
          <p className={SECTION_DESCRIPTION}>
            Descubre todo lo que este restaurante tiene para ofrecer, desde sus servicios especializados hasta el ambiente único que lo distingue.
          </p>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:place-items-center">
          {nonEmptyGroups.map(([groupKey, group]) => (
            <GroupCard key={groupKey} group={group} />
          ))}
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="sm:hidden space-y-4">
          {nonEmptyGroups.map(([groupKey, group]) => (
            <GroupCard key={groupKey} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface GroupCardProps {
  group: GroupedFeatures[keyof GroupedFeatures];
}

function GroupCard({ group }: GroupCardProps) {
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

  return (
    <div className={GROUP_CARD}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{getGroupIcon(group.title)}</span>
        <h3 className={GROUP_TITLE}>{group.title}</h3>
      </div>
      
      <p className={GROUP_DESCRIPTION}>{group.description}</p>
      
      <div className={CHIPS_CONTAINER}>
        {group.items.map((item, index) => (
          <span key={index} className={FEATURE_CHIP}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
