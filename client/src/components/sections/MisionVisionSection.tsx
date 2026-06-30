import { useRef, useState, useEffect } from "react";
import { Target, Eye, MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

type Card = { titleKey: string; textKey: string; iconName: "Target" | "Eye" };

const DEFAULTS: Card[] = [
  { iconName: "Target", titleKey: "historia.mission_title", textKey: "historia.mission_text" },
  { iconName: "Eye",    titleKey: "historia.vision_title",  textKey: "historia.vision_text"  },
];

const ICONS = { Target, Eye };

const LS_KEY = "hores_mision_vision";

function loadCards(t: (k: string) => string): { title: string; text: string; iconName: "Target" | "Eye" }[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULTS.map((d) => ({ title: t(d.titleKey), text: t(d.textKey), iconName: d.iconName }));
}

export default function MisionVisionSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  const [cards, setCards] = useState(() => loadCards(t));
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", text: "" });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClick = () => setMenuOpenIdx(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function save(next: typeof cards) {
    setCards(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function openEdit(i: number) {
    setEditForm({ title: cards[i].title, text: cards[i].text });
    setEditingIdx(i);
    setMenuOpenIdx(null);
  }

  function confirmEdit() {
    if (editingIdx === null) return;
    save(cards.map((c, i) => i === editingIdx ? { ...c, title: editForm.title, text: editForm.text } : c));
    setEditingIdx(null);
  }

  function handleDelete(i: number) {
    save(cards.filter((_, idx) => idx !== i));
    setMenuOpenIdx(null);
  }

  if (cards.length === 0) return null;

  return (
    <section ref={ref} style={{ backgroundColor: "var(--section-bg)" }}>
      <div className="container py-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map((card, i) => {
            const Icon = ICONS[card.iconName];
            const isEditing = isAdmin && editingIdx === i;
            const isMenuOpen = menuOpenIdx === i;

            return (
              <div
                key={i}
                className="rounded-lg p-7 relative"
                style={{
                  backgroundColor: "var(--section-card)",
                  border: "1px solid var(--section-border)",
                  boxShadow: "var(--card-shadow)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.55s ease ${i * 120}ms, transform 0.55s ease ${i * 120}ms`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(245, 124, 0, 0.15)" }}>
                      <Icon size={18} style={{ color: "var(--brand-orange)" }} />
                    </div>
                    {isEditing ? (
                      <input
                        className="text-lg font-bold bg-transparent border-b outline-none"
                        style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)", borderColor: "var(--brand-orange)" }}
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    ) : (
                      <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                        {card.title}
                      </h3>
                    )}
                  </div>

                  {/* Admin menu */}
                  {isAdmin && !isEditing && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenIdx(isMenuOpen ? null : i)}
                        className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                        style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                      >
                        <MoreVertical size={14} />
                      </button>
                      {isMenuOpen && (
                        <div
                          className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                          style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}
                        >
                          <button
                            onClick={() => openEdit(i)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                          >
                            <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                          </button>
                          <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                          <button
                            onClick={() => handleDelete(i)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                            style={{ color: "oklch(0.70 0.15 20)", fontFamily: "var(--font-body)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                          >
                            <Trash2 size={11} /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit confirm/cancel */}
                  {isAdmin && isEditing && (
                    <div className="flex gap-1">
                      <button onClick={confirmEdit} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "var(--brand-orange)" }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingIdx(null)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "var(--section-muted)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Body */}
                {isEditing ? (
                  <textarea
                    className="w-full text-sm leading-relaxed bg-transparent border rounded outline-none resize-none p-2"
                    style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300, borderColor: "var(--section-border)", minHeight: "80px" }}
                    value={editForm.text}
                    onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                    {card.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
