import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Package, ArrowLeft, Sun, Moon, ShieldCheck, Zap, Upload } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}


export default function Calidad() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [certSrc, setCertSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const certFileRef = useRef<HTMLInputElement>(null);

  const loadCert = () => {
    fetch(`/api/settings/certificate-image?t=${Date.now()}`)
      .then((r) => r.ok ? r.blob() : null)
      .then((blob) => { if (blob) setCertSrc(URL.createObjectURL(blob)); })
      .catch(() => {});
  };

  useEffect(() => { loadCert(); }, []);

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      fetch("/api/settings/certificate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hores_token")}`,
        },
        body: JSON.stringify({ data: reader.result }),
      })
        .then((r) => { if (r.ok) loadCert(); })
        .finally(() => {
          setUploading(false);
          if (certFileRef.current) certFileRef.current.value = "";
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>

      {/* Topbar */}
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
                {t("historia.back")}
              </button>
              <div className="w-px h-5" style={{ backgroundColor: "var(--section-border)" }} />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center rounded" style={{ backgroundColor: "var(--brand-orange)" }}>
                  <Package size={14} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                  Hores Cartotécnica
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium tracking-[0.18em] uppercase hidden sm:block"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                {t("calidad.eyebrow")}
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

      {/* Page content */}
      <main className="container py-16 max-w-5xl">

        {/* Header */}
        <RevealSection>
          <div className="mb-14 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span
                className="text-xs font-medium tracking-[0.25em] uppercase"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                {t("calidad.eyebrow")}
              </span>
              <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
            >
              {t("calidad.title")}
            </h1>
            <p
              className="text-base leading-relaxed mx-auto"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300, maxWidth: "560px" }}
            >
              {t("calidad.subtitle")}
            </p>
          </div>
        </RevealSection>

        {/* Two content cards */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Card 1: Seriedad y Eficiencia */}
          <RevealSection delay={80}>
            <div
              className="rounded-xl p-8 h-full"
              style={{
                backgroundColor: "var(--section-card)",
                border: "1px solid var(--section-border)",
              }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245, 124, 0, 0.12)" }}
                >
                  <Zap size={20} style={{ color: "var(--brand-orange)" }} />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                  >
                    {t("calidad.seriedad_title")}
                  </h2>
                  <p
                    className="text-xs mt-0.5 italic"
                    style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                  >
                    {t("calidad.seriedad_subtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(["seriedad_p1", "seriedad_p2", "seriedad_p3", "seriedad_p4"] as const).map((key) => (
                  <p key={key} className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {t(`calidad.${key}`)}
                  </p>
                ))}
                <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  {t("calidad.seriedad_p5_pre")}{" "}
                  <strong style={{ color: "var(--section-heading)", fontWeight: 700 }}>
                    {t("calidad.seriedad_p5_bold")}
                  </strong>
                </p>
              </div>
            </div>
          </RevealSection>

          {/* Card 2: Política de Inocuidad */}
          <RevealSection delay={180}>
            <div
              className="rounded-xl p-8 h-full"
              style={{
                backgroundColor: "var(--section-card)",
                border: "1px solid var(--section-border)",
              }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245, 124, 0, 0.12)" }}
                >
                  <ShieldCheck size={20} style={{ color: "var(--brand-orange)" }} />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                  >
                    {t("calidad.inocuidad_title")}
                  </h2>
                  <p
                    className="text-xs mt-0.5 italic"
                    style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                  >
                    {t("calidad.inocuidad_subtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  <strong style={{ color: "var(--section-heading)", fontWeight: 700 }}>
                    {t("calidad.inocuidad_p1_bold")}
                  </strong>{" "}
                  {t("calidad.inocuidad_p1_rest")}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  {t("calidad.inocuidad_p2")}
                </p>
                <ul className="space-y-2 pt-1">
                  {(["b1", "b2", "b3", "b4"] as const).map((key) => (
                    <li key={key} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "var(--brand-orange)" }}
                      />
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                      >
                        {t(`calidad.inocuidad_${key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealSection>
        </div>

        {/* Certificado ISO 22000:2018 */}
        <RevealSection delay={120}>
          <div
            className="mt-8 rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--section-border)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                  Certificado ISO 22000:2018
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  Bureau Veritas · N° BR235332 · Vigente hasta noviembre 2027
                </p>
              </div>
              {isAdmin && (
                <>
                  <input ref={certFileRef} type="file" accept="image/*" className="hidden" onChange={handleCertUpload} />
                  <button
                    onClick={() => certFileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      border: "1px solid var(--section-border)",
                      color: uploading ? "var(--section-muted)" : "var(--brand-orange)",
                      backgroundColor: "transparent",
                      fontFamily: "var(--font-body)",
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <Upload size={13} />
                    {uploading ? "Subiendo..." : "Cambiar foto"}
                  </button>
                </>
              )}
            </div>
            <div className="flex justify-center p-6">
              {certSrc ? (
                <img
                  src={certSrc}
                  alt="Certificado ISO 22000:2018 — Bureau Veritas"
                  style={{ maxWidth: "480px", width: "100%", display: "block", borderRadius: "8px" }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-lg"
                  style={{ width: "100%", maxWidth: 480, height: 280, backgroundColor: "var(--section-card-inner)", border: "2px dashed var(--section-border)" }}
                >
                  <Upload size={28} style={{ color: "var(--section-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                    {isAdmin ? "Hacé click en \"Cambiar foto\" para subir el certificado" : "Certificado no disponible"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </RevealSection>

      </main>
    </div>
  );
}
