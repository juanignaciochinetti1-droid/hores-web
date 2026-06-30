/**
 * EmpresaSection — Hero + About Modal
 * Design: Craft Manufacturing — full-screen hero with dark overlay
 * Background: factory hero image, dark gradient overlay
 * CTA: "Conocer más" button opens modal with factory info
 */

import { useState, useEffect, useRef } from "react";
import { X, Award, Users, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

const HERO_IMG = "/hores-hero-web.jpg?v=2";
const ABOUT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663723930343/HjyBo5a6eNuvRBjtzxbuL5/factory-about-Hem4P8XrHURmLTWUeDDmx2.webp";

const STAT_ICONS = [
  { icon: Calendar, value: "+20", key: "stat_years" },
  { icon: Users, value: "+150", key: "stat_clients" },
  { icon: Award, value: "ISO", key: "stat_iso" },
];

export default function EmpresaSection() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const stats = STAT_ICONS.map((s) => ({ ...s, label: t(`hero.${s.key}`) }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => { document.documentElement.style.overflow = ""; };
  }, [modalOpen]);

  return (
    <>
      <section
        id="empresa"
        ref={sectionRef}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(26, 12, 6, 0.93) 0%, rgba(38, 16, 8, 0.76) 50%, rgba(50, 22, 10, 0.42) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative container py-32">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div
              className={`flex items-center gap-3 mb-6 reveal ${visible ? "visible" : ""}`}
              style={{ transitionDelay: "0ms" }}
            >
              <div
                className="h-px w-10"
                style={{ backgroundColor: "var(--brand-orange)" }}
              />
              <span
                className="text-xs font-medium tracking-[0.25em] uppercase"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                {t("hero.eyebrow")}
              </span>
            </div>

            {/* Main heading */}
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 reveal ${visible ? "visible" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.97 0.01 85)",
                transitionDelay: "80ms",
              }}
            >
              {t("hero.heading1")}
              <br />
              <span style={{ color: "var(--brand-orange)", fontStyle: "italic" }}>
                {t("hero.heading2")}
              </span>{" "}
              {t("hero.heading3")}
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg md:text-xl leading-relaxed mb-10 reveal ${visible ? "visible" : ""}`}
              style={{
                color: "oklch(0.80 0.01 85)",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                transitionDelay: "160ms",
                maxWidth: "520px",
              }}
            >
              {t("hero.subtitle")}
            </p>

            {/* CTA */}
            <div
              className={`flex flex-wrap gap-4 reveal ${visible ? "visible" : ""}`}
              style={{ transitionDelay: "240ms" }}
            >
              <button
                onClick={() => setModalOpen(true)}
                className="group px-8 py-4 text-sm font-semibold rounded transition-all duration-200 active:scale-95 flex items-center gap-2"
                style={{
                  backgroundColor: "var(--brand-orange)",
                  color: "oklch(0.12 0.005 285)",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.03em",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)";
                }}
              >
                {t("hero.cta_conocer")}
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("productos");
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
                }}
                className="px-8 py-4 text-sm font-semibold rounded border transition-all duration-200 active:scale-95"
                style={{
                  borderColor: "oklch(1 0 0 / 30%)",
                  color: "oklch(0.92 0.01 85)",
                  fontFamily: "var(--font-body)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(1 0 0 / 30%)";
                  (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.92 0.01 85)";
                }}
              >
                {t("hero.cta_productos")}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            background: "var(--hero-stats-bg)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid var(--hero-stats-border)",
          }}
        >
          <div className="container">
            <div className="grid grid-cols-3 md:grid-cols-3 max-w-2xl mx-auto" style={{ borderColor: "var(--hero-stats-divider)" }}>
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`py-5 px-6 flex items-center gap-3 reveal ${visible ? "visible" : ""}`}
                  style={{
                    transitionDelay: `${320 + i * 60}ms`,
                    borderRight: i < stats.length - 1 ? "1px solid var(--hero-stats-divider)" : "none",
                  }}
                >
                  <stat.icon
                    size={18}
                    style={{ color: "var(--hero-stats-icon)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      className="text-xl font-bold leading-none"
                      style={{ fontFamily: "var(--font-display)", color: "var(--hero-stats-value)" }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--hero-stats-label)", fontFamily: "var(--font-body)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="relative w-full max-w-3xl rounded-lg"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              animation: "modalIn 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--section-border)" }}
            >
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase mb-0.5" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                  {t("about_modal.eyebrow")}
                </p>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("about_modal.title")}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded transition-colors duration-150"
                style={{ color: "var(--section-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body — 2 columns */}
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: image + stats */}
              <div className="p-5 flex flex-col gap-4" style={{ borderRight: "1px solid var(--section-border)" }}>
                <div className="rounded-md overflow-hidden flex-shrink-0" style={{ height: "160px" }}>
                  <img src={HERO_IMG} alt="Planta de producción Hores Cartotécnica" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat, i) => (
                    <div key={i} className="rounded p-3 text-center" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                      <stat.icon size={16} className="mx-auto mb-1.5" style={{ color: "var(--brand-orange)" }} />
                      <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>{stat.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: text */}
              <div className="p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {t("about_modal.p1")}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {t("about_modal.p2")}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {t("about_modal.p3")}
                  </p>
                </div>
                <div className="flex justify-end mt-5">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold rounded transition-all duration-200 active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}
                  >
                    {t("about_modal.close")}
                  </button>
                </div>
              </div>
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
