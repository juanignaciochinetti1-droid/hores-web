/**
 * ProductosSection — Product cards with detail modals
 * Design: Craft Manufacturing — cream background, dark cards with orange accents
 * Cards: vertical 3:4 ratio, hover lift with orange shadow
 * Modal: full product detail with specs table
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { X, ChevronRight, Package, Search, Plus, Trash2, MoreVertical, Pencil } from "lucide-react";
import { type Product } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCardProps {
  product: Product;
  onOpen: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  delay: number;
  visible: boolean;
  isAdmin: boolean;
}

function ProductCard({ product, onOpen, onEdit, onDelete, delay, visible, isAdmin }: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
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
      className={`relative rounded-2xl overflow-hidden cursor-pointer reveal ${visible ? "visible" : ""}`}
      style={{
        aspectRatio: "3/5",
        transitionDelay: `${delay}ms`,
        border: `1px solid ${hovered ? "rgba(245,124,0,0.5)" : "var(--section-border)"}`,
        boxShadow: hovered ? "var(--card-shadow-hover)" : "var(--card-shadow)",
        transition: "border-color 0.35s ease, box-shadow 0.35s ease, opacity 2s cubic-bezier(0.16,1,0.3,1), transform 2s cubic-bezier(0.16,1,0.3,1), filter 1.6s cubic-bezier(0.16,1,0.3,1)",
      }}
      onClick={() => onOpen(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 1800)}
    >
      {/* Imagen */}
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: hovered ? "scale(1.09)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />

      {/* Gradiente permanente abajo — siempre visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(10,4,1,0.82) 0%, rgba(10,4,1,0.35) 38%, transparent 65%)",
        }}
      />

      {/* Nombre de categoría — siempre visible abajo */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-6 z-10"
        style={{
          opacity: hovered ? 0 : 1,
          transform: hovered ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <h3
          className="text-base font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "#FFFFFF" }}
        >
          {product.category}
        </h3>
      </div>

      {/* Menú tres puntos — top right, solo para admin */}
      {isAdmin && <div
        className="absolute top-2 right-2 z-20"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center justify-center w-7 h-7 rounded"
          style={{
            backgroundColor: "oklch(0.12 0.005 285 / 0.70)",
            color: "oklch(0.85 0.01 85)",
            backdropFilter: "blur(4px)",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.95)"; }}
          onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.12 0.005 285 / 0.70)"; }}
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <div
            className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden"
            style={{
              backgroundColor: "oklch(0.17 0.005 285)",
              border: "1px solid oklch(1 0 0 / 15%)",
              minWidth: "140px",
              boxShadow: "0 8px 24px oklch(0 0 0 / 0.35)",
              animation: "filterIn 0.12s cubic-bezier(0.23, 1, 0.32, 1) forwards",
              zIndex: 30,
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit(product); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-100"
              style={{ color: "oklch(0.85 0.01 85)", fontFamily: "var(--font-body)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 285)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              <Pencil size={13} style={{ color: "var(--brand-orange)" }} />
              Editar
            </button>
            <div style={{ height: "1px", backgroundColor: "oklch(1 0 0 / 8%)" }} />
            <button
              onClick={() => { setMenuOpen(false); onDelete(product.id); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-100"
              style={{ color: "oklch(0.70 0.15 20)", fontFamily: "var(--font-body)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 285)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              <Trash2 size={13} />
              Eliminar
            </button>
          </div>
        )}
      </div>}

      {/* Overlay hover — sube desde abajo */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 z-10"
        style={{
          background: "linear-gradient(to top, rgba(15,6,2,0.97) 0%, rgba(15,6,2,0.88) 100%)",
          backdropFilter: "blur(2px)",
          transform: hovered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <h3 className="text-sm font-bold mb-1.5 leading-snug" style={{ fontFamily: "var(--font-display)", color: "#FFFFFF" }}>
          {product.category}
        </h3>
        <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "oklch(0.72 0.01 85)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
          {product.shortDesc}
        </p>
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-body)" }}>
          Ver detalles
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

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

type FormDefaults = { name: string; shortDesc: string; fullDesc: string; codePlaceholder: string; specs: { label: string; value: string }[]; features: string[] };

const SPEC_DEFAULTS_BY_CATEGORY: Record<string, FormDefaults> = {
  "Pan Dulce": {
    name: "Molde Pan Dulce", shortDesc: "Molde de papel kraft para pan dulce tradicional, en múltiples tamaños.",
    fullDesc: "Molde de papel kraft para pan dulce tradicional. Lateral micro-perforado. Fondo liso o micro corrugado. Impresión en un color con diseño flor estándar. Personalizable según especificación del cliente.",
    codePlaceholder: "HC-PD-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado / monolúcido de 80 / 100 grs. micro-perforado" },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido, calandrado o virgen de 60 / 80 ó 100 grs. Liso o micro corrugado." },
      { label: "Impresión",                value: "En un color. Diseño flor estándar color blanco." },
      { label: "Personalización",          value: "Según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800 y 600 unidades" },
    ],
    features: [ "Papel kraft puro calandrado / monolúcido micro-perforado", "Fondo liso o micro corrugado", "Impresión en un color, diseño flor estándar", "Personalización según especificación del cliente", "Presentación en cajas de 600 a 1000 unidades" ],
  },
  "Pan de Pascua": {
    name: "Molde Pan de Pascua", shortDesc: "Molde de papel kraft para pan de pascua, con fondo reforzado.",
    fullDesc: "Molde de papel kraft para pan de pascua. Lateral calandrado o monolúcido. Impresión en uno o dos colores con motivo flor estándar o a pedido.",
    codePlaceholder: "HC-PP-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolúcido de 80 grs." },
      { label: "Fondo",                    value: "Papel kraft puro calandrado de 100 / 80 grs." },
      { label: "Impresión",                value: "En uno o dos colores según especificación del cliente" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1200, 1000, 800 y 600 unidades" },
    ],
    features: [ "Papel kraft puro calandrado", "Impresión en uno o dos colores", "Motivos estándar o a pedido del cliente", "Presentación en cajas de 600 a 1200 unidades" ],
  },
  "Budín": {
    name: "Molde Budín", shortDesc: "Molde de papel kraft supercalandrado para budín. Registro de diseño industrial nº 68.399.",
    fullDesc: "Molde de papel kraft puro supercalandrado para budín. Impresión en uno o dos colores. Registro de diseño industrial nº 68.399.",
    codePlaceholder: "HC-BU-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro supercalandrado de 150 / 190 grs." },
      { label: "Impresión",                value: "En uno o 2 colores" },
      { label: "Motivo",                   value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1500, 1000 y 600 unidades" },
      { label: "Registro",                 value: "Diseño industrial nº 68.399" },
    ],
    features: [ "Papel kraft puro supercalandrado de 150 / 190 grs.", "Impresión en uno o 2 colores", "Motivos estándar o a pedido del cliente", "Presentación en cajas de 600 a 1500 unidades", "Registro de diseño industrial nº 68.399" ],
  },
  "Rosca": {
    name: "Molde Rosca", shortDesc: "Molde de papel kraft para rosca, con cono central.",
    fullDesc: "Molde de papel kraft puro para rosca. Lateral calandrado o monolúcido, fondo monolúcido y cono supercalandrado. Impresión en dos colores.",
    codePlaceholder: "HC-ROS-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro calandrado o monolucido de 100 grs." },
      { label: "Fondo",                    value: "Papel kraft puro monolúcido de 100 grs." },
      { label: "Cono",                     value: "Papel kraft puro supercalandrado de 80 grs." },
      { label: "Impresión",                value: "En 2 (dos) colores" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 1000, 800, 600 y 100 unidades" },
    ],
    features: [ "Papel kraft puro calandrado o monolucido de 100 grs.", "Cono de papel kraft supercalandrado de 80 grs.", "Impresión en 2 colores", "Motivos estándar o a pedido del cliente", "Presentación en cajas de 100 a 1000 unidades" ],
  },
  "Bizcochuelo": {
    name: "Molde Bizcochuelo", shortDesc: "Molde de papel kraft supercalandrado para bizcochuelo.",
    fullDesc: "Molde de papel kraft puro supercalandrado para bizcochuelo. Lateral y fondo calandrado o monolúcido. Impresión en uno o dos colores.",
    codePlaceholder: "HC-BIZ-XXX",
    specs: [
      { label: "Lateral",                  value: "Papel kraft puro supercalandrado de 100 grs." },
      { label: "Fondo",                    value: "Papel kraft puro calandrado / monolúcido de 100 grs." },
      { label: "Impresión",                value: "En uno o dos colores" },
      { label: "Motivos",                  value: "Flor estándar o a pedido según especificación del cliente" },
      { label: "Presentación referencial", value: "Cajas por 800, 600 y 100 unidades" },
    ],
    features: [ "Papel kraft puro supercalandrado de 100 grs.", "Impresión en uno o dos colores", "Motivos estándar o a pedido del cliente", "Presentación en cajas de 100 a 800 unidades" ],
  },
};

const DIMENSION_BASED_CATEGORIES = new Set(["Pan de Pascua", "Bizcochuelo", "Rosca", "Rosca / Bizcochuelo"]);

const EMPTY_FORM = {
  code: "", name: "", category: "", subcategory: "", shortDesc: "", fullDesc: "", image: "",
  specs: [{ label: "", value: "" }],
  features: [""],
  variants: [] as { weight: string; code: string; dimensions: string; image: string }[],
  active: true,
};

export default function ProductosSection() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [visible, setVisible] = useState(false);
  const [variantUploadIdx, setVariantUploadIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = addOpen ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [addOpen]);

  const handleFormChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setSpec = (i: number, key: "label" | "value", val: string) =>
    setForm((prev) => {
      const specs = [...prev.specs];
      specs[i] = { ...specs[i], [key]: val };
      return { ...prev, specs };
    });

  const addSpec = () => setForm((prev) => ({ ...prev, specs: [...prev.specs, { label: "", value: "" }] }));
  const removeSpec = (i: number) => setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, idx) => idx !== i) }));

  const setFeature = (i: number, val: string) =>
    setForm((prev) => {
      const features = [...prev.features];
      features[i] = val;
      return { ...prev, features };
    });

  const addFeature = () => setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  const removeFeature = (i: number) => setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  const addVariant = () => setForm((prev) => ({ ...prev, variants: [...prev.variants, { weight: "", code: "", dimensions: "", image: "" }] }));
  const removeVariant = (i: number) => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  const setVariant = (i: number, key: "weight" | "code" | "dimensions" | "image", val: string) =>
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i], [key]: val };
      return { ...prev, variants };
    });

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      code: p.code,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory ?? "",
      shortDesc: p.shortDesc,
      fullDesc: p.fullDesc,
      image: p.image,
      specs: p.specs.length > 0 ? p.specs : [{ label: "", value: "" }],
      features: p.features.length > 0 ? p.features : [""],
      variants: (p.variants ?? []).map((v) => ({ ...v, image: v.image ?? "" })),
      active: (p as any).active !== false,
    });
    setAddOpen(true);
  };

  const closeForm = () => {
    setAddOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (err: any) {
      setDeleteError(err.message ?? "No se pudo eliminar el producto");
      setTimeout(() => setDeleteError(null), 4000);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleFormChange("image", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const data = {
      code: form.code,
      name: form.name,
      category: form.category,
      subcategory: form.subcategory || null,
      shortDesc: form.shortDesc,
      fullDesc: form.fullDesc,
      image: form.image,
      specs: form.specs.filter((s) => s.label.trim()),
      features: form.features.filter((f) => f.trim()),
      variants: form.variants.filter((v) => v.weight.trim() || v.code.trim()),
      active: form.active,
    };
    try {
      if (editingProduct) {
        await updateProduct({ ...editingProduct, ...data });
      } else {
        await addProduct({ id: `p-${crypto.randomUUID()}`, ...data });
      }
      closeForm();
    } catch (err: any) {
      setFormError(err.message ?? "Error al guardar el producto");
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
    <>
      <section
        id="productos"
        ref={sectionRef}
        className="py-24 relative"
        style={{ backgroundColor: "var(--section-bg)" }}
      >
        {/* Section number decoration */}
        <span className="section-number">02</span>

        <div className="container">
          {/* Section header */}
          <div className={`mb-16 reveal ${visible ? "visible" : ""}`} style={{ position: "relative", zIndex: 10 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span
                className="text-xs font-medium tracking-[0.25em] uppercase"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                Catálogo
              </span>
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                  style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                >
                  Nuestros Productos
                </h2>
                <p
                  className="text-lg max-w-xl"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  Cada molde es diseñado y fabricado a medida según las especificaciones
                  técnicas de su proyecto. Haga clic en cualquier producto para ver
                  las especificaciones completas.
                </p>
              </div>

            </div>
          </div>

          {/* Delete error banner */}
          {deleteError && (
            <div
              className="mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
              style={{
                backgroundColor: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.35)",
                color: "#f87171",
                fontFamily: "var(--font-body)",
              }}
            >
              <X size={14} style={{ flexShrink: 0 }} />
              {deleteError}
            </div>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
            {products.length > 0 ? (
              products.slice(0, 4).map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={(p) => navigate(`/categoria/${encodeURIComponent(p.category)}`)}
                  onEdit={openEdit}
                  onDelete={handleDeleteProduct}
                  delay={i * 80}
                  visible={visible}
                  isAdmin={isAdmin}
                />
              ))
            ) : (
              <div className="col-span-4 py-16 text-center" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                <p className="text-sm">No hay productos disponibles.</p>
              </div>
            )}
          </div>

          {/* Bottom note */}
          <div
            className={`mt-12 p-6 rounded-lg reveal ${visible ? "visible" : ""}`}
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border-subtle)",
              transitionDelay: "400ms",
            }}
          >
            <div className="flex items-start gap-4">
              <Package size={20} style={{ color: "var(--brand-orange)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
                >
                  ¿No encuentra lo que busca?
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  Fabricamos moldes completamente a medida. Contáctenos con las
                  especificaciones de su proyecto y le enviaremos un presupuesto sin compromiso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Product Modal */}
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
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {editingProduct ? "Editar producto" : "Agregar producto"}
                </h2>
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
              <div
                className="mx-6 mt-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.35)",
                  color: "#f87171",
                  fontFamily: "var(--font-body)",
                }}
              >
                <X size={14} style={{ flexShrink: 0 }} />
                {formError}
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
                      <input required value={form.code} onChange={(e) => handleFormChange("code", e.target.value)} placeholder="HC-TR-004" style={addInputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                    </div>
                    <div>
                      <label style={addLabelStyle}>Categoría *</label>
                      <input required value={form.category} onChange={(e) => {
                        const cat = e.target.value;
                        const d = SPEC_DEFAULTS_BY_CATEGORY[cat];
                        setForm((p) => ({
                          ...p, category: cat, subcategory: "", variants: [],
                          ...(d ? { name: d.name, shortDesc: d.shortDesc, fullDesc: d.fullDesc, specs: d.specs, features: d.features } : {}),
                        }));
                      }} placeholder="Pan Dulce, Budín, Pan de Pascua..." style={addInputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                    </div>
                  </div>
                  {form.category === "Rosca / Bizcochuelo" && (
                    <div>
                      <label style={addLabelStyle}>Tipo *</label>
                      <select required value={form.subcategory} onChange={(e) => {
                        const sub = e.target.value;
                        const d = SPEC_DEFAULTS_BY_CATEGORY[sub];
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
                    <input required value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Troquel Caja Estándar" style={addInputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <div>
                    <label style={addLabelStyle}>Imagen</label>
                    {/* Preview + file picker */}
                    <div className="flex gap-3 items-start mb-2">
                      <div
                        className="flex-shrink-0 rounded-lg overflow-hidden"
                        style={{ width: 72, height: 54, backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                      >
                        {form.image ? (
                          <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--section-muted)" }}>
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                          style={{
                            border: "1px dashed var(--brand-orange)",
                            color: "var(--brand-orange)",
                            backgroundColor: "rgba(245,124,0,0.06)",
                            fontFamily: "var(--font-body)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.12)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.06)"; }}
                        >
                          Seleccionar archivo
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageFile}
                        />
                        <input
                          value={form.image.startsWith("data:") ? "" : form.image}
                          onChange={(e) => handleFormChange("image", e.target.value)}
                          placeholder="o pegar URL..."
                          style={{ ...addInputStyle, fontSize: "12px" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={addLabelStyle}>Descripción corta *</label>
                    <textarea required rows={2} value={form.shortDesc} onChange={(e) => handleFormChange("shortDesc", e.target.value)} placeholder="Breve descripción visible en la card..." style={{ ...addInputStyle, resize: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <div>
                    <label style={addLabelStyle}>Descripción completa</label>
                    <textarea rows={3} value={form.fullDesc} onChange={(e) => handleFormChange("fullDesc", e.target.value)} placeholder="Descripción detallada del producto..." style={{ ...addInputStyle, resize: "none" }}
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

                    {/* Hidden file input for variant photos */}
                    <input type="file" accept="image/*" ref={variantFileInputRef} style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || variantUploadIdx === null) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => { setVariant(variantUploadIdx, "image", ev.target?.result as string); };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }} />

                    <div className="space-y-3">
                      {form.variants.map((v, i) => {
                        const presets = VARIANT_PRESETS_BY_CATEGORY[form.subcategory || form.category] ?? [];
                        const isDimBased = DIMENSION_BASED_CATEGORIES.has(form.subcategory || form.category);
                        const sizeLabel = isDimBased ? "Medida" : "Peso";
                        const sizePlaceholder = isDimBased ? "180x50" : "500gr";
                        return (
                        <div key={i} className="rounded-lg p-3 space-y-2.5" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                          {presets.length > 0 ? (
                            <>
                              {/* Modelo dropdown (code as unique key) */}
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
                              {/* Auto-filled details */}
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
                            /* Manual text inputs when no presets exist for this category */
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
                          {/* Foto + eliminar */}
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
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                        Visible en el catálogo
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {form.active ? "El producto se muestra en la página" : "El producto está oculto"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                      style={{
                        width: 40, height: 22,
                        backgroundColor: form.active ? "var(--brand-orange)" : "var(--section-border)",
                      }}
                    >
                      <span
                        className="absolute top-1 rounded-full bg-white transition-transform duration-200"
                        style={{
                          width: 14, height: 14,
                          left: 4,
                          transform: form.active ? "translateX(18px)" : "translateX(0)",
                        }}
                      />
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
                      {editingProduct ? <Pencil size={14} /> : <Plus size={14} />}
                      {editingProduct ? "Guardar cambios" : "Guardar producto"}
                    </button>
                  </div>
                </div>
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
        @keyframes filterIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
