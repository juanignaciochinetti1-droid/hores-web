import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Package,
  ArrowLeft,
  Sun,
  Moon,
  Ruler,
  Zap,
  CheckCircle,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useProducts } from "@/hooks/useProducts";

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { products, loading } = useProducts();

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--section-bg)" }}>
        <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Cargando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--section-bg)" }}>
        <Package size={40} style={{ color: "var(--section-muted)" }} />
        <p className="text-lg font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
          Producto no encontrado
        </p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--brand-orange)", fontFamily: "var(--font-body)" }}
        >
          <ArrowLeft size={15} /> Volver al catálogo
        </button>
      </div>
    );
  }

  const handleComprar = () => {
    navigate(`/compras?producto=${product.id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "var(--navbar-solid-bg)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--section-border)",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm transition-colors duration-150"
                style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
              >
                <ArrowLeft size={16} />
                Catálogo
              </button>
              <div className="w-px h-5" style={{ backgroundColor: "var(--section-border)" }} />
              <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                <span
                  className="cursor-pointer transition-colors duration-150"
                  onClick={() => navigate("/")}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "var(--brand-orange)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "var(--section-muted)"; }}
                >
                  Productos
                </span>
                <ChevronRight size={12} />
                <span style={{ color: "var(--section-heading)" }}>{product.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded"
                style={{
                  color: "var(--brand-orange)",
                  backgroundColor: "rgba(245, 124, 0, 0.10)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {product.code}
              </span>
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded transition-colors duration-150"
                  style={{ color: "var(--section-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                >
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero: imagen + título ───────────────────────────── */}
      <section className="relative overflow-hidden" style={{ maxHeight: "480px", minHeight: "320px" }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ height: "420px" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, oklch(0.08 0.005 285 / 0.92) 0%, oklch(0.08 0.005 285 / 0.4) 50%, transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 container pb-8">
          <p
            className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
            style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
          >
            {product.category}
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "oklch(0.97 0.01 85)" }}
          >
            {product.name}
          </h1>
        </div>
      </section>

      {/* ── Contenido principal ─────────────────────────────── */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Columna principal (2/3) ─────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Descripción */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
                <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                  Descripción
                </span>
              </div>
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
              >
                {product.fullDesc}
              </p>
            </div>

            {/* Especificaciones */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
                <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                  Especificaciones técnicas
                </span>
              </div>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--section-border)" }}
              >
                {product.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-3"
                    style={{
                      backgroundColor: i % 2 === 0 ? "var(--section-card)" : "var(--section-card-inner, var(--section-bg))",
                      borderBottom: i < product.specs.length - 1 ? "1px solid var(--section-border)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Ruler size={13} style={{ color: "var(--brand-orange)", flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>
                        {spec.label}
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium tabular-nums"
                      style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                    >
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Características */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
                <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                  Características
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {product.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg px-4 py-3"
                    style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
                  >
                    <Zap size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--brand-orange)" }} />
                    <span className="text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Sidebar (1/3) ───────────────────────────────── */}
          <div className="space-y-5">

            {/* Card de acción */}
            <div
              className="rounded-lg p-6 sticky top-24"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
            >
              <p
                className="text-xs font-medium tracking-[0.2em] uppercase mb-1"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                {product.code}
              </p>
              <h2
                className="text-xl font-bold mb-2 leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
              >
                {product.name}
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
              >
                {product.shortDesc}
              </p>

              <div className="space-y-2 mb-6">
                {[
                  "Fabricación a medida",
                  "Entrega en 5 días hábiles",
                  "Garantía de calidad ISO",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle size={14} style={{ color: "var(--brand-orange)", flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón comprar */}
              <button
                onClick={handleComprar}
                className="w-full py-3.5 text-sm font-semibold rounded flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: "var(--brand-orange)",
                  color: "oklch(0.12 0.005 285)",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
              >
                <ShoppingCart size={16} />
                Solicitar este molde
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full mt-2 py-3 text-sm font-medium rounded border transition-all duration-150"
                style={{
                  borderColor: "var(--section-border)",
                  color: "var(--section-body)",
                  fontFamily: "var(--font-body)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--section-body)";
                }}
              >
                Ver otros productos
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Footer simple ──────────────────────────────────── */}
      <footer className="mt-4 py-8" style={{ borderTop: "1px solid var(--section-border)" }}>
        <div className="container flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center rounded" style={{ backgroundColor: "var(--brand-orange)" }}>
              <Package size={12} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
              Hores Cartotécnica
            </span>
          </div>
          <p className="text-xs hidden sm:block" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
            Buenos Aires, Argentina
          </p>
        </div>
      </footer>
    </div>
  );
}
