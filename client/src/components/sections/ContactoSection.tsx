import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Instagram, MapPin, CheckCircle, Loader2, Send, Globe, MessageCircle, Plus, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CHANNEL_ICON_MAP: Record<string, React.ElementType> = {
  Mail, Phone, Instagram, MapPin, Globe, MessageCircle,
};
const CHANNEL_ICON_OPTIONS = Object.keys(CHANNEL_ICON_MAP);

const CHANNEL_COLORS = [
  { color: "var(--brand-orange)",   iconBg: "rgba(245, 124, 0, 0.12)"   },
  { color: "oklch(0.65 0.18 320)", iconBg: "rgba(178, 70, 152, 0.12)"  },
  { color: "oklch(0.65 0.15 150)", iconBg: "rgba(56, 161, 105, 0.12)"  },
  { color: "oklch(0.65 0.12 220)", iconBg: "rgba(66, 133, 200, 0.12)"  },
  { color: "oklch(0.65 0.15 270)", iconBg: "rgba(124, 93, 204, 0.12)"  },
  { color: "oklch(0.65 0.15 30)",  iconBg: "rgba(220, 80, 50, 0.12)"   },
];

interface ContactForm {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

const emptyForm: ContactForm = { name: "", email: "", company: "", subject: "", message: "" };

export default function ContactoSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  type ChannelEntry = { iconName: string; label: string; value: string; href: string; desc: string; color: string; iconBg: string; };

  const [channels, setChannels] = useState<ChannelEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_channels");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { iconName: "Instagram", label: "Instagram",             value: "@horescartotecnica",         href: "https://instagram.com/horescartotecnica", desc: t("contact.ch_instagram_desc"), color: "oklch(0.65 0.18 320)", iconBg: "rgba(178, 70, 152, 0.12)" },
      { iconName: "Mail",      label: "Email",                 value: "info@horescartotecnica.com",  href: "mailto:info@horescartotecnica.com",        desc: t("contact.ch_email_desc"),     color: "var(--brand-orange)",   iconBg: "rgba(245, 124, 0, 0.12)"  },
      { iconName: "Phone",     label: t("contact.ch_phone"),   value: "+54 11 4xxx-xxxx",            href: "tel:+541140000000",                        desc: t("contact.ch_phone_desc"),     color: "oklch(0.65 0.15 150)", iconBg: "rgba(56, 161, 105, 0.12)" },
      { iconName: "MapPin",    label: t("contact.ch_address"), value: "Buenos Aires, Argentina",     href: "#",                                        desc: t("contact.ch_address_desc"),   color: "oklch(0.65 0.12 220)", iconBg: "rgba(66, 133, 200, 0.12)" },
    ];
  });

  const emptyChannel: ChannelEntry = { iconName: "Mail", label: "", value: "", href: "", desc: "", color: CHANNEL_COLORS[0].color, iconBg: CHANNEL_COLORS[0].iconBg };

  const [chMenuOpenIdx, setChMenuOpenIdx] = useState<number | null>(null);
  const [editingChIdx, setEditingChIdx] = useState<number | null>(null);
  const [editChForm, setEditChForm] = useState<ChannelEntry>(emptyChannel);
  const [addingCh, setAddingCh] = useState(false);
  const [newCh, setNewCh] = useState<ChannelEntry>(emptyChannel);
  const chMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (chMenuRef.current && !chMenuRef.current.contains(e.target as Node)) setChMenuOpenIdx(null);
    };
    if (chMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chMenuOpenIdx]);

  const saveChannels = (updated: ChannelEntry[]) => {
    setChannels(updated);
    localStorage.setItem("hores_channels", JSON.stringify(updated));
  };

  const handleAddCh = () => {
    if (!newCh.label.trim() || !newCh.value.trim()) return;
    saveChannels([...channels, { ...newCh, label: newCh.label.trim(), value: newCh.value.trim(), href: newCh.href.trim(), desc: newCh.desc.trim() }]);
    setNewCh(emptyChannel);
    setAddingCh(false);
  };

  const handleDeleteCh = (idx: number) => {
    saveChannels(channels.filter((_, i) => i !== idx));
    setChMenuOpenIdx(null);
  };

  const openEditCh = (idx: number) => {
    setEditingChIdx(idx);
    setEditChForm({ ...channels[idx] });
    setChMenuOpenIdx(null);
  };

  const handleSaveCh = () => {
    if (!editChForm.label.trim() || !editChForm.value.trim() || editingChIdx === null) return;
    saveChannels(channels.map((ch, i) => i === editingChIdx ? { ...editChForm, label: editChForm.label.trim(), value: editChForm.value.trim(), href: editChForm.href.trim(), desc: editChForm.desc.trim() } : ch));
    setEditingChIdx(null);
  };

  const hours = [
    { day: t("contact.hours_weekdays"), time: "08:00 – 17:00 hs" },
    { day: t("contact.hours_saturday"), time: "08:00 – 12:00 hs" },
    { day: t("contact.hours_sunday"),   time: t("contact.closed") },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      id="contacto"
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-bg)" }}
    >
      <span className="section-number">05</span>

      <div className="container">
        <div className={`mb-16 reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span className="text-xs font-medium tracking-[0.25em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
              {t("contact.eyebrow")}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                {t("contact.title")}
              </h2>
              <p className="text-lg max-w-xl" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                {t("contact.subtitle")}
              </p>
            </div>
            {isAdmin && !addingCh && (
              <button
                onClick={() => setAddingCh(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 flex-shrink-0 mt-1"
                style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
              >
                <Plus size={14} /> Nuevo canal
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: channels */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
              {channels.map((ch, i) => {
                const IconComp = CHANNEL_ICON_MAP[ch.iconName] ?? Mail;
                const isChMenuOpen = chMenuOpenIdx === i;
                const isChEditing = isAdmin && editingChIdx === i;
                return (
                  <div key={i} style={{ position: "relative", zIndex: isChMenuOpen ? 50 : 0 }}>
                    {isChEditing ? (
                      /* Edit form */
                      <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar canal</p>
                        {/* Icon picker */}
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Icono</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {CHANNEL_ICON_OPTIONS.map((name) => {
                              const Ic = CHANNEL_ICON_MAP[name];
                              return (
                                <button key={name} type="button" onClick={() => setEditChForm((p) => ({ ...p, iconName: name }))}
                                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                                  style={{ backgroundColor: editChForm.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${editChForm.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                                  <Ic size={14} style={{ color: editChForm.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <input value={editChForm.label} onChange={(e) => setEditChForm((p) => ({ ...p, label: e.target.value }))} placeholder="Etiqueta (ej: Email)"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <input value={editChForm.value} onChange={(e) => setEditChForm((p) => ({ ...p, value: e.target.value }))} placeholder="Valor visible (ej: @hores)"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <input value={editChForm.desc} onChange={(e) => setEditChForm((p) => ({ ...p, desc: e.target.value }))} placeholder="Descripción corta"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <input value={editChForm.href} onChange={(e) => setEditChForm((p) => ({ ...p, href: e.target.value }))} placeholder="Enlace (URL, mailto:, tel:…)"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        {/* Color picker */}
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Color</p>
                          <div className="flex gap-2 flex-wrap">
                            {CHANNEL_COLORS.map((opt) => (
                              <button key={opt.color} type="button" onClick={() => setEditChForm((p) => ({ ...p, color: opt.color, iconBg: opt.iconBg }))}
                                className="w-7 h-7 rounded-full transition-all"
                                style={{ backgroundColor: opt.color, outline: editChForm.color === opt.color ? "2px solid var(--brand-orange)" : "2px solid transparent", outlineOffset: "2px", cursor: "pointer" }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingChIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={12} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSaveCh} disabled={!editChForm.label || !editChForm.value}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editChForm.label || !editChForm.value) ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View card */
                      <div className="relative">
                        <a
                          href={ch.href}
                          target={ch.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className={`group block p-5 rounded-lg reveal ${visible ? "visible" : ""}`}
                          style={{
                            backgroundColor: "var(--section-card)",
                            border: "1px solid var(--section-border)",
                            boxShadow: "var(--card-shadow)",
                            textDecoration: "none",
                            transitionDelay: `${i * 60}ms`,
                            transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
                            paddingRight: isAdmin ? "36px" : undefined,
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.borderColor = "rgba(245, 124, 0, 0.40)";
                            el.style.transform = "translateY(-4px)";
                            el.style.boxShadow = "var(--card-shadow-hover)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.borderColor = "var(--section-border)";
                            el.style.transform = "translateY(0)";
                            el.style.boxShadow = "var(--card-shadow)";
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: ch.iconBg }}>
                            <IconComp size={18} style={{ color: ch.color }} />
                          </div>
                          <div className="text-xs mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{ch.label}</div>
                          <div className="text-sm font-medium mb-1 break-all" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{ch.value}</div>
                          <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}>{ch.desc}</div>
                        </a>
                        {isAdmin && (
                          <div className="absolute top-2.5 right-2.5 z-10" ref={isChMenuOpen ? chMenuRef : undefined}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <button onClick={() => setChMenuOpenIdx(isChMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "var(--section-card-inner)" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isChMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditCh(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeleteCh(i)}
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

              {/* Formulario nuevo canal */}
              {isAdmin && addingCh && (
                <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo canal</p>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Icono</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {CHANNEL_ICON_OPTIONS.map((name) => {
                        const Ic = CHANNEL_ICON_MAP[name];
                        return (
                          <button key={name} type="button" onClick={() => setNewCh((p) => ({ ...p, iconName: name }))}
                            className="w-8 h-8 rounded flex items-center justify-center transition-all"
                            style={{ backgroundColor: newCh.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${newCh.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                            <Ic size={14} style={{ color: newCh.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input value={newCh.label} onChange={(e) => setNewCh((p) => ({ ...p, label: e.target.value }))} placeholder="Etiqueta (ej: Email)"
                    style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  <input value={newCh.value} onChange={(e) => setNewCh((p) => ({ ...p, value: e.target.value }))} placeholder="Valor visible (ej: @hores)"
                    style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  <input value={newCh.desc} onChange={(e) => setNewCh((p) => ({ ...p, desc: e.target.value }))} placeholder="Descripción corta"
                    style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  <input value={newCh.href} onChange={(e) => setNewCh((p) => ({ ...p, href: e.target.value }))} placeholder="Enlace (URL, mailto:, tel:…)"
                    style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {CHANNEL_COLORS.map((opt) => (
                        <button key={opt.color} type="button" onClick={() => setNewCh((p) => ({ ...p, color: opt.color, iconBg: opt.iconBg }))}
                          className="w-7 h-7 rounded-full transition-all"
                          style={{ backgroundColor: opt.color, outline: newCh.color === opt.color ? "2px solid var(--brand-orange)" : "2px solid transparent", outlineOffset: "2px", cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setAddingCh(false); setNewCh(emptyChannel); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                      style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                      <X size={12} /> Cancelar
                    </button>
                    <button type="button" onClick={handleAddCh} disabled={!newCh.label || !newCh.value}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                      style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newCh.label || !newCh.value) ? 0.5 : 1 }}>
                      <Plus size={12} /> Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`mt-6 p-5 rounded-lg reveal ${visible ? "visible" : ""}`} style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", transitionDelay: "300ms" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                {t("contact.hours_title")}
              </h4>
              <div className="space-y-2">
                {hours.map((row, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>{row.day}</span>
                    <span className="text-sm font-medium" style={{ color: row.time === t("contact.closed") ? "var(--section-muted)" : "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                      {row.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className={`rounded-lg p-6 reveal ${visible ? "visible" : ""}`} style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)", transitionDelay: "120ms" }}>
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={52} className="mx-auto mb-4" style={{ color: "var(--brand-orange)" }} />
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("contact.success_title")}
                </h3>
                <p className="text-sm leading-relaxed mb-6 max-w-xs mx-auto" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  {t("contact.success_desc")}
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm(emptyForm); }}
                  className="px-5 py-2.5 text-sm font-medium rounded border transition-colors duration-150"
                  style={{ borderColor: "var(--section-border)", color: "var(--section-body)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}
                >
                  {t("contact.success_another")}
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("contact.form_title")}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>{t("contact.name")} *</label>
                      <input type="text" name="name" required value={form.name} onChange={handleChange} style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t("contact.company")}</label>
                      <input type="text" name="company" value={form.company} onChange={handleChange} style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("contact.email")} *</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("contact.subject")}</label>
                    <select name="subject" value={form.subject} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--section-border)"; }}>
                      <option value="">{t("contact.subject_placeholder")}</option>
                      <option value="cotizacion">{t("contact.subject_quote")}</option>
                      <option value="consulta-tecnica">{t("contact.subject_technical")}</option>
                      <option value="pedido">{t("contact.subject_order")}</option>
                      <option value="otro">{t("contact.subject_other")}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("contact.message")} *</label>
                    <textarea name="message" rows={4} required placeholder={t("contact.message_placeholder")} value={form.message} onChange={handleChange}
                      style={{ ...inputStyle, resize: "vertical" }}
                      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--section-border)"; }} />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-sm font-semibold rounded flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)" }}
                    onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                  >
                    {submitting ? (
                      <><Loader2 size={14} className="animate-spin" />{t("contact.sending")}</>
                    ) : (
                      <><Send size={14} />{t("contact.send")}</>
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
