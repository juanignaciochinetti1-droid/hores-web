import { useState, useRef, useEffect } from "react";
import {
  Menu, X, Package, Sun, Moon, User, Briefcase, LogOut, LogIn,
  Factory, BookOpen, ShieldCheck, ShoppingCart, MessageSquare, ChevronDown,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", empleado: "Empleado", cliente: "Cliente" };

interface NavbarProps {
  activeSection: string;
}

export default function Navbar({ activeSection }: NavbarProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    if (dropOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropOpen]);

  const scrollTo = (id: string) => {
    if (location !== "/") {
      navigate("/");
    } else {
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
    }
    setMenuOpen(false);
    setDropOpen(false);
  };

  const goTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setDropOpen(false);
  };

  const navText = "var(--navbar-text)";
  const navHover = "var(--navbar-hover-color)";

  const mainSectionItems = [
    { id: "empresa",   label: t("nav.empresa"),   icon: Factory,       type: "section" as const },
    { id: "productos", label: t("nav.productos"),  icon: Package,       type: "section" as const },
    { id: "contacto",  label: t("nav.contacto"),   icon: MessageSquare, type: "section" as const },
  ];

  const mainPageItems = [
    { id: "compras", label: t("nav.compras"), icon: ShoppingCart, path: "/compras", type: "page" as const },
  ];

  const dropSectionItems = [
    { id: "trabajo", label: t("nav.trabajo"), icon: Briefcase, desc: "Sumate al equipo" },
  ];

  const dropPageItems = [
    { id: "historia", label: t("nav.historia"), icon: BookOpen,    path: "/historia", desc: "Nuestra trayectoria"   },
    { id: "calidad",  label: t("nav.calidad"),  icon: ShieldCheck, path: "/calidad",  desc: "Seriedad e inocuidad" },
  ];

  const isSectionActive = (id: string) => location === "/" && activeSection === id;
  const isPageActive    = (path: string) => location === path;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: "var(--navbar-solid-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--navbar-border)" }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-[72px] gap-4">

          {/* Logo */}
          <button onClick={() => scrollTo("empresa")} className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 flex items-center justify-center rounded" style={{ backgroundColor: "var(--navbar-logo-bg)" }}>
              <Package size={18} color="var(--navbar-logo-icon)" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "var(--navbar-text)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
                Hores
              </span>
              <span className="text-xs tracking-widest uppercase" style={{ color: "var(--navbar-hover-color)", fontFamily: "var(--font-body)", letterSpacing: "0.2em" }}>
                Cartotécnica
              </span>
            </div>
          </button>

          {/* Desktop nav: 4 main links + "Más" dropdown */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
            {mainSectionItems.map((item) => {
              const active = isSectionActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-150 uppercase"
                  style={{
                    color: active ? "var(--navbar-active-color)" : navText,
                    backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.07em",
                    fontSize: "0.75rem",
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = navHover; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.12)"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = navText; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; } }}
                >
                  {item.label}
                </button>
              );
            })}
            {mainPageItems.map((item) => {
              const active = isPageActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.path)}
                  className="px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-150 uppercase"
                  style={{
                    color: active ? "var(--navbar-active-color)" : navText,
                    backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.07em",
                    fontSize: "0.75rem",
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = navHover; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.12)"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = navText; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; } }}
                >
                  {item.label}
                </button>
              );
            })}

            {/* "Más" dropdown */}
            <div ref={dropRef} className="relative">
              <button
                onClick={() => setDropOpen((p) => !p)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 uppercase"
                style={{
                  color: dropOpen ? "var(--navbar-active-color)" : navText,
                  backgroundColor: dropOpen ? "rgba(255,255,255,0.18)" : "transparent",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.07em",
                  fontSize: "0.75rem",
                }}
                onMouseEnter={(e) => { if (!dropOpen) { (e.currentTarget as HTMLButtonElement).style.color = navHover; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.12)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = dropOpen ? "var(--navbar-active-color)" : navText; (e.currentTarget as HTMLButtonElement).style.backgroundColor = dropOpen ? "rgba(255,255,255,0.18)" : "transparent"; }}
              >
                Más
                <ChevronDown size={13} style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }} />
              </button>

              {dropOpen && (
                <div
                  className="absolute top-full mt-2 left-0 rounded-xl"
                  style={{
                    backgroundColor: "var(--section-card)",
                    border: "1px solid rgba(28,28,30,0.18)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
                    minWidth: "220px",
                    animation: "dropIn 0.18s cubic-bezier(0.23,1,0.32,1) forwards",
                  }}
                >
                  <div className="p-2">
                    {dropSectionItems.map((item) => {
                      const active = isSectionActive(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollTo(item.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                          style={{ backgroundColor: active ? "rgba(245,124,0,0.10)" : "transparent" }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: active ? "rgba(245,124,0,0.15)" : "var(--section-card-inner)" }}>
                            <item.icon size={14} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                          </div>
                          <div className="text-sm font-medium" style={{ color: active ? "var(--brand-orange)" : "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                            {item.label}
                          </div>
                        </button>
                      );
                    })}
                    {dropPageItems.map((item) => {
                      const active = isPageActive(item.path);
                      return (
                        <button
                          key={item.id}
                          onClick={() => goTo(item.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                          style={{ backgroundColor: active ? "rgba(245,124,0,0.10)" : "transparent" }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: active ? "rgba(245,124,0,0.15)" : "var(--section-card-inner)" }}>
                            <item.icon size={14} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                          </div>
                          <div className="text-sm font-medium" style={{ color: active ? "var(--brand-orange)" : "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                            {item.label}
                          </div>
                        </button>
                      );
                    })}
                    {(user?.role === "cliente" || user?.role === "admin" || user?.role === "empleado") && (
                      <div className="my-1 border-t" style={{ borderColor: "var(--section-border)" }} />
                    )}
                    {user?.role === "cliente" && (
                      <button
                        onClick={() => goTo("/portal")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                        style={{ backgroundColor: isPageActive("/portal") ? "rgba(245,124,0,0.10)" : "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      >
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--section-card-inner)" }}>
                          <User size={14} style={{ color: "var(--section-muted)" }} />
                        </div>
                        <div className="text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>Mi Portal</div>
                      </button>
                    )}
                    {(user?.role === "admin" || user?.role === "empleado") && (
                      <button
                        onClick={() => goTo("/empleados")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                        style={{ backgroundColor: isPageActive("/empleados") ? "rgba(245,124,0,0.10)" : "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      >
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--section-card-inner)" }}>
                          <Briefcase size={14} style={{ color: "var(--section-muted)" }} />
                        </div>
                        <div className="text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>Empleados</div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {user && <NotificationBell />}

            {user ? (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.20)", color: "var(--navbar-active-color)", fontFamily: "var(--font-body)" }}>
                  {ROLE_LABEL[user.role]}
                </span>
                <span className="text-xs font-medium max-w-[80px] truncate" style={{ color: navText, fontFamily: "var(--font-body)" }}>
                  {user.name.split(" ")[0]}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 rounded transition-all duration-200"
                  style={{ color: navText }}
                  title="Cerrar sesión"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navText; }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors duration-200"
                style={{ color: navText, fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navText; }}
              >
                <LogIn size={14} />
                Iniciar sesión
              </button>
            )}

            {/* Hamburger mobile */}
            <button
              className="md:hidden p-2 rounded"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ color: "var(--navbar-text)" }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded transition-all duration-200"
                style={{ color: navText }}
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navText; }}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu — grid de ítems */}
      {menuOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: "var(--section-bg)", borderColor: "var(--section-border)" }}>
          <div className="container py-4 grid grid-cols-2 gap-1">
            {mainSectionItems.map((item) => {
              const active = isSectionActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    color: active ? "var(--brand-orange)" : "var(--section-body)",
                    backgroundColor: active ? "rgba(245,124,0,0.08)" : "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <item.icon size={15} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                  {item.label}
                </button>
              );
            })}
            {mainPageItems.map((item) => {
              const active = isPageActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.path)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    color: active ? "var(--brand-orange)" : "var(--section-body)",
                    backgroundColor: active ? "rgba(245,124,0,0.08)" : "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <item.icon size={15} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                  {item.label}
                </button>
              );
            })}
            {dropSectionItems.map((item) => {
              const active = isSectionActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    color: active ? "var(--brand-orange)" : "var(--section-body)",
                    backgroundColor: active ? "rgba(245,124,0,0.08)" : "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <item.icon size={15} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                  {item.label}
                </button>
              );
            })}
            {dropPageItems.map((item) => {
              const active = isPageActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.path)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    color: active ? "var(--brand-orange)" : "var(--section-body)",
                    backgroundColor: active ? "rgba(245,124,0,0.08)" : "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <item.icon size={15} style={{ color: active ? "var(--brand-orange)" : "var(--section-muted)" }} />
                  {item.label}
                </button>
              );
            })}
            {user?.role === "cliente" && (
              <button onClick={() => goTo("/portal")} className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>
                <User size={15} style={{ color: "var(--section-muted)" }} /> Mi Portal
              </button>
            )}
            {(user?.role === "admin" || user?.role === "empleado") && (
              <button onClick={() => goTo("/empleados")} className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>
                <Briefcase size={15} style={{ color: "var(--section-muted)" }} /> Empleados
              </button>
            )}
          </div>
          <div className="container pb-4 pt-3 border-t" style={{ borderColor: "var(--section-border)" }}>
            {user ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{ color: "#ef4444", fontFamily: "var(--font-body)", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent" }}
              >
                <LogOut size={15} /> Cerrar sesión ({user.name.split(" ")[0]})
              </button>
            ) : (
              <button
                onClick={() => { navigate("/login"); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-body)", border: "1px solid rgba(245,124,0,0.4)", backgroundColor: "rgba(245,124,0,0.06)" }}
              >
                <LogIn size={15} /> Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </header>
  );
}
