import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

const LANGS = [
  { code: "es", label: "Español", flag: "ar" },
  { code: "en", label: "English", flag: "us" },
  { code: "pt", label: "Português", flag: "br" },
  { code: "it", label: "Italiano", flag: "it" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 200 }}>
      {open && (
        <div
          className="mb-2 rounded-lg overflow-hidden"
          style={{
            backgroundColor: "var(--section-card)",
            border: "1px solid var(--section-border)",
            boxShadow: "var(--card-shadow)",
            animation: "langMenuIn 0.18s cubic-bezier(0.23, 1, 0.32, 1) forwards",
          }}
        >
          {LANGS.map((lang) => {
            const isActive = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100"
                style={{
                  backgroundColor: isActive ? "rgba(245, 124, 0, 0.08)" : "transparent",
                  color: isActive ? "var(--brand-orange)" : "var(--section-body)",
                  fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: "1px solid var(--section-border)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <img
                  src={`https://flagcdn.com/w40/${lang.flag}.png`}
                  alt={lang.label}
                  width={22}
                  height={16}
                  className="rounded-sm flex-shrink-0"
                  style={{ objectFit: "cover", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }}
                />
                <span>{lang.label}</span>
                {isActive && (
                  <span
                    className="ml-auto text-xs"
                    style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 active:scale-95"
        style={{
          backgroundColor: "var(--brand-orange)",
          color: "#fff",
          fontFamily: "var(--font-body)",
          boxShadow: "0 4px 16px rgba(245, 124, 0, 0.35)",
          border: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)";
        }}
        aria-label="Cambiar idioma / Change language"
      >
        <Languages size={16} />
        <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
          {current.code.toUpperCase()}
        </span>
      </button>

      <style>{`
        @keyframes langMenuIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
