import { useState, useEffect, useRef } from "react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

type Category = "todos" | "alimentario" | "cosmetico" | "farmaceutico" | "industrial";

interface GaleriaItem {
  name: string;
  specs: string;
  category: Exclude<Category, "todos">;
  accent: string;
  bg: string;
}

const ITEMS: GaleriaItem[] = [
  { name: "Troquel caja de cereales",       specs: "600×400 mm · Corrugado simple",   category: "alimentario",   accent: "oklch(0.72 0.18 60)",  bg: "oklch(0.72 0.18 60 / 0.10)" },
  { name: "Troquel estuche de perfumería",  specs: "350×250 mm · Cartulina 350 g",    category: "cosmetico",     accent: "oklch(0.65 0.18 320)", bg: "oklch(0.65 0.18 320 / 0.10)" },
  { name: "Troquel blíster farmacéutico",   specs: "280×200 mm · Cartulina 250 g",    category: "farmaceutico",  accent: "oklch(0.60 0.18 225)", bg: "oklch(0.60 0.18 225 / 0.10)" },
  { name: "Troquel caja de pizza",          specs: "800×600 mm · Corrugado doble",    category: "alimentario",   accent: "oklch(0.72 0.18 60)",  bg: "oklch(0.72 0.18 60 / 0.10)" },
  { name: "Troquel display cosmético",      specs: "450×300 mm · Microcanal",         category: "cosmetico",     accent: "oklch(0.65 0.18 320)", bg: "oklch(0.65 0.18 320 / 0.10)" },
  { name: "Troquel empaque medicamento",    specs: "320×240 mm · Cartulina 250 g",    category: "farmaceutico",  accent: "oklch(0.60 0.18 225)", bg: "oklch(0.60 0.18 225 / 0.10)" },
  { name: "Troquel industrial pesado",      specs: "900×700 mm · Corrugado doble",    category: "industrial",    accent: "oklch(0.55 0.08 250)", bg: "oklch(0.55 0.08 250 / 0.10)" },
  { name: "Troquel caja e-commerce",        specs: "500×400 mm · Corrugado simple",   category: "industrial",    accent: "oklch(0.55 0.08 250)", bg: "oklch(0.55 0.08 250 / 0.10)" },
];

const CATS: { key: Category; label_key: string }[] = [
  { key: "todos",        label_key: "galeria.cat_todos" },
  { key: "alimentario",  label_key: "galeria.cat_alimentario" },
  { key: "cosmetico",    label_key: "galeria.cat_cosmetico" },
  { key: "farmaceutico", label_key: "galeria.cat_farmaceutico" },
  { key: "industrial",   label_key: "galeria.cat_industrial" },
];

export default function GaleriaSection() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Category>("todos");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filtered = active === "todos" ? ITEMS : ITEMS.filter((i) => i.category === active);

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-alt)" }}
    >
      <div className="container">
        {/* Header */}
        <div className={`mb-10 reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span
              className="text-xs font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
            >
              {t("galeria.eyebrow")}
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
          >
            {t("galeria.title")}
          </h2>
          <p
            className="text-lg max-w-xl"
            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            {t("galeria.subtitle")}
          </p>
        </div>

        {/* Filter tabs */}
        <div
          className={`flex flex-wrap gap-2 mb-8 reveal ${visible ? "visible" : ""}`}
          style={{ transitionDelay: "60ms" }}
        >
          {CATS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: active === cat.key ? "var(--brand-orange)" : "var(--section-card)",
                color: active === cat.key ? "oklch(0.12 0.005 285)" : "var(--section-muted)",
                border: `1px solid ${active === cat.key ? "var(--brand-orange)" : "var(--section-border)"}`,
                fontFamily: "var(--font-body)",
              }}
            >
              {t(cat.label_key)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <div
              key={item.name}
              className={`group rounded-xl overflow-hidden reveal ${visible ? "visible" : ""}`}
              style={{
                backgroundColor: "var(--section-card)",
                border: "1px solid var(--section-border)",
                boxShadow: "var(--card-shadow)",
                transitionDelay: `${i * 50}ms`,
                transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "var(--card-shadow-hover)";
                el.style.borderColor = item.accent;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "var(--card-shadow)";
                el.style.borderColor = "var(--section-border)";
              }}
            >
              {/* Image placeholder */}
              <div
                className="flex items-center justify-center"
                style={{
                  aspectRatio: "4 / 3",
                  backgroundColor: item.bg,
                  borderBottom: "1px solid var(--section-border)",
                }}
              >
                <Package
                  size={40}
                  style={{ color: item.accent, opacity: 0.6 }}
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: item.accent, fontFamily: "var(--font-mono)" }}
                >
                  {t(`galeria.cat_${item.category}`)}
                </div>
                <div
                  className="text-sm font-semibold mb-1 leading-snug"
                  style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
                >
                  {item.name}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {item.specs}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
