export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string | null;
  shortDesc: string;
  fullDesc: string;
  image: string;
  specs: { label: string; value: string }[];
  features: string[];
  active?: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  variants?: { weight: string; code: string; dimensions: string; image?: string }[];
}

const MOLD_1 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-1-5vT3QTNw6BxBkwMSygYHDA.webp";
const MOLD_2 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-2-cRRW7whFyGNvUVhPQNHcA7.webp";
const MOLD_3 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/mold-product-3-noA5DzgpnzWafwHiKCsiQT.webp";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    active: true,
    code: "HC-PD-001",
    name: "Molde Pan Dulce",
    category: "Pan Dulce",
    shortDesc: "Molde de cartón para pan dulce tradicional, disponible en tamaños de 500g, 1kg y 2kg.",
    fullDesc:
      "Molde de cartón de alta resistencia para pan dulce tradicional. Fabricado en cartulina especial de 400 g/m², resistente al calor del horno y a la humedad de la masa. Disponible en formatos de 500 g, 1 kg y 2 kg. Apto para líneas de producción automáticas.",
    image: MOLD_1,
    specs: [
      { label: "Código", value: "HC-PD-001" },
      { label: "Formatos", value: "500 g / 1 kg / 2 kg" },
      { label: "Material", value: "Cartulina 400 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 220°C" },
      { label: "Resistencia humedad", value: "Alta" },
    ],
    features: [
      "Resistente al calor del horno",
      "Compatible con líneas automáticas",
      "Imprimible en offset y flexografía",
      "Varios formatos disponibles",
    ],
  },
  {
    id: "p2",
    active: true,
    code: "HC-PP-002",
    name: "Molde Pan de Pascua",
    category: "Pan de Pascua",
    shortDesc: "Molde de cartón para pan de pascua, forma cilíndrica alta con base reforzada.",
    fullDesc:
      "Molde cilíndrico de cartón para pan de pascua. Su forma alta y base reforzada garantizan una cocción pareja y una presentación impecable. Fabricado en cartulina estucada de alta blancura, ideal para impresión a full color.",
    image: MOLD_2,
    specs: [
      { label: "Código", value: "HC-PP-002" },
      { label: "Formatos", value: "500 g / 1 kg" },
      { label: "Material", value: "Cartulina estucada 380 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 210°C" },
      { label: "Forma", value: "Cilíndrica alta" },
    ],
    features: [
      "Base reforzada para mayor estabilidad",
      "Forma cilíndrica alta tradicional",
      "Apto para impresión full color",
      "Alta resistencia a la humedad",
    ],
  },
  {
    id: "p3",
    active: true,
    code: "HC-BU-003",
    name: "Molde Budín",
    category: "Budín",
    shortDesc: "Molde rectangular de cartón para budín inglés y budín de pan, con tapa incluida.",
    fullDesc:
      "Molde rectangular de cartón para budín inglés y budín de pan. Diseño con bordes altos y esquinas reforzadas para mantener la forma durante la cocción. Disponible con tapa de cartón plastificado para protección y presentación en góndola.",
    image: MOLD_3,
    specs: [
      { label: "Código", value: "HC-BU-003" },
      { label: "Formatos", value: "400 g / 750 g / 1 kg" },
      { label: "Material", value: "Cartulina 350 g/m² plastificada" },
      { label: "Resistencia térmica", value: "Hasta 200°C" },
      { label: "Incluye", value: "Tapa de cartón" },
    ],
    features: [
      "Incluye tapa para presentación en góndola",
      "Esquinas reforzadas",
      "Diseño rectangular clásico",
      "Apto para freezer",
    ],
  },
  {
    id: "p4",
    active: true,
    code: "HC-RB-004",
    name: "Molde Rosca / Bizcochuelo",
    category: "Rosca / Bizcochuelo",
    shortDesc: "Molde de cartón redondo para rosca de reyes y bizcochuelo, con orificio central.",
    fullDesc:
      "Molde redondo de cartón para rosca de reyes y bizcochuelo. El orificio central garantiza una cocción uniforme en el interior. Disponible en diámetros de 20, 24 y 28 cm. La base rigidizada soporta la masa sin deformarse durante el horneado.",
    image: MOLD_1,
    specs: [
      { label: "Código", value: "HC-RB-004" },
      { label: "Diámetros", value: "20 / 24 / 28 cm" },
      { label: "Material", value: "Cartulina 420 g/m²" },
      { label: "Resistencia térmica", value: "Hasta 220°C" },
      { label: "Forma", value: "Redonda con orificio central" },
    ],
    features: [
      "Orificio central para cocción uniforme",
      "Base rigidizada antideformación",
      "Tres diámetros disponibles",
      "Apto para decoración y presentación directa",
    ],
  },
];
