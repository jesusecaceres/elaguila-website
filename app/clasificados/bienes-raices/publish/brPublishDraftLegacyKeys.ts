/**
 * BR publish wizard still reads/writes some draft fields under legacy shared-wizard keys.
 * Use these constants in BR-owned validation and mapping so call sites do not scatter `enVenta*` strings.
 */
export const BR_PUBLISH_FULL_DESCRIPTION_KEY = "enVentaFullDescription" as const;
export const BR_PUBLISH_PROPERTY_TYPE_KEY = "enVentaPropertyType" as const;
export const BR_PUBLISH_BEDROOMS_KEY = "enVentaBedrooms" as const;
export const BR_PUBLISH_BATHROOMS_KEY = "enVentaBathrooms" as const;
export const BR_PUBLISH_SQUARE_FEET_KEY = "enVentaSquareFeet" as const;
export const BR_PUBLISH_LOT_SIZE_KEY = "enVentaLotSize" as const;
export const BR_PUBLISH_BUSINESS_NAME_KEY = "enVentaBusinessName" as const;
