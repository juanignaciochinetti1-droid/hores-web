import { useState, useEffect, useRef } from "react";
import { CheckCircle, Loader2, Upload, TrendingUp, Shield, Users, Wrench, Award, Target, Heart, Zap, Plus, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface CvForm {
  name: string;
  email: string;
  phone: string;
  area: string;
  message: string;
  cvFile: File | null;
}

const emptyForm: CvForm = {
  name: "",
  email: "",
  phone: "",
  area: "",
  message: "",
  cvFile: null,
};

const PERK_ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Shield, Users, Wrench, Award, Target, Heart, Zap, CheckCircle,
};
const PERK_ICON_OPTIONS = Object.keys(PERK_ICON_MAP);

export default function CurriculumSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState<CvForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type PerkEntry = { iconName: string; text: string };

  const [perks, setPerks] = useState<PerkEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_perks");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { iconName: "TrendingUp", text: t("curriculum.perk_1") },
      { iconName: "Shield",     text: t("curriculum.perk_2") },
      { iconName: "Users",      text: t("curriculum.perk_3") },
      { iconName: "Wrench",     text: t("curriculum.perk_4") },
    ];
  });

  const [perkMenuOpenIdx, setPerkMenuOpenIdx] = useState<number | null>(null);
  const [editingPerkIdx, setEditingPerkIdx] = useState<number | null>(null);
  const [editPerkForm, setEditPerkForm] = useState<PerkEntry>({ iconName: "TrendingUp", text: "" });
  const [addingPerk, setAddingPerk] = useState(false);
  const [newPerk, setNewPerk] = useState<PerkEntry>({ iconName: "TrendingUp", text: "" });
  const perkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (perkMenuRef.current && !perkMenuRef.current.contains(e.target as Node)) setPerkMenuOpenIdx(null);
    };
    if (perkMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [perkMenuOpenIdx]);

  const savePerks = (updated: PerkEntry[]) => {
    setPerks(updated);
    localStorage.setItem("hores_perks", JSON.stringify(updated));
  };

  const handleAddPerk = () => {
    if (!newPerk.text.trim()) return;
    savePerks([...perks, { iconName: newPerk.iconName, text: newPerk.text.trim() }]);
    setNewPerk({ iconName: "TrendingUp", text: "" });
    setAddingPerk(false);
  };

  const handleDeletePerk = (idx: number) => {
    savePerks(perks.filter((_, i) => i !== idx));
    setPerkMenuOpenIdx(null);
  };

  const openEditPerk = (idx: number) => {
    setEditingPerkIdx(idx);
    setEditPerkForm({ ...perks[idx] });
    setPerkMenuOpenIdx(null);
  };

  const handleSavePerk = () => {
    if (!editPerkForm.text.trim() || editingPerkIdx === null) return;
    savePerks(perks.map((p, i) => i === editingPerkIdx ? { iconName: editPerkForm.iconName, text: editPerkForm.text.trim() } : p));
    setEditingPerkIdx(null);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, cvFile: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          area: form.area,
          message: form.message,
        }),
      });
    } catch {
      // silently ignore network errors in dev
    }
    setSubmitting(false);
    setSubmitted(true);
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
    fontWeight: 500 as const,
    marginBottom: "6px",
    color: "var(--section-muted)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.03em",
  };

  return (
    <section
      id="trabajo"
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-alt)" }}
    >
      <span className="section-number">04</span>

      <div className="container">
        <div className={`mb-16 reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span
              className="text-xs font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
            >
              {t("curriculum.eyebrow")}
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
          >
            {t("curriculum.title")}
          </h2>
          <p
            className="text-lg max-w-xl"
            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            {t("curriculum.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: perks */}
          <div>
            <div className={`flex items-center justify-between mb-5 reveal ${visible ? "visible" : ""}`}>
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
              >
                {t("curriculum.perks_title")}
              </h3>
              {isAdmin && !addingPerk && (
                <button
                  onClick={() => setAddingPerk(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={12} /> Nuevo beneficio
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {perks.map((perk, i) => {
                const IconComp = PERK_ICON_MAP[perk.iconName] ?? TrendingUp;
                const isPerkMenuOpen = perkMenuOpenIdx === i;
                const isPerkEditing = isAdmin && editingPerkIdx === i;
                return (
                  <div key={i} style={{ position: "relative", zIndex: isPerkMenuOpen ? 50 : 0 }}>
                    {isPerkEditing ? (
                      <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar beneficio</p>
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {PERK_ICON_OPTIONS.map((name) => {
                              const Ic = PERK_ICON_MAP[name];
                              return (
                                <button key={name} type="button" onClick={() => setEditPerkForm((p) => ({ ...p, iconName: name }))}
                                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                                  style={{ backgroundColor: editPerkForm.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${editPerkForm.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                                  <Ic size={14} style={{ color: editPerkForm.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <textarea rows={3} value={editPerkForm.text} onChange={(e) => setEditPerkForm((p) => ({ ...p, text: e.target.value }))} placeholder="Descripción del beneficio"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none", resize: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingPerkIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={12} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSavePerk} disabled={!editPerkForm.text}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: !editPerkForm.text ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-5 rounded-lg relative reveal ${visible ? "visible" : ""}`}
                        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)", transitionDelay: `${i * 60}ms` }}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(245, 124, 0, 0.12)" }}>
                          <IconComp size={18} style={{ color: "var(--brand-orange)" }} />
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300, paddingRight: isAdmin ? "28px" : "0" }}>
                          {perk.text}
                        </p>
                        {isAdmin && (
                          <div className="absolute top-2.5 right-2.5" ref={isPerkMenuOpen ? perkMenuRef : undefined} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setPerkMenuOpenIdx(isPerkMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isPerkMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditPerk(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeletePerk(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "oklch(0.70 0.15 20)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Trash2 size={11} /> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Formulario nuevo beneficio */}
              {isAdmin && addingPerk && (
                <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo beneficio</p>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PERK_ICON_OPTIONS.map((name) => {
                        const Ic = PERK_ICON_MAP[name];
                        return (
                          <button key={name} type="button" onClick={() => setNewPerk((p) => ({ ...p, iconName: name }))}
                            className="w-8 h-8 rounded flex items-center justify-center transition-all"
                            style={{ backgroundColor: newPerk.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${newPerk.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                            <Ic size={14} style={{ color: newPerk.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea rows={3} value={newPerk.text} onChange={(e) => setNewPerk((p) => ({ ...p, text: e.target.value }))} placeholder="Descripción del beneficio"
                    style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none", resize: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setAddingPerk(false); setNewPerk({ iconName: "TrendingUp", text: "" }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                      style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                      <X size={12} /> Cancelar
                    </button>
                    <button type="button" onClick={handleAddPerk} disabled={!newPerk.text}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                      style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: !newPerk.text ? 0.5 : 1 }}>
                      <Plus size={12} /> Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: form */}
          <div
            className={`rounded-lg p-6 reveal ${visible ? "visible" : ""}`}
            style={{
              backgroundColor: "var(--section-card)",
              border: "1px solid var(--section-border)",
              boxShadow: "var(--card-shadow)",
              transitionDelay: "120ms",
            }}
          >
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={52} className="mx-auto mb-4" style={{ color: "var(--brand-orange)" }} />
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                >
                  {t("curriculum.success_title")}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-6 max-w-xs mx-auto"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {t("curriculum.success_msg")}
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm(emptyForm); }}
                  className="px-5 py-2.5 text-sm font-medium rounded border transition-colors duration-150"
                  style={{
                    borderColor: "var(--section-border)",
                    color: "var(--section-body)",
                    fontFamily: "var(--font-body)",
                    backgroundColor: "transparent",
                  }}
                >
                  {t("curriculum.success_close")}
                </button>
              </div>
            ) : (
              <>
                <h3
                  className="text-lg font-bold mb-5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
                >
                  {t("curriculum.form_title")}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>{t("curriculum.name")} *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t("curriculum.phone")}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("curriculum.email")} *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("curriculum.area")} *</label>
                    <select
                      name="area"
                      required
                      value={form.area}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--section-border)"; }}
                    >
                      <option value="">{t("curriculum.area_placeholder")}</option>
                      <option value="produccion">{t("curriculum.area_produccion")}</option>
                      <option value="diseno">{t("curriculum.area_diseno")}</option>
                      <option value="admin">{t("curriculum.area_admin")}</option>
                      <option value="ventas">{t("curriculum.area_ventas")}</option>
                      <option value="mantenimiento">{t("curriculum.area_mantenimiento")}</option>
                      <option value="otro">{t("curriculum.area_otro")}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("curriculum.message")}</label>
                    <textarea
                      name="message"
                      rows={3}
                      placeholder={t("curriculum.message_placeholder")}
                      value={form.message}
                      onChange={handleChange}
                      style={{ ...inputStyle, resize: "vertical" }}
                      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--section-border)"; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {t("curriculum.cv_label")}{" "}
                      <span style={{ color: "var(--section-muted)", fontWeight: 300 }}>
                        {t("curriculum.cv_optional")}
                      </span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFile}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded transition-colors duration-150 text-sm"
                      style={{
                        border: `2px dashed ${form.cvFile ? "var(--brand-orange)" : "var(--section-border)"}`,
                        color: form.cvFile ? "var(--brand-orange)" : "var(--section-muted)",
                        backgroundColor: form.cvFile ? "rgba(245, 124, 0, 0.06)" : "var(--section-card-inner)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <Upload size={14} />
                      {form.cvFile ? form.cvFile.name : t("curriculum.cv_select")}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-sm font-semibold rounded flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
                    style={{
                      backgroundColor: "var(--brand-orange)",
                      color: "oklch(0.12 0.005 285)",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)";
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t("curriculum.submitting")}
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        {t("curriculum.submit")}
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
