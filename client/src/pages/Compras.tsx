import { useEffect } from "react";
import { Package, ArrowLeft, Sun, Moon } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import ComprasSection from "@/components/sections/ComprasSection";
import CotizadorSection from "@/components/sections/CotizadorSection";

export default function Compras() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const search = useSearch();
  const initialProductId = new URLSearchParams(search).get("producto") ?? undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

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
                Volver
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
              <span className="text-xs font-medium tracking-[0.18em] uppercase hidden sm:block" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                Realizar pedido
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

      <ComprasSection initialProductId={initialProductId} />
      <CotizadorSection />
    </div>
  );
}
