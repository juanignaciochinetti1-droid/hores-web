import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ChevronRight, Search, Plus, X, SlidersHorizontal, Check, Trash2, Package, MoreVertical, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/utils/compressImage";

const VARIANT_PRESETS_BY_CATEGORY: Record<string, { weight: string; code: string; dimensions: string }[]> = {
  "Pan Dulce": [
    { weight: "100gr",  code: "PD70X60",   dimensions: "70x60mm"   },
    { weight: "250gr",  code: "PD90X70",   dimensions: "90x70mm"   },
    { weight: "400gr",  code: "PD100X100", dimensions: "100x100mm" },
    { weight: "500gr",  code: "PD110X110", dimensions: "110x110mm" },
    { weight: "550gr",  code: "PD115X105", dimensions: "115x105mm" },
    { weight: "600gr",  code: "PD120X110", dimensions: "120x110mm" },
    { weight: "700gr",  code: "PD130X120", dimensions: "130x120mm" },
    { weight: "1000gr", code: "PD140X120", dimensions: "140x120mm" },
  ],
  "Budín": [
    { weight: "500gr", code: "BUD180X80X60",    dimensions: "180x80x60mm" },
    { weight: "300gr", code: "BUD185X50X50",    dimensions: "185x50x50mm" },
    { weight: "300gr", code: "BUD185X50X50RCM", dimensions: "185x50x50mm" },
    { weight: "250gr", code: "BUD185X50X40",    dimensions: "185x50x40mm" },
    { weight: "250gr", code: "BUD185X50X40RCM", dimensions: "185x50x40mm" },
    { weight: "220gr", code: "BUD165X70X40",    dimensions: "165x70x40mm" },
    { weight: "200gr", code: "BUD155X49X41",    dimensions: "155x49x41mm" },
    { weight: "200gr", code: "BUD155X49X41RCM", dimensions: "155x49x41mm" },
    { weight: "180gr", code: "BUD135X50X40",    dimensions: "135x50x40mm" },
  ],
  "Bizcochuelo": [
    { weight: "180x50", code: "BIZ180X50", dimensions: "180x50mm" },
    { weight: "200x50", code: "BIZ200X50", dimensions: "200x50mm" },
    { weight: "220x50", code: "BIZ220X50", dimensions: "220x50mm" },
  ],
  "Rosca / Bizcochuelo": [
    { weight: "180x50", code: "BIZ180X50", dimensions: "180x50mm" },
    { weight: "200x50", code: "BIZ200X50", dimensions: "200x50mm" },
    { weight: "220x50", code: "BIZ220X50", dimensions: "220x50mm" },
  ],
  "Rosca": [
    { weight: "180x50", code: "ROS180X50", dimensions: "180x50mm" },
    { weight: "200x50", code: "ROS200X50", dimensions: "200x50mm" },
    { weight: "220x50", code: "ROS220X50", dimensions: "220x50mm" },
  ],
  "Pan de Pascua": [
    { weight: "130x50", code: "PDP130X50", dimensions: "130x50mm" },
    { weight: "140x50", code: "PDP140X50", dimensions: "140x50mm" },
    { weight: "150x50", code: "PDP150X50", dimensions: "150x50mm" },
    { weight: "160x50", code: "PDP160X50", dimensions: "160x50mm" },
    { weight: "170x50", code: "PDP170X50", dimensions: "170x50mm" },
    { weight: "180x60", code: "PDP180X60", dimensions: "180x60mm" },
    { weight: "190x90", code: "PDP190X90", dimensions: "190x90mm" },
  ],
};

type FormDefaults = {
  name: string;
  shortDesc: string;
  fullDesc: string;
  codePlaceholder: string;
  specs: { label: string; value: string }[];
  features: string[];
};

const FORM_DEFAULTS_BY_CATEGORY: Record<string, FormDefaults> = {
  "Pan Dulce": {
    name: "Molde Pan Dulce",
    shortDesc: "Molde de papel kraft para pan dulce tradicional, en múltiples tamaños.",
    fullDesc: "Molde de papel kraft para pan dulce tradicional. Lateral de papel kraft puro calandrado o monolúcido micro-perforado que permite una cocción uniforme. Fondo liso o micro corrugado. Impresión en un color con diseño flor estándar. Personalizable según especificación del cliente.",
    codePlaceholder: "HC-PD-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado / monolúcido de 80 / 100 grs. micro-perforado" },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido, calandrado o virgen de 60 / 80 ó 100 grs. Liso o micro corrugado." },
      { label: "Impresión",                value: "En un color. Diseño flor estándar color blanco." },
      { label: "Personalización",          value: "Según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800 y 600 unidades" },
    ],
    features: [
      "Papel kraft puro calandrado / monolúcido micro-perforado",
      "Fondo liso o micro corrugado",
      "Impresión en un color, diseño flor estándar",
      "Personalización según especificación del cliente",
      "Presentación en cajas de 600 a 1000 unidades",
    ],
  },
  "Pan de Pascua": {
    name: "Molde Pan de Pascua",
    shortDesc: "Molde de papel kraft para pan de pascua, con fondo reforzado.",
    fullDesc: "Molde de papel kraft para pan de pascua. Lateral de papel kraft calandrado o monolúcido. Impresión en uno o dos colores con motivo flor estándar o a pedido del cliente.",
    codePlaceholder: "HC-PP-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolúcido de 80 grs." },
      { label: "Fondo",                    value: "Papel kraft puro calandrado de 100 / 80 grs." },
      { label: "Impresión",                value: "En uno o dos colores según especificación del cliente" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1200, 1000, 800 y 600 unidades" },
    ],
    features: [
      "Papel kraft puro calandrado",
      "Impresión en uno o dos colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 600 a 1200 unidades",
    ],
  },
  "Budín": {
    name: "Molde Budín",
    shortDesc: "Molde de papel kraft supercalandrado para budín. Registro de diseño industrial nº 68.399.",
    fullDesc: "Molde de papel kraft puro supercalandrado para budín. Impresión en uno o dos colores con motivo flor estándar o a pedido del cliente. Cuenta con registro de diseño industrial nº 68.399.",
    codePlaceholder: "HC-BU-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro supercalandrado de 150 / 190 grs." },
      { label: "Impresión",                value: "En uno o 2 colores" },
      { label: "Motivo",                   value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1500, 1000 y 600 unidades" },
      { label: "Registro",                 value: "Diseño industrial nº 68.399" },
    ],
    features: [
      "Papel kraft puro supercalandrado de 150 / 190 grs.",
      "Impresión en uno o 2 colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 600 a 1500 unidades",
      "Registro de diseño industrial nº 68.399",
    ],
  },
};

const FORM_DEFAULTS_BY_SUBCATEGORY: Record<string, FormDefaults> = {
  "Rosca": {
    name: "Molde Rosca",
    shortDesc: "Molde de papel kraft para rosca, con cono central.",
    fullDesc: "Molde de papel kraft puro para rosca. Lateral calandrado o monolúcido, fondo monolúcido y cono supercalandrado. Impresión en dos colores con motivo flor estándar o a pedido del cliente.",
    codePlaceholder: "HC-ROS-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolucido de 100 grs." },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido de 100 grs." },
      { label: "Cono",                     value: "Papel kraft puro supercalandrado de 80 grs." },
      { label: "Impresión",                value: "En 2 (dos) colores" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800, 600 y 100 unidades" },
    ],
    features: [
      "Papel kraft puro calandrado o monolucido de 100 grs.",
      "Cono de papel kraft supercalandrado de 80 grs.",
      "Impresión en 2 colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 100 a 1000 unidades",
    ],
  },
  "Bizcochuelo": {
    name: "Molde Bizcochuelo",
    shortDesc: "Molde de papel kraft supercalandrado para bizcochuelo.",
    fullDesc: "Molde de papel kraft puro supercalandrado para bizcochuelo. Lateral y fondo de papel kraft calandrado o monolúcido. Impresión en uno o dos colores con motivo flor estándar o a pedido del cliente.",
    codePlaceholder: "HC-BIZ-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro supercalandrado de 100 grs." },
      { label: "Fondo",                    value: "Papel kraft puro calandrado / monolúcido de 100 grs." },
      { label: "Impresión",                value: "En uno o dos colores" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 800, 600 y 100 unidades" },
    ],
    features: [
      "Papel kraft puro supercalandrado de 100 grs.",
      "Impresión en uno o dos colores",
      "Motivos estándar o a pedido del cliente",
      "Presentación en cajas de 100 a 800 unidades",
    ],
  },
};

// Categories where variants use dimensions (base x height) instead of weight
const DIMENSION_BASED_CATEGORIES = new Set(["Pan de Pascua", "Bizcochuelo", "Rosca", "Rosca / Bizcochuelo"]);

const EMPTY_FORM = {
  code: "", name: "", shortDesc: "", fullDesc: "", image: "",
  subcategory: "",
  specs: [{ label: "", value: "" }],
  features: [""],
  variants: [] as { weight: string; code: string; dimensions: string; image: string }[],
  active: true,
};

interface VariantCardProps {
  variant: { weight: string; code: string; dimensions: string; image: string };
  fallbackImage: string;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function VariantCard({ variant, fallbackImage, isAdmin, onEdit, onDelete }: VariantCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", borderRadius: "0.75rem" }}
    >
      <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
        <img src={variant.image || fallbackImage} alt={variant.code} className="w-full h-full object-cover" />
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="font-bold text-sm leading-tight" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
          {variant.weight}
        </p>
        <p className="text-xs font-mono" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
          {variant.code}
        </p>
        <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
          {variant.dimensions}
        </p>
      </div>

      {isAdmin && (
        <div className="absolute top-1.5 right-1.5 z-20" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center w-6 h-6 rounded"
            style={{ backgroundColor: "oklch(0.12 0.005 285 / 0.72)", color: "oklch(0.85 0.01 85)", backdropFilter: "blur(4px)", transition: "background-color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.95)"; }}
            onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.72)"; }}
          >
            <MoreVertical size={12} />
          </button>
          {menuOpen && (
            <div
              className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden"
              style={{ backgroundColor: "oklch(0.17 0.005 285)", border: "1px solid oklch(1 0 0 / 15%)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.35)", zIndex: 30 }}
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors duration-100"
                style={{ color: "oklch(0.85 0.01 85)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 285)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
              </button>
              <div style={{ height: "1px", backgroundColor: "oklch(1 0 0 / 8%)" }} />
              <button
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors duration-100"
                style={{ color: "oklch(0.70 0.15 20)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 285)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <Trash2 size={11} /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Categoria() {
  const { nombre } = useParams<{ nombre: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [subFilter, setSubFilter] = useState<"all" | "Rosca" | "Bizcochuelo">("all");
  const filterRef = useRef<HTMLDivElement>(null);

  // When admin selects "Todos", fetch from /api/products/all to include inactive products
  const { products: allProducts, addProduct, updateProduct, loading } = useProducts(isAdmin && !showActive);
  const categoryName = decodeURIComponent(nombre ?? "");
  const isRoscaBiz = categoryName === "Rosca / Bizcochuelo";
  const products = allProducts.filter((p) => p.category === categoryName);
  const featured = products[0] ?? null;
  type VariantItem = { weight: string; code: string; dimensions: string; image: string };
  type VariantMeta = { v: VariantItem; i: number; fallbackImage: string; product: typeof products[0] };
  const allRBVariants: VariantMeta[] = isRoscaBiz
    ? products.flatMap((p) =>
        (p.variants || []).map((v, i) => ({
          v: v as VariantItem,
          i,
          fallbackImage: p.image || (featured?.image ?? ""),
          product: p,
        }))
      )
    : [];
  const roscaItems = isRoscaBiz
    ? allRBVariants.filter(({ v }) => v.code?.startsWith("ROS"))
    : [] as VariantMeta[];
  const bizItems = isRoscaBiz
    ? allRBVariants.filter(({ v }) => v.code?.startsWith("BIZ"))
    : [] as VariantMeta[];

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Featured card edit state
  const [featuredMenuOpen, setFeaturedMenuOpen] = useState(false);
  const featuredMenuRef = useRef<HTMLDivElement>(null);
  const [featuredEditOpen, setFeaturedEditOpen] = useState(false);
  const [featuredForm, setFeaturedForm] = useState({ image: "", name: "", shortDesc: "", fullDesc: "", specs: [{ label: "", value: "" }], features: [""] });
  const [featuredFormError, setFeaturedFormError] = useState<string | null>(null);
  const featuredFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [variantUploadIdx, setVariantUploadIdx] = useState<number | null>(null);

  // Variant edit state
  const [editVariantIdx, setEditVariantIdx] = useState<number | null>(null);
  const [editVariantProduct, setEditVariantProduct] = useState<typeof products[0] | null>(null);
  const [editVariantForm, setEditVariantForm] = useState({ weight: "", code: "", dimensions: "", image: "" });
  const [variantError, setVariantError] = useState<string | null>(null);
  const variantEditFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    if (filterOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (featuredMenuRef.current && !featuredMenuRef.current.contains(e.target as Node)) setFeaturedMenuOpen(false);
    };
    if (featuredMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [featuredMenuOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = addOpen || editVariantIdx !== null || featuredEditOpen ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [addOpen, editVariantIdx, featuredEditOpen]);

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q);
    const matchesFilter = !showActive || p.active !== false;
    const matchesSub = !isRoscaBiz || subFilter === "all" || p.subcategory === subFilter;
    return matchesSearch && matchesFilter && matchesSub;
  });

  const setSpec = (i: number, key: "label" | "value", val: string) =>
    setForm((prev) => { const specs = [...prev.specs]; specs[i] = { ...specs[i], [key]: val }; return { ...prev, specs }; });
  const addSpec = () => setForm((prev) => ({ ...prev, specs: [...prev.specs, { label: "", value: "" }] }));
  const removeSpec = (i: number) => setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, idx) => idx !== i) }));

  const setFeature = (i: number, val: string) =>
    setForm((prev) => { const features = [...prev.features]; features[i] = val; return { ...prev, features }; });
  const addFeature = () => setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  const removeFeature = (i: number) => setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  const addVariant = () => setForm((prev) => ({ ...prev, variants: [...prev.variants, { weight: "", code: "", dimensions: "", image: "" }] }));
  const removeVariant = (i: number) => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  const setVariant = (i: number, key: "weight" | "code" | "dimensions" | "image", val: string) =>
    setForm((prev) => { const variants = [...prev.variants]; variants[i] = { ...variants[i], [key]: val }; return { ...prev, variants }; });

  const closeForm = () => { setAddOpen(false); setForm(EMPTY_FORM); setFormError(null); };

  const openFeaturedEdit = () => {
    if (!featured) return;
    setFeaturedForm({
      image: featured.image ?? "",
      name: featured.name,
      shortDesc: featured.shortDesc,
      fullDesc: featured.fullDesc ?? "",
      specs: featured.specs.length ? featured.specs : [{ label: "", value: "" }],
      features: featured.features.length ? featured.features : [""],
    });
    setFeaturedFormError(null);
    setFeaturedEditOpen(true);
    setFeaturedMenuOpen(false);
  };

  const handleSaveFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featured) return;
    setFeaturedFormError(null);
    try {
      await updateProduct({
        ...featured,
        image: featuredForm.image,
        name: featuredForm.name,
        shortDesc: featuredForm.shortDesc,
        fullDesc: featuredForm.fullDesc,
        specs: featuredForm.specs.filter((s) => s.label.trim()),
        features: featuredForm.features.filter((f) => f.trim()),
      });
      setFeaturedEditOpen(false);
    } catch (err: any) {
      setFeaturedFormError(err.message ?? "Error al guardar");
    }
  };

  const openEditVariant = (i: number, v: { weight: string; code: string; dimensions: string; image?: string }, product?: typeof products[0]) => {
    setEditVariantIdx(i);
    setEditVariantProduct(product ?? featured);
    setEditVariantForm({ weight: v.weight, code: v.code, dimensions: v.dimensions, image: v.image ?? "" });
    setVariantError(null);
  };

  const handleDeleteVariant = async (i: number, product?: typeof products[0]) => {
    const target = product ?? featured;
    if (!target) return;
    const newVariants = (target.variants ?? []).filter((_, idx) => idx !== i);
    try {
      await updateProduct({ ...target, variants: newVariants });
    } catch {
      // silent — product card stays as-is on error
    }
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = editVariantProduct ?? featured;
    if (!target || editVariantIdx === null) return;
    setVariantError(null);
    const newVariants = (target.variants ?? []).map((v, i) =>
      i === editVariantIdx ? { ...v, ...editVariantForm } : v
    );
    try {
      await updateProduct({ ...target, variants: newVariants });
      setEditVariantIdx(null);
    } catch (err: any) {
      setVariantError(err.message ?? "Error al guardar");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await addProduct({
        id: `p-${crypto.randomUUID()}`,
        code: form.code,
        name: form.name,
        category: categoryName,
        subcategory: form.subcategory || null,
        shortDesc: form.shortDesc,
        fullDesc: form.fullDesc,
        image: form.image,
        specs: form.specs.filter((s) => s.label.trim()),
        features: form.features.filter((f) => f.trim()),
        variants: form.variants.filter((v) => v.weight.trim() || v.code.trim()),
        active: form.active,
      });
      closeForm();
    } catch (err: any) {
      setFormError(err.message ?? "Error al guardar");
    }
  };

  const addInputStyle: React.CSSProperties = {
    backgroundColor: "var(--section-card-inner)",
    border: "1px solid var(--section-border)",
    color: "var(--section-heading)",
    fontFamily: "var(--font-body)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const addLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    marginBottom: "4px",
    color: "var(--section-muted)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.03em",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>
      <Navbar activeSection="" />

      <main className="container py-28">
        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-sm">Cargando productos...</span>
            </div>
          </div>
        )}

        {!loading && <>
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-10 text-sm transition-colors duration-150"
          style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
        >
          <ArrowLeft size={15} />
          Volver al inicio
        </button>

        {/* Category title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
          <span
            className="text-xs font-medium tracking-[0.25em] uppercase"
            style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
          >
            Catálogo
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold mb-12"
          style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
        >
          Moldes para {categoryName}
        </h1>

        {/* Featured presentation: image left + specs right */}
        {featured && (
          <div
            className="flex flex-col md:flex-row gap-0 mb-20 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid var(--section-border)",
              backgroundColor: "var(--section-card)",
            }}
          >
            {/* Image */}
            <div
              className="md:w-[45%] flex-shrink-0 relative self-stretch"
              style={{ backgroundColor: "var(--section-card-inner)", minHeight: "320px" }}
            >
              <img
                src={featured.image}
                alt={featured.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isAdmin && (
                <div className="absolute top-2 right-2 z-20" ref={featuredMenuRef}>
                  <button
                    onClick={() => setFeaturedMenuOpen((o) => !o)}
                    className="flex items-center justify-center w-7 h-7 rounded"
                    style={{
                      backgroundColor: "oklch(0.12 0.005 285 / 0.70)",
                      color: "oklch(0.85 0.01 85)",
                      backdropFilter: "blur(4px)",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.95)"; }}
                    onMouseLeave={(e) => { if (!featuredMenuOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.70)"; }}
                  >
                    <MoreVertical size={14} />
                  </button>
                  {featuredMenuOpen && (
                    <div
                      className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: "oklch(0.17 0.005 285)",
                        border: "1px solid oklch(1 0 0 / 15%)",
                        minWidth: "160px",
                        boxShadow: "0 8px 24px oklch(0 0 0 / 0.35)",
                        animation: "filterIn 0.12s cubic-bezier(0.23, 1, 0.32, 1) forwards",
                        zIndex: 30,
                      }}
                    >
                      <button
                        onClick={openFeaturedEdit}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-100"
                        style={{ color: "oklch(0.85 0.01 85)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 285)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      >
                        <Pencil size={13} style={{ color: "var(--brand-orange)" }} />
                        Editar presentación
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specs */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <p
                className="text-xs font-bold tracking-[0.22em] uppercase mb-6"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                Especificaciones
              </p>

              <div className="space-y-4">
                {featured.specs.filter((s) => s.label !== "Código").map((spec, i) => (
                  <div key={i} className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--section-heading)" }}
                    >
                      {spec.label}
                    </span>
                    <span style={{ color: "var(--section-body)" }}>: {spec.value}</span>
                  </div>
                ))}
              </div>

              {featured.features.length > 0 && (
                <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--section-border)" }}>
                  <p
                    className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
                    style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                  >
                    Características
                  </p>
                  <ul className="space-y-2">
                    {featured.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                      >
                        <span style={{ color: "var(--brand-orange)", marginTop: "2px" }}>·</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8">
                <span
                  className="inline-block text-xs px-2.5 py-1 rounded font-medium"
                  style={{
                    backgroundColor: "oklch(0.12 0.005 285 / 0.7)",
                    color: "var(--brand-orange)",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid rgba(245,124,0,0.3)",
                  }}
                >
                  {featured.code}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Variants grid */}
        {featured && (isRoscaBiz ? (roscaItems.length > 0 || bizItems.length > 0) : (featured.variants && featured.variants.length > 0)) && (
          <div className="mb-16">
            {isRoscaBiz ? (
              <>
                {roscaItems.length > 0 && (
                  <div className={bizItems.length > 0 ? "mb-12" : ""}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
                      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                        Moldes para Rosca
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(245,124,0,0.08)", color: "var(--brand-orange)", border: "1px solid rgba(245,124,0,0.2)", fontFamily: "var(--font-mono)" }}>
                        Con cono central
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                      {roscaItems.map(({ v, i, fallbackImage, product }) => (
                        <VariantCard key={`ros-${i}`} variant={v} fallbackImage={fallbackImage} isAdmin={isAdmin} onEdit={() => openEditVariant(i, v, product)} onDelete={() => handleDeleteVariant(i, product)} />
                      ))}
                    </div>
                  </div>
                )}
                {roscaItems.length > 0 && bizItems.length > 0 && (
                  <div className="h-px mb-12" style={{ backgroundColor: "var(--section-border)" }} />
                )}
                {bizItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
                      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                        Moldes para Bizcochuelo
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(245,124,0,0.08)", color: "var(--brand-orange)", border: "1px solid rgba(245,124,0,0.2)", fontFamily: "var(--font-mono)" }}>
                        Fondo plano
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                      {bizItems.map(({ v, i, fallbackImage, product }) => (
                        <VariantCard key={`biz-${i}`} variant={v} fallbackImage={fallbackImage} isAdmin={isAdmin} onEdit={() => openEditVariant(i, v, product)} onDelete={() => handleDeleteVariant(i, product)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {DIMENSION_BASED_CATEGORIES.has(categoryName)
                    ? "Todos los moldes (base × altura)"
                    : "Todos los moldes (por peso)"}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                  {(featured.variants ?? []).map((v, i) => (
                    <VariantCard key={i} variant={v as VariantItem} fallbackImage={featured.image} isAdmin={isAdmin} onEdit={() => openEditVariant(i, v)} onDelete={() => handleDeleteVariant(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Controls: search + filter + add */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-2.5 flex-1" style={{ minWidth: "200px", maxWidth: "360px", border: "1px solid var(--section-border)", borderRadius: "9999px", backgroundColor: "var(--section-card)" }}
            onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--brand-orange)"; }}
            onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--section-border)"; }}
          >
            <Search size={14} style={{ color: "var(--section-muted)", flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}><X size={13} /></button>}
          </div>

          {/* Filter */}
          {(() => {
            const activeFilters = (!showActive ? 1 : 0) + (isRoscaBiz && subFilter !== "all" ? 1 : 0);
            return (
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen((o) => !o)} className="flex items-center gap-2 px-4 py-2.5"
                style={{ border: `1px solid ${activeFilters > 0 ? "var(--brand-orange)" : "var(--section-border)"}`, borderRadius: "9999px", backgroundColor: activeFilters > 0 ? "rgba(245,124,0,0.08)" : "var(--section-card)", color: activeFilters > 0 ? "var(--brand-orange)" : "var(--section-body)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}
              >
                <SlidersHorizontal size={14} /> Filtros {activeFilters > 0 && <span className="flex items-center justify-center w-4 h-4 rounded-full font-bold" style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontSize: "10px" }}>{activeFilters}</span>}
              </button>
              {filterOpen && (
                <div className="absolute top-full mt-2 left-0 rounded-lg overflow-hidden z-50" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "200px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.2)" }}>
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--section-border)" }}>
                    <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>Estado</span>
                  </div>
                  <button onClick={() => { setShowActive(true); setFilterOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    style={{ backgroundColor: showActive ? "rgba(245,124,0,0.07)" : "transparent", color: showActive ? "var(--brand-orange)" : "var(--section-body)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                  >
                    Solo activos {showActive && <Check size={13} style={{ color: "var(--brand-orange)" }} />}
                  </button>
                  <button onClick={() => { setShowActive(false); setFilterOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    style={{ backgroundColor: !showActive ? "rgba(245,124,0,0.07)" : "transparent", color: !showActive ? "var(--brand-orange)" : "var(--section-body)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                  >
                    Todos {!showActive && <Check size={13} style={{ color: "var(--brand-orange)" }} />}
                  </button>
                  {isRoscaBiz && (
                    <>
                      <div className="px-4 py-2.5 border-t border-b" style={{ borderColor: "var(--section-border)" }}>
                        <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>Tipo</span>
                      </div>
                      {(["all", "Rosca", "Bizcochuelo"] as const).map((type) => (
                        <button key={type} onClick={() => { setSubFilter(type); setFilterOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                          style={{ backgroundColor: subFilter === type ? "rgba(245,124,0,0.07)" : "transparent", color: subFilter === type ? "var(--brand-orange)" : "var(--section-body)", fontFamily: "var(--font-body)", fontSize: "13px" }}
                        >
                          {type === "all" ? "Todos" : type} {subFilter === type && <Check size={13} style={{ color: "var(--brand-orange)" }} />}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {/* Add product — admin only */}
          {isAdmin && (
            <button onClick={() => {
              const d = FORM_DEFAULTS_BY_CATEGORY[categoryName];
              setForm({ ...EMPTY_FORM, ...(d ? { name: d.name, shortDesc: d.shortDesc, fullDesc: d.fullDesc, specs: d.specs, features: d.features } : {}) });
              setFormError(null);
              setAddOpen(true);
            }} className="flex items-center gap-2 px-4 py-2.5 ml-auto"
              style={{ border: "1px solid var(--brand-orange)", borderRadius: "9999px", backgroundColor: "rgba(245,124,0,0.08)", color: "var(--brand-orange)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
            >
              <Plus size={14} /> Agregar producto
            </button>
          )}
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div
            className="py-24 text-center rounded-xl"
            style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              {products.length === 0
                ? "No hay productos en esta categoría todavía."
                : "No hay productos que coincidan con los filtros aplicados."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8" style={{ backgroundColor: "var(--section-border)" }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-xl overflow-hidden cursor-pointer"
                  style={{
                    backgroundColor: "var(--section-card)",
                    border: "1px solid var(--section-border)",
                    boxShadow: "var(--card-shadow)",
                    transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.25s cubic-bezier(0.23,1,0.32,1), border-color 0.25s ease",
                  }}
                  onClick={() => navigate(`/producto/${product.id}`)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow-hover)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,124,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--section-border)";
                  }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{
                        backgroundColor: "oklch(0.12 0.005 285 / 0.82)",
                        color: "var(--brand-orange)",
                        fontFamily: "var(--font-mono)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {product.code}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h2
                      className="text-sm font-bold mb-1 leading-snug"
                      style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                    >
                      {product.name}
                    </h2>
                    <p
                      className="text-xs leading-relaxed mb-3 line-clamp-2"
                      style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                    >
                      {product.shortDesc}
                    </p>

                    <div
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "var(--brand-orange)", fontFamily: "var(--font-body)" }}
                    >
                      Ver más
                      <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </>}
      </main>

      <Footer />

      {/* Featured card edit modal */}
      {featuredEditOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeaturedEditOpen(false); }}
        >
          <div
            className="relative w-full max-w-3xl rounded-lg flex flex-col"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              animation: "modalIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards",
              height: "min(680px, 92vh)",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--section-border)" }}>
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase mb-0.5" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Card de presentación</p>
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>Editar presentación</h2>
              </div>
              <button onClick={() => setFeaturedEditOpen(false)}
                className="p-2 rounded transition-colors duration-150" style={{ color: "var(--section-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                <X size={20} />
              </button>
            </div>

            {featuredFormError && (
              <div className="mx-6 mt-3 px-4 py-2 rounded-lg text-sm flex items-center gap-2 flex-shrink-0"
                style={{ backgroundColor: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#f87171", fontFamily: "var(--font-body)" }}>
                <X size={14} style={{ flexShrink: 0 }} /> {featuredFormError}
              </div>
            )}

            <form onSubmit={handleSaveFeatured} className="flex flex-col flex-1 min-h-0">
              {/* Body — 2 columns */}
              <div className="flex-1 grid grid-cols-2 min-h-0" style={{ borderBottom: "1px solid var(--section-border)" }}>

                {/* Left: imagen + nombre + descripción */}
                <div className="p-5 flex flex-col gap-4 border-r" style={{ borderColor: "var(--section-border)" }}>
                  {/* Imagen */}
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Imagen</p>
                    <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      Recomendado: <strong style={{ color: "var(--section-body)" }}>800 × 450 px</strong> (16:9)
                    </p>
                    <div className="rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "16/9", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                      {featuredForm.image ? (
                        <img src={featuredForm.image} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--section-muted)" }}><Package size={24} /></div>
                      )}
                    </div>
                    <button type="button" onClick={() => featuredFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 mb-2"
                      style={{ border: "1px dashed var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.06)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.12)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.06)"; }}>
                      Seleccionar archivo
                    </button>
                    <input ref={featuredFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      compressImage(file).then((data) => setFeaturedForm((p) => ({ ...p, image: data })));
                    }} />
                    <input value={featuredForm.image.startsWith("data:") ? "" : featuredForm.image}
                      onChange={(e) => setFeaturedForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="o pegar URL..."
                      style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 12px", fontSize: "12px", width: "100%", outline: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                  </div>

                  {/* Nombre */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 500, marginBottom: "4px", color: "var(--section-muted)", fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>Nombre *</label>
                    <input required value={featuredForm.name} onChange={(e) => setFeaturedForm((p) => ({ ...p, name: e.target.value }))}
                      style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 12px", fontSize: "13px", width: "100%", outline: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                  </div>

                  {/* Descripción corta */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 500, marginBottom: "4px", color: "var(--section-muted)", fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>Descripción corta *</label>
                    <textarea required rows={3} value={featuredForm.shortDesc} onChange={(e) => setFeaturedForm((p) => ({ ...p, shortDesc: e.target.value }))}
                      style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 12px", fontSize: "13px", width: "100%", outline: "none", resize: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                </div>

                {/* Right: especificaciones + características */}
                <div className="p-5 flex flex-col gap-4 min-h-0">

                  {/* Especificaciones */}
                  <div className="flex flex-col min-h-0" style={{ flex: "1 1 0" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Especificaciones</p>
                      <button type="button" onClick={() => setFeaturedForm((p) => ({ ...p, specs: [...p.specs, { label: "", value: "" }] }))}
                        className="flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-1.5 overflow-y-auto pr-1" style={{ flex: 1 }}>
                      {featuredForm.specs.map((spec, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <input value={spec.label} onChange={(e) => setFeaturedForm((p) => { const specs = [...p.specs]; specs[i] = { ...specs[i], label: e.target.value }; return { ...p, specs }; })}
                            placeholder="Propiedad"
                            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", flex: 1, outline: "none", minWidth: 0 }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          <input value={spec.value} onChange={(e) => setFeaturedForm((p) => { const specs = [...p.specs]; specs[i] = { ...specs[i], value: e.target.value }; return { ...p, specs }; })}
                            placeholder="Valor"
                            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", flex: 1, outline: "none", minWidth: 0 }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          {featuredForm.specs.length > 1 && (
                            <button type="button" onClick={() => setFeaturedForm((p) => ({ ...p, specs: p.specs.filter((_, idx) => idx !== i) }))}
                              style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Características */}
                  <div className="flex flex-col min-h-0" style={{ flex: "1 1 0" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Características</p>
                      <button type="button" onClick={() => setFeaturedForm((p) => ({ ...p, features: [...p.features, ""] }))}
                        className="flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-1.5 overflow-y-auto pr-1" style={{ flex: 1 }}>
                      {featuredForm.features.map((feat, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <input value={feat} onChange={(e) => setFeaturedForm((p) => { const features = [...p.features]; features[i] = e.target.value; return { ...p, features }; })}
                            placeholder="Característica..."
                            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", flex: 1, outline: "none" }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          {featuredForm.features.length > 1 && (
                            <button type="button" onClick={() => setFeaturedForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                              style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--section-border)" }}>
                <button type="button" onClick={() => setFeaturedEditOpen(false)}
                  className="px-5 py-2.5 text-sm rounded transition-colors duration-150"
                  style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", border: "1px solid var(--section-border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold rounded flex items-center gap-2 transition-all duration-200 active:scale-95"
                  style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add product modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div
            className="relative w-full max-w-3xl rounded-lg"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              animation: "modalIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--section-border)" }}>
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase mb-0.5" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Catálogo</p>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>Agregar producto</h2>
              </div>
              <button onClick={closeForm}
                className="p-2 rounded transition-colors duration-150" style={{ color: "var(--section-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                <X size={20} />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mx-6 mt-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                style={{ backgroundColor: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#f87171", fontFamily: "var(--font-body)" }}>
                <X size={14} style={{ flexShrink: 0 }} /> {formError}
              </div>
            )}

            {/* Body */}
            <form onSubmit={handleAddProduct}>
              <div className="grid md:grid-cols-2 gap-0">

                {/* Left column */}
                <div className="p-5 space-y-3" style={{ borderRight: "1px solid var(--section-border)" }}>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Información general</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={addLabelStyle}>Código *</label>
                      <input required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                        placeholder={(FORM_DEFAULTS_BY_SUBCATEGORY[form.subcategory] ?? FORM_DEFAULTS_BY_CATEGORY[categoryName])?.codePlaceholder ?? "HC-XXX-000"}
                        style={addInputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                    </div>
                    <div>
                      <label style={addLabelStyle}>Categoría</label>
                      <input value={categoryName} disabled style={{ ...addInputStyle, opacity: 0.6, cursor: "not-allowed" }} />
                    </div>
                  </div>
                  {isRoscaBiz && (
                    <div>
                      <label style={addLabelStyle}>Tipo *</label>
                      <select required value={form.subcategory} onChange={(e) => {
                        const sub = e.target.value;
                        const d = FORM_DEFAULTS_BY_SUBCATEGORY[sub];
                        setForm((p) => ({
                          ...p, subcategory: sub, variants: [],
                          ...(d ? { name: d.name, shortDesc: d.shortDesc, fullDesc: d.fullDesc, specs: d.specs, features: d.features } : {}),
                        }));
                      }} style={{ ...addInputStyle, cursor: "pointer" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}>
                        <option value="">— Seleccionar tipo —</option>
                        <option value="Rosca">Rosca</option>
                        <option value="Bizcochuelo">Bizcochuelo</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={addLabelStyle}>Nombre *</label>
                    <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del producto" style={addInputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <div>
                    <label style={addLabelStyle}>Imagen</label>
                    <div className="flex gap-3 items-start mb-2">
                      <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 72, height: 54, backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                        {form.image ? (
                          <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--section-muted)" }}><Package size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                          style={{ border: "1px dashed var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.06)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.12)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.06)"; }}>
                          Seleccionar archivo
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          compressImage(file).then((data) => setForm((p) => ({ ...p, image: data })));
                        }} />
                        <input value={form.image.startsWith("data:") ? "" : form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="o pegar URL..."
                          style={{ ...addInputStyle, fontSize: "12px" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={addLabelStyle}>Descripción corta *</label>
                    <textarea required rows={2} value={form.shortDesc} onChange={(e) => setForm((p) => ({ ...p, shortDesc: e.target.value }))} placeholder="Breve descripción visible en la card..." style={{ ...addInputStyle, resize: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <div>
                    <label style={addLabelStyle}>Descripción completa</label>
                    <textarea rows={3} value={form.fullDesc} onChange={(e) => setForm((p) => ({ ...p, fullDesc: e.target.value }))} placeholder="Descripción detallada del producto..." style={{ ...addInputStyle, resize: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  </div>
                </div>

                {/* Right column */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Specs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Especificaciones</p>
                      <button type="button" onClick={addSpec} className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.specs.map((spec, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={spec.label} onChange={(e) => setSpec(i, "label", e.target.value)} placeholder="Propiedad" style={{ ...addInputStyle, flex: 1 }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          <input value={spec.value} onChange={(e) => setSpec(i, "value", e.target.value)} placeholder="Valor" style={{ ...addInputStyle, flex: 1 }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          {form.specs.length > 1 && (
                            <button type="button" onClick={() => removeSpec(i)} style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Características</p>
                      <button type="button" onClick={addFeature} className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.features.map((feat, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={feat} onChange={(e) => setFeature(i, e.target.value)} placeholder={`Característica ${i + 1}`} style={{ ...addInputStyle, flex: 1 }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          {form.features.length > 1 && (
                            <button type="button" onClick={() => removeFeature(i)} style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Variantes</p>
                      <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                        <Plus size={12} /> Agregar
                      </button>
                    </div>

                    <input type="file" accept="image/*" ref={variantFileInputRef} style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || variantUploadIdx === null) return;
                      compressImage(file).then((data) => setVariant(variantUploadIdx, "image", data));
                      e.target.value = "";
                    }} />

                    <div className="space-y-3">
                      {form.variants.map((v, i) => {
                        const presets = VARIANT_PRESETS_BY_CATEGORY[form.subcategory || categoryName] ?? [];
                        const isDimBased = DIMENSION_BASED_CATEGORIES.has(form.subcategory || categoryName);
                        const sizeLabel = isDimBased ? "Medida" : "Peso";
                        const sizePlaceholder = isDimBased ? "180x50" : "500gr";
                        return (
                        <div key={i} className="rounded-lg p-3 space-y-2.5" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                          {presets.length > 0 ? (
                            <>
                              <div>
                                <label className="block text-[10px] mb-1 font-medium uppercase tracking-wider" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>Modelo</label>
                                <select value={v.code} onChange={(e) => {
                                  const preset = presets.find(p => p.code === e.target.value);
                                  if (preset) {
                                    setForm(prev => { const variants = [...prev.variants]; variants[i] = { ...variants[i], weight: preset.weight, code: preset.code, dimensions: preset.dimensions }; return { ...prev, variants }; });
                                  } else {
                                    setVariant(i, "code", e.target.value);
                                  }
                                }} style={{ ...addInputStyle, width: "100%", cursor: "pointer" }}>
                                  <option value="">— Seleccionar modelo —</option>
                                  {presets.map(p => <option key={p.code} value={p.code}>{p.code} — {p.weight} — {p.dimensions}</option>)}
                                </select>
                              </div>
                              {v.code && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                                    <span className="block text-[9px] uppercase tracking-wider mb-0.5">{sizeLabel}</span>
                                    <span style={{ color: "var(--section-heading)" }}>{v.weight}</span>
                                  </div>
                                  <div className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                                    <span className="block text-[9px] uppercase tracking-wider mb-0.5">Dimensiones</span>
                                    <span style={{ color: "var(--section-heading)" }}>{v.dimensions}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {(["weight", "code", "dimensions"] as const).map((key) => (
                                <div key={key}>
                                  <label className="block text-[10px] mb-1 font-medium uppercase tracking-wider" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                                    {{ weight: sizeLabel, code: "Código", dimensions: "Dim." }[key]}
                                  </label>
                                  <input value={v[key]} onChange={(e) => setVariant(i, key, e.target.value)}
                                    placeholder={{ weight: sizePlaceholder, code: "HC-001", dimensions: "100x80mm" }[key]}
                                    style={addInputStyle}
                                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { setVariantUploadIdx(i); variantFileInputRef.current?.click(); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg flex-1 justify-center transition-colors"
                              style={{ border: "1px solid var(--section-border)", backgroundColor: "var(--section-card)", color: v.image ? "var(--brand-orange)" : "var(--section-muted)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; }}>
                              {v.image ? "✓ Foto cargada" : "📷 Subir foto"}
                            </button>
                            {v.image && <img src={v.image} alt="" className="w-8 h-8 object-cover rounded" />}
                            <button type="button" onClick={() => removeVariant(i)} style={{ color: "var(--section-muted)", flexShrink: 0, lineHeight: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        );
                      })}
                      {form.variants.length === 0 && (
                        <p className="text-xs py-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                          Sin variantes. Hacé clic en "Agregar" para añadir una.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>Visible en el catálogo</p>
                      <p className="text-[11px]" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {form.active ? "El producto se muestra en la página" : "El producto está oculto"}
                      </p>
                    </div>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                      style={{ width: 40, height: 22, backgroundColor: form.active ? "var(--brand-orange)" : "var(--section-border)" }}>
                      <span className="absolute top-1 rounded-full bg-white transition-transform duration-200"
                        style={{ width: 14, height: 14, left: 4, transform: form.active ? "translateX(18px)" : "translateX(0)" }} />
                    </button>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 justify-end mt-auto pt-2">
                    <button type="button" onClick={closeForm}
                      className="px-4 py-2.5 text-sm font-medium rounded border transition-all duration-150"
                      style={{ borderColor: "var(--section-border)", color: "var(--section-body)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}>
                      Cancelar
                    </button>
                    <button type="submit"
                      className="px-6 py-2.5 text-sm font-semibold rounded flex items-center gap-2 transition-all duration-200 active:scale-95"
                      style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}>
                      <Plus size={14} /> Guardar producto
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit variant modal */}
      {editVariantIdx !== null && featured && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditVariantIdx(null); }}
        >
          <div
            className="w-full max-w-sm rounded-lg"
            style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", animation: "modalIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--section-border)" }}>
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                Editar variante
              </h2>
              <button onClick={() => setEditVariantIdx(null)} style={{ color: "var(--section-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                <X size={18} />
              </button>
            </div>

            {variantError && (
              <div className="mx-5 mt-4 px-3 py-2 rounded text-sm flex items-center gap-2"
                style={{ backgroundColor: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#f87171", fontFamily: "var(--font-body)" }}>
                <X size={13} style={{ flexShrink: 0 }} /> {variantError}
              </div>
            )}

            <form onSubmit={handleSaveVariant} className="p-5 space-y-3">
              <div>
                <label style={addLabelStyle}>{DIMENSION_BASED_CATEGORIES.has(categoryName) ? "Medida" : "Peso"} *</label>
                <input required value={editVariantForm.weight}
                  onChange={(e) => setEditVariantForm((p) => ({ ...p, weight: e.target.value }))}
                  style={addInputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
              </div>
              <div>
                <label style={addLabelStyle}>Código *</label>
                <input required value={editVariantForm.code}
                  onChange={(e) => setEditVariantForm((p) => ({ ...p, code: e.target.value }))}
                  style={addInputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
              </div>
              <div>
                <label style={addLabelStyle}>Dimensiones *</label>
                <input required value={editVariantForm.dimensions}
                  onChange={(e) => setEditVariantForm((p) => ({ ...p, dimensions: e.target.value }))}
                  style={addInputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
              </div>
              <div>
                <label style={addLabelStyle}>Imagen de variante</label>
                <div className="flex gap-2 items-center">
                  {editVariantForm.image && (
                    <img src={editVariantForm.image} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                  )}
                  <button type="button" onClick={() => variantEditFileRef.current?.click()}
                    className="flex-1 py-2 rounded text-xs font-medium transition-colors duration-150"
                    style={{ border: "1px dashed var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.06)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.06)"; }}>
                    {editVariantForm.image ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                  {editVariantForm.image && (
                    <button type="button" onClick={() => setEditVariantForm((p) => ({ ...p, image: "" }))}
                      style={{ color: "var(--section-muted)", lineHeight: 0, flexShrink: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input ref={variantEditFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  compressImage(file).then((data) => setEditVariantForm((p) => ({ ...p, image: data })));
                  e.target.value = "";
                }} />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setEditVariantIdx(null)}
                  className="px-4 py-2.5 text-sm font-medium rounded border transition-all duration-150"
                  style={{ borderColor: "var(--section-border)", color: "var(--section-body)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 text-sm font-semibold rounded flex items-center gap-2 transition-all duration-200 active:scale-95"
                  style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}>
                  <Pencil size={13} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
