import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, ShoppingCart, CheckCircle, Loader2, ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";

interface OrderForm {
  product: string;
  productId: string;
  subcategoryChoice: string;
  variant: string;
  quantity: string;
  transport: string;
  redespacho: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  isCustom: boolean;
  customDescription: string;
}

const emptyForm: OrderForm = {
  product: "",
  productId: "",
  subcategoryChoice: "",
  variant: "",
  quantity: "1",
  transport: "",
  redespacho: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  notes: "",
  isCustom: false,
  customDescription: "",
};

const DIMENSION_BASED = new Set(["Pan de Pascua", "Bizcochuelo", "Rosca", "Rosca / Bizcochuelo"]);

interface ComprasSectionProps {
  initialProductId?: string;
}

export default function ComprasSection({ initialProductId }: ComprasSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initialProductId && products.length > 0) {
      const found = products.find((p) => p.id === initialProductId);
      if (found) setSelectedProduct(found);
    }
  }, [initialProductId, products]);

  useEffect(() => {
    if (selectedProduct) {
      document.documentElement.style.overflow = "hidden";
      setForm({
        ...emptyForm,
        product: selectedProduct.name,
        productId: selectedProduct.id,
        subcategoryChoice: selectedProduct.subcategory ?? "",
      });
      setReferenceImage(null);
      setImagePreview(null);
    } else {
      document.documentElement.style.overflow = "";
      setSubmitted(false);
    }
    return () => { document.documentElement.style.overflow = ""; };
  }, [selectedProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReferenceImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setReferenceImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          product: form.product,
          productId: form.productId,
          variant: form.variant,
          quantity: form.quantity,
          transport: form.transport,
          notes: [
            form.notes,
            form.redespacho ? `Redespacho: ${form.redespacho}` : "",
            form.isCustom ? form.customDescription : "",
          ].filter(Boolean).join(" | "),
          userId: user?.id ?? null,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar el pedido");
      setSubmitted(true);
    } catch {
      // leave submitted=false so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--section-card-inner)",
    border: "1px solid var(--section-border)",
    color: "var(--section-heading)",
    fontFamily: "var(--font-body)",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    marginBottom: "6px",
    color: "var(--section-muted)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.03em",
  };

  const variants = selectedProduct?.variants ?? [];
  const isDimBased = selectedProduct ? DIMENSION_BASED.has(selectedProduct.category) : false;
  const variantLabel = isDimBased ? "Medida" : "Peso / Formato";
  const variantPlaceholder = isDimBased ? "Seleccioná una medida" : "Seleccioná un formato";

  const isRoscaBiz = selectedProduct?.category === "Rosca / Bizcochuelo";
  const roscaVariants = isRoscaBiz ? variants.filter((v) => v.code.startsWith("ROS")) : [];
  const bizVariants = isRoscaBiz ? variants.filter((v) => v.code.startsWith("BIZ")) : [];

  const filteredVariants = isRoscaBiz
    ? form.subcategoryChoice === "Rosca"
      ? roscaVariants
      : form.subcategoryChoice === "Bizcochuelo"
      ? bizVariants
      : []
    : variants;

  return (
    <>
      <section
        id="compras"
        ref={sectionRef}
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: "var(--section-bg-alt)" }}
      >
        <span className="section-number">03</span>

        <div className="container">
          <div className={`mb-16 reveal ${visible ? "visible" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span
                className="text-xs font-medium tracking-[0.25em] uppercase"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                {t("purchases.eyebrow")}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
            >
              {t("purchases.title")}
            </h2>
            <p
              className="text-lg max-w-xl"
              style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
            >
              {t("purchases.subtitle")}
            </p>
          </div>

          {/* Product cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-orange)" }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className={`rounded-lg overflow-hidden reveal ${visible ? "visible" : ""}`}
                  style={{
                    backgroundColor: "var(--section-card)",
                    border: "1px solid var(--section-border)",
                    boxShadow: "var(--card-shadow)",
                    transitionDelay: `${i * 80}ms`,
                    transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
                  }}
                >
                  <div className="overflow-hidden" style={{ height: "180px" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <div className="text-xs mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                      {product.code}
                    </div>
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                    >
                      {product.category}
                      {product.subcategory ? ` · ${product.subcategory}` : ""}
                    </p>
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                    >
                      {product.name}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                    >
                      {product.shortDesc}
                    </p>

                    {product.variants && product.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {product.variants.slice(0, 4).map((v) => (
                          <span
                            key={v.code}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "rgba(245,124,0,0.08)",
                              color: "var(--brand-orange)",
                              fontFamily: "var(--font-mono)",
                              border: "1px solid rgba(245,124,0,0.2)",
                            }}
                          >
                            {DIMENSION_BASED.has(product.category) ? v.dimensions : v.weight}
                          </span>
                        ))}
                        {product.variants.length > 4 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--section-card-inner)",
                              color: "var(--section-muted)",
                              fontFamily: "var(--font-mono)",
                              border: "1px solid var(--section-border)",
                            }}
                          >
                            +{product.variants.length - 4} más
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full py-3 text-sm font-semibold rounded flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
                      style={{
                        backgroundColor: "var(--brand-orange)",
                        color: "oklch(0.12 0.005 285)",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                    >
                      <ShoppingCart size={15} />
                      {t("purchases.buy")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Order Form Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div
            className="relative w-full max-w-3xl rounded-lg overflow-y-auto"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              animation: "modalIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards",
              maxHeight: "90vh",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{ borderColor: "var(--section-border)", backgroundColor: "var(--section-card)" }}
            >
              <div>
                <p
                  className="text-xs font-medium tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                >
                  {t("purchases.form_eyebrow")}
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                >
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded transition-colors duration-150"
                style={{ color: "var(--section-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              {submitted ? (
                <div className="text-center py-10">
                  <CheckCircle size={52} className="mx-auto mb-4" style={{ color: "var(--brand-orange)" }} />
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                    {t("purchases.success_title")}
                  </h3>
                  <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {t("purchases.success_msg")}
                  </p>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-6 py-3 text-sm font-semibold rounded transition-all duration-200 active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}
                  >
                    {t("purchases.success_close")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Product info strip */}
                  <div className="flex items-center gap-3 p-3 rounded mb-4" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                        {selectedProduct.code}
                        {selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ""}
                      </div>
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                        {selectedProduct.name}
                      </div>
                    </div>
                    <div className="text-xs text-right flex-shrink-0" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      {selectedProduct.category}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-0">
                    {/* Left: contact info */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                        {t("purchases.contact_section")}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label style={labelStyle}>{t("purchases.name")} *</label>
                          <input type="text" name="name" required value={form.name} onChange={handleChange} style={inputStyle}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                        </div>
                        <div>
                          <label style={labelStyle}>{t("purchases.company")}</label>
                          <input type="text" name="company" value={form.company} onChange={handleChange} style={inputStyle}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                        </div>
                        <div>
                          <label style={labelStyle}>{t("purchases.email")} *</label>
                          <input type="email" name="email" required value={form.email} onChange={handleChange} style={inputStyle}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                        </div>
                        <div>
                          <label style={labelStyle}>{t("purchases.phone")}</label>
                          <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>{t("purchases.notes")}</label>
                        <textarea name="notes" rows={3} placeholder={t("purchases.notes_placeholder")} value={form.notes} onChange={handleChange}
                          style={{ ...inputStyle, resize: "none" }}
                          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--section-border)"; }} />
                      </div>
                    </div>

                    {/* Right: order details */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                        {t("purchases.order_section")}
                      </p>

                      {/* Tipo selector — solo para Rosca / Bizcochuelo */}
                      {isRoscaBiz && (
                        <div>
                          <label style={labelStyle}>Tipo *</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["Rosca", "Bizcochuelo"] as const).map((tipo) => (
                              <button
                                key={tipo}
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, subcategoryChoice: tipo, variant: "" }))}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "6px",
                                  fontSize: "14px",
                                  fontFamily: "var(--font-body)",
                                  fontWeight: form.subcategoryChoice === tipo ? 600 : 400,
                                  border: `1px solid ${form.subcategoryChoice === tipo ? "var(--brand-orange)" : "var(--section-border)"}`,
                                  backgroundColor: form.subcategoryChoice === tipo ? "rgba(245,124,0,0.10)" : "var(--section-card-inner)",
                                  color: form.subcategoryChoice === tipo ? "var(--brand-orange)" : "var(--section-heading)",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                {tipo}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variant selector — adapted per product type */}
                      {filteredVariants.length > 0 && (
                        <div>
                          <label style={labelStyle}>{variantLabel} *</label>
                          <select name="variant" value={form.variant} onChange={handleChange} required
                            style={{ ...inputStyle, cursor: "pointer" }}
                            onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--section-border)"; }}>
                            <option value="">{variantPlaceholder}</option>
                            {filteredVariants.map((v) => (
                              <option key={v.code} value={v.code}>
                                {isDimBased ? v.dimensions : v.weight} — {v.code}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label style={labelStyle}>{t("purchases.quantity")} *</label>
                        <input type="number" name="quantity" min="1" required value={form.quantity} onChange={handleChange} style={inputStyle}
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                      </div>

                      <div>
                        <label style={labelStyle}>{t("purchases.transport")}</label>
                        <select name="transport" value={form.transport} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}
                          onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--section-border)"; }}>
                          <option value="">{t("purchases.transport_placeholder")}</option>
                          <option value="oca">OCA</option>
                          <option value="andreani">Andreani</option>
                          <option value="correo-argentino">Correo Argentino</option>
                          <option value="fadel">Fadel</option>
                          <option value="villalonga">Expreso Villalonga</option>
                          <option value="retiro">{t("purchases.transport_retiro")}</option>
                          <option value="otro">{t("purchases.transport_otro")}</option>
                        </select>
                      </div>

                      {form.transport && form.transport !== "retiro" && (
                        <div>
                          <label style={labelStyle}>{t("purchases.redespacho")} <span style={{ color: "var(--section-muted)", fontWeight: 400 }}>{t("purchases.redespacho_optional")}</span></label>
                          <input type="text" name="redespacho" placeholder={t("purchases.redespacho_placeholder")} value={form.redespacho} onChange={handleChange} style={inputStyle}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                        </div>
                      )}

                      {/* Custom order */}
                      <label className="flex items-start gap-3 cursor-pointer p-3 rounded"
                        style={{
                          backgroundColor: form.isCustom ? "rgba(245, 124, 0, 0.08)" : "var(--section-card-inner)",
                          border: `1px solid ${form.isCustom ? "rgba(245, 124, 0, 0.40)" : "var(--section-border)"}`,
                          transition: "background-color 0.15s, border-color 0.15s",
                        }}>
                        <input type="checkbox" name="isCustom" checked={form.isCustom} onChange={handleChange}
                          style={{ accentColor: "var(--brand-orange)", width: "15px", height: "15px", marginTop: "2px", flexShrink: 0, cursor: "pointer" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{t("purchases.custom_order")}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{t("purchases.custom_order_desc")}</p>
                        </div>
                      </label>

                      {form.isCustom && (
                        <div className="space-y-3">
                          <div>
                            <label style={labelStyle}>{t("purchases.custom_description")}</label>
                            <textarea name="customDescription" rows={2} placeholder={t("purchases.custom_description_placeholder")} value={form.customDescription} onChange={handleChange}
                              style={{ ...inputStyle, resize: "none" }}
                              onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                              onBlur={(e) => { e.target.style.borderColor = ""; }} />
                          </div>
                          <div>
                            <label style={labelStyle}>{t("purchases.reference_image")} <span style={{ color: "var(--section-muted)", fontWeight: 400 }}>{t("purchases.image_optional")}</span></label>
                            {referenceImage ? (
                              <div className="flex items-center gap-3 px-3 py-2.5 rounded" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid rgba(245, 124, 0, 0.40)" }}>
                                <CheckCircle size={16} style={{ color: "var(--brand-orange)", flexShrink: 0 }} />
                                <span className="text-sm truncate flex-1" style={{ color: "var(--section-body)", fontFamily: "var(--font-mono)" }}>
                                  {referenceImage.name}
                                </span>
                                <button type="button" onClick={removeImage} className="p-1 rounded flex-shrink-0"
                                  style={{ color: "var(--section-muted)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 rounded cursor-pointer transition-colors duration-150" style={{ border: "2px dashed var(--section-border)", backgroundColor: "var(--section-card-inner)", padding: "14px 16px" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--brand-orange)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = ""; }}>
                                <ImagePlus size={18} style={{ color: "var(--section-muted)" }} />
                                <span className="text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>{t("purchases.image_select")}</span>
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleImageChange} />
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submit */}
                      <div className="flex gap-3 justify-end pt-1">
                        <button type="button" onClick={() => setSelectedProduct(null)}
                          className="px-4 py-2.5 text-sm font-medium rounded border transition-all duration-150"
                          style={{ borderColor: "var(--section-border)", color: "var(--section-body)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}>
                          {t("purchases.cancel")}
                        </button>
                        <button type="submit" disabled={submitting}
                          className="px-6 py-2.5 text-sm font-semibold rounded flex items-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
                          style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}>
                          {submitting ? (<><Loader2 size={14} className="animate-spin" />{t("purchases.submitting")}</>) : (<><ShoppingCart size={14} />{t("purchases.submit")}</>)}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
