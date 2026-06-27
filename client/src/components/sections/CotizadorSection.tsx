import { useState, useEffect, useRef } from "react";
import { Calculator, RotateCcw, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CotizadorForm {
  width: string;
  height: string;
  material: string;
  quantity: string;
}

interface PriceResult {
  unitMin: number;
  unitMax: number;
  totalMin: number;
  totalMax: number;
  qty: number;
}

const emptyForm: CotizadorForm = { width: "", height: "", material: "", quantity: "1" };

const MAT_MULT: Record<string, number> = {
  "corrugado-simple": 1.0,
  "corrugado-doble": 1.35,
  "cartulina-250": 0.85,
  "cartulina-350": 1.0,
  "microcanal": 1.18,
};

function calcPrice(form: CotizadorForm): PriceResult | null {
  const w = parseFloat(form.width);
  const h = parseFloat(form.height);
  const qty = parseInt(form.quantity, 10);
  if (!w || !h || !form.material || !qty || qty < 1) return null;

  const areaCm2 = (w / 10) * (h / 10);
  const matMult = MAT_MULT[form.material] ?? 1.0;
  const qtyMult = qty >= 11 ? 0.78 : qty >= 6 ? 0.85 : qty >= 3 ? 0.92 : 1.0;

  const baseUnit = areaCm2 * 38 * matMult * qtyMult;
  const unitMin = Math.round(baseUnit * 0.82 / 500) * 500;
  const unitMax = Math.round(baseUnit * 1.18 / 500) * 500;

  return {
    unitMin,
    unitMax,
    totalMin: unitMin * qty,
    totalMax: unitMax * qty,
    qty,
  };
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

export default function CotizadorSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<CotizadorForm>(emptyForm);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState("");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setResult(null);
  };

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    const r = calcPrice(form);
    if (!r) {
      setError(t("cotizador.error_fields"));
      return;
    }
    setResult(r);
  };

  const handleReset = () => {
    setForm(emptyForm);
    setResult(null);
    setError("");
  };

  const inputStyle: React.CSSProperties = {
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    marginBottom: "6px",
    color: "var(--section-muted)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.03em",
  };

  return (
    <section
      id="cotizador"
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-bg)" }}
    >
      <div className="container">
        <div className={`mb-12 reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span
              className="text-xs font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
            >
              {t("cotizador.eyebrow")}
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
          >
            {t("cotizador.title")}
          </h2>
          <p
            className="text-lg max-w-xl"
            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            {t("cotizador.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Form */}
          <div
            className={`rounded-xl p-6 reveal-left ${visible ? "visible" : ""}`}
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <form onSubmit={handleCalc} className="space-y-5">
              {/* Dimensions */}
              <div>
                <p style={{ ...labelStyle, marginBottom: "10px" }}>{t("cotizador.dimensions")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>{t("cotizador.width")} (mm)</label>
                    <input
                      type="number"
                      name="width"
                      min="50"
                      max="2000"
                      placeholder="ej. 800"
                      value={form.width}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("cotizador.height")} (mm)</label>
                    <input
                      type="number"
                      name="height"
                      min="50"
                      max="2000"
                      placeholder="ej. 600"
                      value={form.height}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t("cotizador.material")}</label>
                <select
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand-orange)"; }}
                  onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--section-border)"; }}
                >
                  <option value="">{t("cotizador.material_placeholder")}</option>
                  <option value="corrugado-simple">{t("cotizador.mat_corrugado_simple")}</option>
                  <option value="corrugado-doble">{t("cotizador.mat_corrugado_doble")}</option>
                  <option value="cartulina-250">{t("cotizador.mat_cartulina_250")}</option>
                  <option value="cartulina-350">{t("cotizador.mat_cartulina_350")}</option>
                  <option value="microcanal">{t("cotizador.mat_microcanal")}</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>{t("cotizador.quantity")}</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max="100"
                  value={form.quantity}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: "oklch(0.65 0.18 25)", fontFamily: "var(--font-body)" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                  style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                >
                  <Calculator size={15} />
                  {t("cotizador.calc_btn")}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 text-sm rounded-lg border transition-colors duration-150 flex items-center gap-1.5"
                  style={{ borderColor: "var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                >
                  <RotateCcw size={14} />
                  {t("cotizador.reset_btn")}
                </button>
              </div>
            </form>
          </div>

          {/* Result panel */}
          <div className={`reveal-right ${visible ? "visible" : ""}`} style={{ transitionDelay: "80ms" }}>
            {result ? (
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: "var(--section-card)",
                  border: "1px solid var(--brand-orange)",
                  boxShadow: "0 0 0 1px rgba(245,124,0,0.15), var(--card-shadow)",
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(245,124,0,0.12)" }}
                  >
                    <TrendingUp size={16} style={{ color: "var(--brand-orange)" }} />
                  </div>
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "var(--section-heading)", fontFamily: "var(--font-display)" }}
                  >
                    {t("cotizador.result_title")}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                  >
                    <div
                      className="text-xs mb-1"
                      style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                    >
                      {t("cotizador.unit_price")}
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                    >
                      {fmt(result.unitMin)} – {fmt(result.unitMax)}
                    </div>
                  </div>

                  {result.qty > 1 && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                    >
                      <div
                        className="text-xs mb-1"
                        style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                      >
                        {t("cotizador.total_price")} ({result.qty} u.)
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                      >
                        {fmt(result.totalMin)} – {fmt(result.totalMax)}
                      </div>
                    </div>
                  )}

                  {result.qty >= 3 && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{
                        backgroundColor: "oklch(0.55 0.16 152 / 0.08)",
                        border: "1px solid oklch(0.55 0.16 152 / 0.25)",
                        color: "oklch(0.55 0.16 152)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      ✓ {t("cotizador.discount_applied")} ({result.qty >= 11 ? "22%" : result.qty >= 6 ? "15%" : "8%"})
                    </div>
                  )}
                </div>

                <p
                  className="text-xs mt-5 leading-relaxed"
                  style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {t("cotizador.disclaimer")}
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl p-10 text-center"
                style={{
                  backgroundColor: "var(--section-card)",
                  border: "1px dashed var(--section-border)",
                }}
              >
                <Calculator
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: "var(--section-muted)", opacity: 0.5 }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {t("cotizador.empty_state")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
