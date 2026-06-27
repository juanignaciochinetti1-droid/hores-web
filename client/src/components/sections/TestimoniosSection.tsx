import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquarePlus, Send, CheckCircle, X, ChevronRight } from "lucide-react";

const TESTIMONIOS = [
  { key: "t1", initials: "JR", color: "#F57C00",  bg: "rgba(245,124,0,0.12)"   },
  { key: "t2", initials: "MB", color: "#c040b8",  bg: "rgba(192,64,184,0.12)"  },
  { key: "t3", initials: "CM", color: "#1a8fc8",  bg: "rgba(26,143,200,0.12)"  },
  { key: "t4", initials: "LS", color: "#259c57",  bg: "rgba(37,156,87,0.12)"   },
];

const CARD_COLORS = [
  { color: "#e05520", bg: "rgba(224,85,32,0.12)"   },
  { color: "#5048e0", bg: "rgba(80,72,224,0.12)"   },
  { color: "#259c57", bg: "rgba(37,156,87,0.12)"   },
  { color: "#c040b8", bg: "rgba(192,64,184,0.12)"  },
  { color: "#F57C00", bg: "rgba(245,124,0,0.12)"   },
  { color: "#1a8fc8", bg: "rgba(26,143,200,0.12)"  },
];

const EMPTY_REVIEW = { name: "", company: "", role: "", quote: "" };

interface ApiReview {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  quote: string;
}

export default function TestimoniosSection() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiReviews, setApiReviews] = useState<ApiReview[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setApiReviews(data); })
      .catch(() => {});
  }, [reviewsVersion]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim() || !form.quote.trim()) { setError("Nombre y opinión son requeridos"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error al enviar");
      setSuccess(true);
      setForm(EMPTY_REVIEW);
      setReviewsVersion((v) => v + 1);
      setTimeout(() => { setSuccess(false); setFormOpen(false); }, 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-bg)" }}
    >
      <div className="container">
        {/* Header */}
        <div className={`mb-12 text-center reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span
              className="text-xs font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
            >
              {t("testimonios.eyebrow")}
            </span>
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
          >
            {t("testimonios.title")}
          </h2>
          <p
            className="text-lg max-w-lg mx-auto"
            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            {t("testimonios.subtitle")}
          </p>
        </div>

        {/* Cards — siempre 4 fijos */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIOS.map((item, i) => (
            <div
              key={item.key}
              className={`rounded-2xl p-6 flex flex-col gap-4 reveal ${visible ? "visible" : ""}`}
              style={{
                backgroundColor: "var(--section-card)",
                border: "1px solid var(--section-border)",
                boxShadow: "var(--card-shadow)",
                transitionDelay: `${i * 70}ms`,
              }}
            >
              {/* Quote mark */}
              <div
                className="text-4xl leading-none font-serif select-none"
                style={{ color: item.color, opacity: 0.6 }}
              >
                "
              </div>

              {/* Quote */}
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
              >
                {t(`testimonios.${item.key}_quote`)}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(28,28,30,0.1)" }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: item.bg,
                    color: item.color,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {item.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                    {t(`testimonios.${item.key}_name`)}
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                    {t(`testimonios.${item.key}_role`)} · {t(`testimonios.${item.key}_company`)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Botón ver más reviews de API */}
        {apiReviews.length > 0 && (
          <div className={`mt-6 text-center reveal ${visible ? "visible" : ""}`} style={{ transitionDelay: "320ms" }}>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200"
              style={{ border: "1px solid var(--section-border)", color: "var(--section-muted)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
            >
              Ver {apiReviews.length} opinión{apiReviews.length !== 1 ? "es" : ""} más
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Opinion form */}
        <div className={`mt-12 reveal ${visible ? "visible" : ""}`} style={{ transitionDelay: "280ms" }}>
          {!formOpen ? (
            <div className="text-center">
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full transition-all duration-200 active:scale-95"
                style={{ border: "1px solid var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", color: "var(--brand-orange)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
              >
                <MessageSquarePlus size={16} />
                Compartir tu experiencia
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto rounded-3xl p-6 md:p-8" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquarePlus size={18} style={{ color: "var(--brand-orange)", flexShrink: 0 }} />
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  Dejá tu opinión
                </h3>
              </div>

              {success ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle size={40} style={{ color: "var(--brand-orange)" }} />
                  <p className="font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>¡Gracias por compartir tu experiencia!</p>
                  <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Tu opinión será revisada antes de publicarse.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171", fontFamily: "var(--font-body)" }}>{error}</p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {([
                      { field: "name", label: "Nombre *", placeholder: "Tu nombre" },
                      { field: "company", label: "Empresa", placeholder: "Tu empresa (opcional)" },
                    ] as const).map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{label}</label>
                        <input
                          value={form[field]}
                          onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                          placeholder={placeholder}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--section-border)", backgroundColor: "var(--section-card-inner)", color: "var(--section-heading)", fontFamily: "var(--font-body)", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Cargo / Rol (opcional)</label>
                    <input
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      placeholder="Ej: Gerente de producción"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--section-border)", backgroundColor: "var(--section-card-inner)", color: "var(--section-heading)", fontFamily: "var(--font-body)", fontSize: "13px", outline: "none" }}
                      onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Tu opinión *</label>
                    <textarea
                      rows={4}
                      value={form.quote}
                      onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
                      placeholder="Contanos tu experiencia con Hores Cartotécnica..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--section-border)", backgroundColor: "var(--section-card-inner)", color: "var(--section-heading)", fontFamily: "var(--font-body)", fontSize: "13px", outline: "none", resize: "vertical" }}
                      onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--section-border)"; }}
                    />
                    <p className="text-right text-xs mt-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{form.quote.length}/1000</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => { setFormOpen(false); setForm(EMPTY_REVIEW); setError(null); }} style={{ fontSize: "13px", color: "var(--section-muted)", fontFamily: "var(--font-body)", cursor: "pointer", background: "none", border: "none" }}>
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 active:scale-95"
                      style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, border: "none" }}
                    >
                      <Send size={14} />
                      {submitting ? "Enviando..." : "Enviar opinión"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: todas las reviews extra */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl flex flex-col"
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              height: "min(560px, 88vh)",
              animation: "modalIn 0.22s cubic-bezier(0.23, 1, 0.32, 1) forwards",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--section-border)" }}>
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase mb-0.5" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Opiniones</p>
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  Lo que dicen nuestros clientes
                </h3>
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

            {/* Lista scrolleable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {apiReviews.map((review, i) => {
                const { color, bg } = CARD_COLORS[i % CARD_COLORS.length];
                const initials = review.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={review.id}
                    className="rounded-2xl p-5 flex flex-col gap-3"
                    style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                  >
                    <div className="text-3xl leading-none font-serif select-none" style={{ color, opacity: 0.6 }}>"</div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                      {review.quote}
                    </p>
                    <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid rgba(28,28,30,0.1)" }}>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: bg,
                          color,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                          {review.name}
                        </div>
                        {(review.role || review.company) && (
                          <div className="text-xs mt-0.5 truncate" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                            {[review.role, review.company].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
