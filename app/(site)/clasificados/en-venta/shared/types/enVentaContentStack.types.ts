export type EnVentaContentFact = {
  label: string;
  value: string;
};

export type EnVentaDeliveryItem = {
  label: string;
  note: string | null;
};

export type EnVentaContentStackModel = {
  description: string;
  itemFacts: EnVentaContentFact[];
  conditionAndUse: string | null;
  accessories: string | null;
  technicalDetails: string | null;
  deliveryItems: EnVentaDeliveryItem[];
  /** Compact labels for contact card chips only. */
  deliveryChipLabels: string[];
};

export const EN_VENTA_CONTENT_STACK_COPY = {
  es: {
    description: "Descripción",
    itemDetails: "Detalles del artículo",
    condition: "Estado",
    itemType: "Tipo de artículo",
    category: "Categoría",
    brand: "Marca",
    model: "Modelo",
    quantity: "Cantidad",
    conditionUse: "Condición y uso",
    accessories: "Accesorios incluidos",
    technical: "Detalles técnicos / especificaciones",
    delivery: "Entrega",
    deliveryHeader: "Entrega / logística",
  },
  en: {
    description: "Description",
    itemDetails: "Item details",
    condition: "Condition",
    itemType: "Item type",
    category: "Category",
    brand: "Brand",
    model: "Model",
    quantity: "Quantity",
    conditionUse: "Condition and use",
    accessories: "Included accessories",
    technical: "Technical details / specifications",
    delivery: "Delivery",
    deliveryHeader: "Delivery / logistics",
  },
} as const;
