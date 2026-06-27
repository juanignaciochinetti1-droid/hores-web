import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Package,
  ArrowLeft,
  Sun,
  Moon,
  Target,
  Eye,
  Heart,
  Zap,
  Shield,
  Users,
  Globe,
  Factory,
  Award,
  Calendar,
  TrendingUp,
  CheckCircle,
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Datos (keys, sin strings hardcodeados) ────────────── */

const TIMELINE_KEYS = [
  { year: "2001", key: "tl_2001" },
  { year: "2005", key: "tl_2005" },
  { year: "2009", key: "tl_2009" },
  { year: "2013", key: "tl_2013" },
  { year: "2017", key: "tl_2017" },
  { year: "2021", key: "tl_2021" },
  { year: "2024", key: "tl_2024" },
];

const VALORES_ICONS = [
  { icon: Shield,     key: "precision",  iconName: "Shield"     },
  { icon: Heart,      key: "compromiso", iconName: "Heart"      },
  { icon: Zap,        key: "agilidad",   iconName: "Zap"        },
  { icon: Users,      key: "cercania",   iconName: "Users"      },
  { icon: TrendingUp, key: "mejora",     iconName: "TrendingUp" },
  { icon: Award,      key: "calidad",    iconName: "Award"      },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Heart, Zap, Users, TrendingUp, Award,
  Target, Eye, Globe, Factory, Package, Calendar, CheckCircle,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

const SECTORES_KEYS = [
  { key: "s_alimentario",  pct: 38, color: "var(--brand-orange)" },
  { key: "s_farmaceutico", pct: 22, color: "oklch(0.65 0.18 160)" },
  { key: "s_cosmetica",    pct: 18, color: "oklch(0.65 0.15 300)" },
  { key: "s_industrial",   pct: 14, color: "oklch(0.65 0.15 220)" },
  { key: "s_otros",        pct: 8,  color: "oklch(0.55 0.01 285)" },
];

const SECTOR_COLORS = [
  "var(--brand-orange)",
  "oklch(0.65 0.18 160)",
  "oklch(0.65 0.15 300)",
  "oklch(0.65 0.15 220)",
  "oklch(0.55 0.01 285)",
  "oklch(0.65 0.15 20)",
];

const CLIENTES = [
  { name: "Smurfit Kappa Argentina", sector: "Embalaje corrugado" },
  { name: "Tetra Pak Argentina", sector: "Envases asépticos" },
  { name: "Bagley", sector: "Alimentos y snacks" },
  { name: "Laboratorio Roemmers", sector: "Farmacéutica" },
  { name: "Molinos Río de la Plata", sector: "Agroindustria" },
  { name: "Laboratorios Bago", sector: "Farmacéutica" },
  { name: "Arcor", sector: "Confitería / Alimentos" },
  { name: "Natura Cosméticos", sector: "Cosmética" },
  { name: "La Serenísima", sector: "Lácteos" },
  { name: "Johnson & Johnson AR", sector: "Salud y cuidado" },
  { name: "Quilmes Industrial", sector: "Bebidas" },
  { name: "Unilever Argentina", sector: "Consumo masivo" },
];

const PAISES = [
  { name: "Argentina", code: "ar", mainMarket: true },
  { name: "Bolivia",   code: "bo", mainMarket: false },
  { name: "Chile",     code: "cl", mainMarket: false },
  { name: "Colombia",  code: "co", mainMarket: false },
  { name: "Ecuador",   code: "ec", mainMarket: false },
  { name: "Uruguay",   code: "uy", mainMarket: false },
  { name: "México",    code: "mx", mainMarket: false },
  { name: "Paraguay",  code: "py", mainMarket: false },
];

const OBJETIVOS_ICONS = [
  { icon: Globe,    key: "obj_expansion",  iconName: "Globe"    },
  { icon: Factory,  key: "obj_planta",     iconName: "Factory"  },
  { icon: Zap,      key: "obj_industria40",iconName: "Zap"      },
  { icon: Award,    key: "obj_iso14001",   iconName: "Award"    },
];

/* ─── Componente auxiliar: fade-in section ───────────────── */

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
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

/* ─── Página principal ───────────────────────────────────── */

export default function Historia() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [timeline, setTimeline] = useState<{ year: string; title: string; description: string }[]>(() => {
    try {
      const stored = localStorage.getItem("hores_timeline");
      if (stored) return JSON.parse(stored);
    } catch {}
    return TIMELINE_KEYS.map((item) => ({
      year: item.year,
      title: t(`historia.${item.key}_title`),
      description: t(`historia.${item.key}_desc`),
    }));
  });

  const latestYear = timeline.reduce((max, item) => (Number(item.year) > Number(max) ? item.year : max), "0");

  const saveTimeline = (updated: typeof timeline) => {
    const sorted = [...updated].sort((a, b) => Number(a.year) - Number(b.year));
    setTimeline(sorted);
    localStorage.setItem("hores_timeline", JSON.stringify(sorted));
  };

  const [addingEntry, setAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ year: "", title: "", description: "" });
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ year: "", title: "", description: "" });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenIdx(null);
    };
    if (menuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenIdx]);

  const handleAddEntry = () => {
    if (!newEntry.year.trim() || !newEntry.title.trim() || !newEntry.description.trim()) return;
    saveTimeline([...timeline, { year: newEntry.year.trim(), title: newEntry.title.trim(), description: newEntry.description.trim() }]);
    setNewEntry({ year: "", title: "", description: "" });
    setAddingEntry(false);
  };

  const handleDeleteEntry = (idx: number) => {
    saveTimeline(timeline.filter((_, i) => i !== idx));
    setMenuOpenIdx(null);
  };

  const openEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ year: timeline[idx].year, title: timeline[idx].title, description: timeline[idx].description });
    setMenuOpenIdx(null);
  };

  const handleSaveEdit = () => {
    if (!editForm.year.trim() || !editForm.title.trim() || !editForm.description.trim() || editingIdx === null) return;
    saveTimeline(timeline.map((item, i) => i === editingIdx ? { year: editForm.year.trim(), title: editForm.title.trim(), description: editForm.description.trim() } : item));
    setEditingIdx(null);
  };

  type ValorEntry = { iconName: string; title: string; description: string };

  const [valores, setValores] = useState<ValorEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_valores");
      if (stored) return JSON.parse(stored);
    } catch {}
    return VALORES_ICONS.map((item) => ({
      iconName: item.iconName,
      title: t(`historia.v_${item.key}_title`),
      description: t(`historia.v_${item.key}_desc`),
    }));
  });

  const [valorMenuOpenIdx, setValorMenuOpenIdx] = useState<number | null>(null);
  const [editingValorIdx, setEditingValorIdx] = useState<number | null>(null);
  const [editValorForm, setEditValorForm] = useState<ValorEntry>({ iconName: "Shield", title: "", description: "" });
  const [addingValor, setAddingValor] = useState(false);
  const [newValor, setNewValor] = useState<ValorEntry>({ iconName: "Shield", title: "", description: "" });
  const valorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (valorMenuRef.current && !valorMenuRef.current.contains(e.target as Node)) setValorMenuOpenIdx(null);
    };
    if (valorMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [valorMenuOpenIdx]);

  const saveValores = (updated: ValorEntry[]) => {
    setValores(updated);
    localStorage.setItem("hores_valores", JSON.stringify(updated));
  };

  const handleAddValor = () => {
    if (!newValor.title.trim() || !newValor.description.trim()) return;
    saveValores([...valores, { iconName: newValor.iconName, title: newValor.title.trim(), description: newValor.description.trim() }]);
    setNewValor({ iconName: "Shield", title: "", description: "" });
    setAddingValor(false);
  };

  const handleDeleteValor = (idx: number) => {
    saveValores(valores.filter((_, i) => i !== idx));
    setValorMenuOpenIdx(null);
  };

  const openEditValor = (idx: number) => {
    setEditingValorIdx(idx);
    setEditValorForm({ ...valores[idx] });
    setValorMenuOpenIdx(null);
  };

  const handleSaveValor = () => {
    if (!editValorForm.title.trim() || !editValorForm.description.trim() || editingValorIdx === null) return;
    saveValores(valores.map((v, i) => i === editingValorIdx ? { ...editValorForm, title: editValorForm.title.trim(), description: editValorForm.description.trim() } : v));
    setEditingValorIdx(null);
  };

  type ClienteEntry = { name: string; sector: string };

  const [clientes, setClientes] = useState<ClienteEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_clientes");
      if (stored) return JSON.parse(stored);
    } catch {}
    return CLIENTES;
  });

  const [clientMenuOpenIdx, setClientMenuOpenIdx] = useState<number | null>(null);
  const [editingClientIdx, setEditingClientIdx] = useState<number | null>(null);
  const [editClientForm, setEditClientForm] = useState<ClienteEntry>({ name: "", sector: "" });
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState<ClienteEntry>({ name: "", sector: "" });
  const clientMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (clientMenuRef.current && !clientMenuRef.current.contains(e.target as Node)) setClientMenuOpenIdx(null);
    };
    if (clientMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clientMenuOpenIdx]);

  const saveClientes = (updated: ClienteEntry[]) => {
    setClientes(updated);
    localStorage.setItem("hores_clientes", JSON.stringify(updated));
  };

  const handleAddClient = () => {
    if (!newClient.name.trim() || !newClient.sector.trim()) return;
    saveClientes([...clientes, { name: newClient.name.trim(), sector: newClient.sector.trim() }]);
    setNewClient({ name: "", sector: "" });
    setAddingClient(false);
  };

  const handleDeleteClient = (idx: number) => {
    saveClientes(clientes.filter((_, i) => i !== idx));
    setClientMenuOpenIdx(null);
  };

  const openEditClient = (idx: number) => {
    setEditingClientIdx(idx);
    setEditClientForm({ ...clientes[idx] });
    setClientMenuOpenIdx(null);
  };

  const handleSaveClient = () => {
    if (!editClientForm.name.trim() || !editClientForm.sector.trim() || editingClientIdx === null) return;
    saveClientes(clientes.map((c, i) => i === editingClientIdx ? { name: editClientForm.name.trim(), sector: editClientForm.sector.trim() } : c));
    setEditingClientIdx(null);
  };

  type PaisEntry = { name: string; code: string; mainMarket: boolean };

  const [paises, setPaises] = useState<PaisEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_paises");
      if (stored) return JSON.parse(stored);
    } catch {}
    return PAISES;
  });

  const [paisMenuOpenIdx, setPaisMenuOpenIdx] = useState<number | null>(null);
  const [editingPaisIdx, setEditingPaisIdx] = useState<number | null>(null);
  const [editPaisForm, setEditPaisForm] = useState<PaisEntry>({ name: "", code: "", mainMarket: false });
  const [addingPais, setAddingPais] = useState(false);
  const [newPais, setNewPais] = useState<PaisEntry>({ name: "", code: "", mainMarket: false });
  const paisMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (paisMenuRef.current && !paisMenuRef.current.contains(e.target as Node)) setPaisMenuOpenIdx(null);
    };
    if (paisMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [paisMenuOpenIdx]);

  const savePaises = (updated: PaisEntry[]) => {
    setPaises(updated);
    localStorage.setItem("hores_paises", JSON.stringify(updated));
  };

  const handleAddPais = () => {
    if (!newPais.name.trim() || newPais.code.trim().length !== 2) return;
    savePaises([...paises, { name: newPais.name.trim(), code: newPais.code.trim().toLowerCase(), mainMarket: newPais.mainMarket }]);
    setNewPais({ name: "", code: "", mainMarket: false });
    setAddingPais(false);
  };

  const handleDeletePais = (idx: number) => {
    savePaises(paises.filter((_, i) => i !== idx));
    setPaisMenuOpenIdx(null);
  };

  const openEditPais = (idx: number) => {
    setEditingPaisIdx(idx);
    setEditPaisForm({ ...paises[idx] });
    setPaisMenuOpenIdx(null);
  };

  const handleSavePais = () => {
    if (!editPaisForm.name.trim() || editPaisForm.code.trim().length !== 2 || editingPaisIdx === null) return;
    savePaises(paises.map((p, i) => i === editingPaisIdx ? { name: editPaisForm.name.trim(), code: editPaisForm.code.trim().toLowerCase(), mainMarket: editPaisForm.mainMarket } : p));
    setEditingPaisIdx(null);
  };

  type SectorEntry = { label: string; pct: number; color: string };

  const [sectores, setSectores] = useState<SectorEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_sectores");
      if (stored) return JSON.parse(stored);
    } catch {}
    return SECTORES_KEYS.map((item) => ({
      label: t(`historia.${item.key}`),
      pct: item.pct,
      color: item.color,
    }));
  });

  const [sectorMenuOpenIdx, setSectorMenuOpenIdx] = useState<number | null>(null);
  const [editingSectorIdx, setEditingSectorIdx] = useState<number | null>(null);
  const [editSectorForm, setEditSectorForm] = useState<SectorEntry>({ label: "", pct: 10, color: SECTOR_COLORS[0] });
  const [addingSector, setAddingSector] = useState(false);
  const [newSector, setNewSector] = useState<SectorEntry>({ label: "", pct: 10, color: SECTOR_COLORS[0] });
  const sectorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sectorMenuRef.current && !sectorMenuRef.current.contains(e.target as Node)) setSectorMenuOpenIdx(null);
    };
    if (sectorMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sectorMenuOpenIdx]);

  const saveSectores = (updated: SectorEntry[]) => {
    setSectores(updated);
    localStorage.setItem("hores_sectores", JSON.stringify(updated));
  };

  const handleAddSector = () => {
    if (!newSector.label.trim() || newSector.pct < 1 || newSector.pct > 100) return;
    saveSectores([...sectores, { label: newSector.label.trim(), pct: newSector.pct, color: newSector.color }]);
    setNewSector({ label: "", pct: 10, color: SECTOR_COLORS[0] });
    setAddingSector(false);
  };

  const handleDeleteSector = (idx: number) => {
    saveSectores(sectores.filter((_, i) => i !== idx));
    setSectorMenuOpenIdx(null);
  };

  const openEditSector = (idx: number) => {
    setEditingSectorIdx(idx);
    setEditSectorForm({ ...sectores[idx] });
    setSectorMenuOpenIdx(null);
  };

  const handleSaveSector = () => {
    if (!editSectorForm.label.trim() || editSectorForm.pct < 1 || editSectorForm.pct > 100 || editingSectorIdx === null) return;
    saveSectores(sectores.map((s, i) => i === editingSectorIdx ? { label: editSectorForm.label.trim(), pct: editSectorForm.pct, color: editSectorForm.color } : s));
    setEditingSectorIdx(null);
  };

  type ObjetivoEntry = { iconName: string; title: string; description: string };

  const [objetivos, setObjetivos] = useState<ObjetivoEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hores_objetivos");
      if (stored) return JSON.parse(stored);
    } catch {}
    return OBJETIVOS_ICONS.map((item) => ({
      iconName: item.iconName,
      title: t(`historia.${item.key}_title`),
      description: t(`historia.${item.key}_desc`),
    }));
  });

  const [objMenuOpenIdx, setObjMenuOpenIdx] = useState<number | null>(null);
  const [editingObjIdx, setEditingObjIdx] = useState<number | null>(null);
  const [editObjForm, setEditObjForm] = useState<ObjetivoEntry>({ iconName: "Globe", title: "", description: "" });
  const [addingObj, setAddingObj] = useState(false);
  const [newObj, setNewObj] = useState<ObjetivoEntry>({ iconName: "Globe", title: "", description: "" });
  const objMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (objMenuRef.current && !objMenuRef.current.contains(e.target as Node)) setObjMenuOpenIdx(null);
    };
    if (objMenuOpenIdx !== null) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [objMenuOpenIdx]);

  const saveObjetivos = (updated: ObjetivoEntry[]) => {
    setObjetivos(updated);
    localStorage.setItem("hores_objetivos", JSON.stringify(updated));
  };

  const handleAddObj = () => {
    if (!newObj.title.trim() || !newObj.description.trim()) return;
    saveObjetivos([...objetivos, { iconName: newObj.iconName, title: newObj.title.trim(), description: newObj.description.trim() }]);
    setNewObj({ iconName: "Globe", title: "", description: "" });
    setAddingObj(false);
  };

  const handleDeleteObj = (idx: number) => {
    saveObjetivos(objetivos.filter((_, i) => i !== idx));
    setObjMenuOpenIdx(null);
  };

  const openEditObj = (idx: number) => {
    setEditingObjIdx(idx);
    setEditObjForm({ ...objetivos[idx] });
    setObjMenuOpenIdx(null);
  };

  const handleSaveObj = () => {
    if (!editObjForm.title.trim() || !editObjForm.description.trim() || editingObjIdx === null) return;
    saveObjetivos(objetivos.map((o, i) => i === editingObjIdx ? { ...editObjForm, title: editObjForm.title.trim(), description: editObjForm.description.trim() } : o));
    setEditingObjIdx(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
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
              <span className="text-xs font-medium tracking-[0.18em] uppercase hidden sm:block" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.eyebrow")}
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

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.10 0.008 285) 0%, oklch(0.14 0.006 285) 60%, oklch(0.12 0.010 42 / 0.3) 100%)",
          borderBottom: "1px solid var(--section-border)",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(var(--brand-orange) 1px, transparent 1px), linear-gradient(90deg, var(--brand-orange) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.25em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.hero_eyebrow")}
              </span>
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold leading-[1.05] mb-5"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.97 0.01 85)" }}
            >
              {t("historia.hero_h1")}{" "}
              <span style={{ color: "var(--brand-orange)", fontStyle: "italic" }}>{t("historia.hero_h1_accent")}</span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: "oklch(0.75 0.01 85)", fontFamily: "var(--font-body)", fontWeight: 300, maxWidth: "520px" }}
            >
              {t("historia.hero_subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats rápidas ───────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--section-border)", backgroundColor: "var(--section-bg-alt)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "var(--section-border)" }}>
            {[
              { icon: Calendar, value: "+20",  label: t("historia.stat_years") },
              { icon: Factory,  value: "+500", label: t("historia.stat_molds_year") },
              { icon: Users,    value: "+150", label: t("historia.stat_clients") },
              { icon: Globe,    value: "6",    label: t("historia.stat_countries") },
            ].map((stat, i) => (
              <div key={i} className="py-6 px-6 flex items-center gap-3" style={{ borderColor: "var(--section-border)" }}>
                <stat.icon size={18} style={{ color: "var(--brand-orange)", flexShrink: 0 }} />
                <div>
                  <div className="text-2xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-20 space-y-24">

        {/* ── Timeline ────────────────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.timeline_eyebrow")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                {t("historia.timeline_title")}
              </h2>
              {isAdmin && !addingEntry && (
                <button
                  onClick={() => setAddingEntry(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nueva fecha
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Línea vertical */}
            <div
              className="absolute left-[88px] top-0 bottom-0 w-px hidden md:block"
              style={{ backgroundColor: "var(--section-border)" }}
            />
            <div className="space-y-0">
              {timeline.map((item, i) => {
                const isLatest = item.year === latestYear;
                const isEditing = isAdmin && editingIdx === i;
                const isMenuOpen = menuOpenIdx === i;
                return (
                <div key={i} style={{ position: "relative", zIndex: menuOpenIdx === i ? 50 : 0 }}>
                <RevealSection delay={i * 60}>
                  <div className="relative flex gap-6 md:gap-8 pb-8 last:pb-0">
                    {/* Año + dot */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-0 w-16 md:w-[88px] pt-0.5">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ fontFamily: "var(--font-mono)", color: isLatest ? "var(--brand-orange)" : "var(--section-muted)" }}
                      >
                        {item.year}
                      </span>
                    </div>
                    {/* Dot on line */}
                    <div
                      className="absolute hidden md:flex left-[84px] top-1 w-2 h-2 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isLatest ? "var(--brand-orange)" : "var(--section-border)",
                        outline: isLatest ? "3px solid rgba(245, 124, 0, 0.25)" : "none",
                      }}
                    />
                    {/* Card */}
                    {isEditing ? (
                      <div
                        className="flex-1 rounded-lg p-4 space-y-3"
                        style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}
                      >
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar entrada</p>
                        <input
                          type="number"
                          value={editForm.year}
                          onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))}
                          placeholder="Año"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                        />
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Título"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                        />
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Descripción"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                        />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded transition-colors"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-heading)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; }}
                          >
                            <X size={13} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSaveEdit}
                            disabled={!editForm.year || !editForm.title || !editForm.description}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded transition-all active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editForm.year || !editForm.title || !editForm.description) ? 0.5 : 1 }}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex-1 rounded-lg p-4 relative"
                        style={{
                          backgroundColor: "var(--section-card)",
                          border: `1px solid ${isLatest ? "rgba(245, 124, 0, 0.35)" : "var(--section-border)"}`,
                          boxShadow: "var(--card-shadow)",
                        }}
                      >
                        <p className="text-sm font-semibold mb-1 pr-8" style={{ color: isLatest ? "var(--brand-orange)" : "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                          {item.title}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                          {item.description}
                        </p>
                        {/* Three-dot menu (admin only) */}
                        {isAdmin && (
                          <div
                            className="absolute top-2.5 right-2.5"
                            ref={isMenuOpen ? menuRef : undefined}
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                  onClick={() => handleDeleteEntry(i)}
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
                      </div>
                    )}
                  </div>
                </RevealSection>
                </div>
                );
              })}

              {/* Formulario para agregar nueva fecha (solo admin) */}
              {isAdmin && addingEntry && (
                <div className="relative flex gap-6 md:gap-8 pb-8">
                  <div className="flex-shrink-0 w-16 md:w-[88px]" />
                  <div
                    className="flex-1 rounded-lg p-4 space-y-3"
                    style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}
                  >
                    <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                      Nueva entrada
                    </p>
                    <input
                      type="number"
                      placeholder="Año (ej: 2025)"
                      value={newEntry.year}
                      onChange={(e) => setNewEntry((p) => ({ ...p, year: e.target.value }))}
                      style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                    <input
                      placeholder="Título"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
                      style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                    <textarea
                      rows={3}
                      placeholder="Descripción"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
                      style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setAddingEntry(false); setNewEntry({ year: "", title: "", description: "" }); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded transition-colors"
                        style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-heading)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; }}
                      >
                        <X size={13} /> Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddEntry}
                        disabled={!newEntry.year || !newEntry.title || !newEntry.description}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded transition-all active:scale-95"
                        style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newEntry.year || !newEntry.title || !newEntry.description) ? 0.5 : 1 }}
                      >
                        <Plus size={13} /> Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </RevealSection>

        {/* ── Misión / Visión ─────────────────────────────── */}
        <RevealSection>
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="rounded-lg p-7"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(245, 124, 0, 0.15)" }}>
                  <Target size={18} style={{ color: "var(--brand-orange)" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("historia.mission_title")}
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                {t("historia.mission_text")}
              </p>
            </div>
            <div
              className="rounded-lg p-7"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(245, 124, 0, 0.15)" }}>
                  <Eye size={18} style={{ color: "var(--brand-orange)" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("historia.vision_title")}
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                {t("historia.vision_text")}
              </p>
            </div>
          </div>
        </RevealSection>

        {/* ── Valores ─────────────────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.values_eyebrow")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                {t("historia.values_title")}
              </h2>
              {isAdmin && !addingValor && (
                <button
                  onClick={() => setAddingValor(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nuevo valor
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {valores.map((v, i) => {
              const IconComp = ICON_MAP[v.iconName] ?? Shield;
              const isValorMenuOpen = valorMenuOpenIdx === i;
              const isValorEditing = isAdmin && editingValorIdx === i;
              return (
                <div key={i} style={{ position: "relative", zIndex: isValorMenuOpen ? 50 : 0 }}>
                  <RevealSection delay={i * 50}>
                    {isValorEditing ? (
                      <div
                        className="rounded-lg p-5 space-y-3"
                        style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}
                      >
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar valor</p>
                        {/* Icon picker */}
                        <div>
                          <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ICON_OPTIONS.map((name) => {
                              const Ic = ICON_MAP[name];
                              return (
                                <button key={name} type="button" onClick={() => setEditValorForm((p) => ({ ...p, iconName: name }))}
                                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                                  style={{ backgroundColor: editValorForm.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${editValorForm.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}
                                >
                                  <Ic size={14} style={{ color: editValorForm.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <input value={editValorForm.title} onChange={(e) => setEditValorForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <textarea rows={3} value={editValorForm.description} onChange={(e) => setEditValorForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingValorIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={13} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSaveValor} disabled={!editValorForm.title || !editValorForm.description}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editValorForm.title || !editValorForm.description) ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg p-5 h-full relative"
                        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
                      >
                        <div className="flex items-center gap-3 mb-3 pr-7">
                          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(245, 124, 0, 0.12)" }}>
                            <IconComp size={16} style={{ color: "var(--brand-orange)" }} />
                          </div>
                          <h4 className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                            {v.title}
                          </h4>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                          {v.description}
                        </p>
                        {/* Three-dot menu (admin only) */}
                        {isAdmin && (
                          <div
                            className="absolute top-2.5 right-2.5"
                            ref={isValorMenuOpen ? valorMenuRef : undefined}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button onClick={() => setValorMenuOpenIdx(isValorMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isValorMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditValor(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeleteValor(i)}
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
                  </RevealSection>
                </div>
              );
            })}

            {/* Formulario nuevo valor */}
            {isAdmin && addingValor && (
              <div className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo valor</p>
                {/* Icon picker */}
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((name) => {
                      const Ic = ICON_MAP[name];
                      return (
                        <button key={name} type="button" onClick={() => setNewValor((p) => ({ ...p, iconName: name }))}
                          className="w-8 h-8 rounded flex items-center justify-center transition-all"
                          style={{ backgroundColor: newValor.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${newValor.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                          <Ic size={14} style={{ color: newValor.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input value={newValor.title} onChange={(e) => setNewValor((p) => ({ ...p, title: e.target.value }))} placeholder="Título"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <textarea rows={3} value={newValor.description} onChange={(e) => setNewValor((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setAddingValor(false); setNewValor({ iconName: "Shield", title: "", description: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded"
                    style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                    <X size={13} /> Cancelar
                  </button>
                  <button type="button" onClick={handleAddValor} disabled={!newValor.title || !newValor.description}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newValor.title || !newValor.description) ? 0.5 : 1 }}>
                    <Plus size={13} /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </RevealSection>

        {/* ── Sectores ────────────────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.sectors_eyebrow")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                {t("historia.sectors_title")}
              </h2>
              {isAdmin && !addingSector && (
                <button
                  onClick={() => setAddingSector(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nuevo sector
                </button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div
              className="rounded-lg p-5"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
            >
              <div className="space-y-5">
                {sectores.map((s, i) => {
                  const isSectorMenuOpen = sectorMenuOpenIdx === i;
                  const isSectorEditing = isAdmin && editingSectorIdx === i;
                  return (
                    <div key={i} style={{ position: "relative", zIndex: isSectorMenuOpen ? 50 : 0 }}>
                      <RevealSection delay={i * 60}>
                        {isSectorEditing ? (
                          <div className="flex flex-col gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--section-card-inner)", border: "1px dashed var(--brand-orange)" }}>
                            <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar sector</p>
                            <input
                              value={editSectorForm.label}
                              onChange={(e) => setEditSectorForm((p) => ({ ...p, label: e.target.value }))}
                              placeholder="Nombre del sector"
                              style={{ width: "100%", backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                              onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                            />
                            <div className="flex gap-2 items-center">
                              <input
                                type="number" min={1} max={100}
                                value={editSectorForm.pct}
                                onChange={(e) => setEditSectorForm((p) => ({ ...p, pct: Number(e.target.value) }))}
                                style={{ width: "72px", backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-mono)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none", textAlign: "center" }}
                                onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                                onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                              />
                              <span className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>%</span>
                            </div>
                            <div>
                              <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Color</p>
                              <div className="flex gap-2 flex-wrap">
                                {SECTOR_COLORS.map((color) => (
                                  <button key={color} type="button" onClick={() => setEditSectorForm((p) => ({ ...p, color }))}
                                    className="w-7 h-7 rounded-full transition-all"
                                    style={{ backgroundColor: color, outline: editSectorForm.color === color ? "2px solid var(--brand-orange)" : "2px solid transparent", outlineOffset: "2px", cursor: "pointer" }} />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setEditingSectorIdx(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                                style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                                <X size={12} /> Cancelar
                              </button>
                              <button type="button" onClick={handleSaveSector} disabled={!editSectorForm.label || editSectorForm.pct < 1 || editSectorForm.pct > 100}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                                style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editSectorForm.label || editSectorForm.pct < 1 || editSectorForm.pct > 100) ? 0.5 : 1 }}>
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="flex items-center justify-between mb-2" style={{ paddingRight: isAdmin ? "28px" : "0" }}>
                              <span className="text-sm font-medium" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>
                                {s.label}
                              </span>
                              <span className="text-sm font-bold tabular-nums" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>
                                {s.pct}%
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(109, 76, 65, 0.12)" }}>
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                            </div>
                            {isAdmin && (
                              <div className="absolute top-0 right-0" ref={isSectorMenuOpen ? sectorMenuRef : undefined} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setSectorMenuOpenIdx(isSectorMenuOpen ? null : i)}
                                  className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                                  style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                                  <MoreVertical size={14} />
                                </button>
                                {isSectorMenuOpen && (
                                  <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                    style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                    <button onClick={() => openEditSector(i)}
                                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                      style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                      <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                    </button>
                                    <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                    <button onClick={() => handleDeleteSector(i)}
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
                      </RevealSection>
                    </div>
                  );
                })}

                {/* Formulario nuevo sector */}
                {isAdmin && addingSector && (
                  <div className="flex flex-col gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--section-card-inner)", border: "1px dashed var(--brand-orange)" }}>
                    <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo sector</p>
                    <input
                      value={newSector.label}
                      onChange={(e) => setNewSector((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Nombre del sector"
                      style={{ width: "100%", backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number" min={1} max={100}
                        value={newSector.pct}
                        onChange={(e) => setNewSector((p) => ({ ...p, pct: Number(e.target.value) }))}
                        style={{ width: "72px", backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-mono)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none", textAlign: "center" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }}
                      />
                      <span className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>%</span>
                    </div>
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {SECTOR_COLORS.map((color) => (
                          <button key={color} type="button" onClick={() => setNewSector((p) => ({ ...p, color }))}
                            className="w-7 h-7 rounded-full transition-all"
                            style={{ backgroundColor: color, outline: newSector.color === color ? "2px solid var(--brand-orange)" : "2px solid transparent", outlineOffset: "2px", cursor: "pointer" }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setAddingSector(false); setNewSector({ label: "", pct: 10, color: SECTOR_COLORS[0] }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                        style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                        <X size={12} /> Cancelar
                      </button>
                      <button type="button" onClick={handleAddSector} disabled={!newSector.label || newSector.pct < 1 || newSector.pct > 100}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                        style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newSector.label || newSector.pct < 1 || newSector.pct > 100) ? 0.5 : 1 }}>
                        <Plus size={12} /> Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
            >
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                {t("historia.sectors_text")}
              </p>
              <div className="space-y-2">
                {[
                  t("historia.sectors_b1"),
                  t("historia.sectors_b2"),
                  t("historia.sectors_b3"),
                  t("historia.sectors_b4"),
                  t("historia.sectors_b5"),
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--brand-orange)" }} />
                    <span className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* ── Clientes destacados ─────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.clients_eyebrow")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("historia.clients_title")}
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  {t("historia.clients_subtitle")}
                </p>
              </div>
              {isAdmin && !addingClient && (
                <button
                  onClick={() => setAddingClient(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 flex-shrink-0"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nueva empresa
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientes.map((c, i) => {
              const isClientMenuOpen = clientMenuOpenIdx === i;
              const isClientEditing = isAdmin && editingClientIdx === i;
              return (
                <div key={i} style={{ position: "relative", zIndex: isClientMenuOpen ? 50 : 0 }}>
                  <RevealSection delay={i * 40}>
                    {isClientEditing ? (
                      <div
                        className="rounded-lg px-4 py-3.5 space-y-2.5"
                        style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}
                      >
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar empresa</p>
                        <input value={editClientForm.name} onChange={(e) => setEditClientForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la empresa"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <input value={editClientForm.sector} onChange={(e) => setEditClientForm((p) => ({ ...p, sector: e.target.value }))} placeholder="Sector / Rubro"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingClientIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={12} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSaveClient} disabled={!editClientForm.name || !editClientForm.sector}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editClientForm.name || !editClientForm.sector) ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-4 rounded-lg px-4 py-3.5 relative"
                        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}
                      >
                        <div
                          className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ backgroundColor: "rgba(245, 124, 0, 0.12)", color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 pr-6">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                            {c.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                            {c.sector}
                          </p>
                        </div>
                        {isAdmin && (
                          <div
                            className="absolute top-2 right-2"
                            ref={isClientMenuOpen ? clientMenuRef : undefined}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button onClick={() => setClientMenuOpenIdx(isClientMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isClientMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditClient(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeleteClient(i)}
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
                  </RevealSection>
                </div>
              );
            })}

            {/* Formulario nueva empresa */}
            {isAdmin && addingClient && (
              <div className="rounded-lg px-4 py-3.5 space-y-2.5" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nueva empresa</p>
                <input value={newClient.name} onChange={(e) => setNewClient((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la empresa"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <input value={newClient.sector} onChange={(e) => setNewClient((p) => ({ ...p, sector: e.target.value }))} placeholder="Sector / Rubro"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setAddingClient(false); setNewClient({ name: "", sector: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                    style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                    <X size={12} /> Cancelar
                  </button>
                  <button type="button" onClick={handleAddClient} disabled={!newClient.name || !newClient.sector}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newClient.name || !newClient.sector) ? 0.5 : 1 }}>
                    <Plus size={12} /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </RevealSection>

        {/* ── Presencia geográfica ────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.countries_eyebrow")}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                  {t("historia.countries_heading")}
                </h2>
                <p className="mt-3 text-base leading-relaxed max-w-2xl" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                  {t("historia.countries_geo")}
                </p>
              </div>
              {isAdmin && !addingPais && (
                <button
                  onClick={() => setAddingPais(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 flex-shrink-0 mt-1"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nuevo país
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paises.map((p, i) => {
              const isPaisMenuOpen = paisMenuOpenIdx === i;
              const isPaisEditing = isAdmin && editingPaisIdx === i;
              return (
                <div key={i} style={{ position: "relative", zIndex: isPaisMenuOpen ? 50 : 0 }}>
                  <RevealSection delay={i * 40}>
                    {isPaisEditing ? (
                      <div className="rounded-lg p-4 space-y-2.5" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar país</p>
                        <input value={editPaisForm.name} onChange={(e) => setEditPaisForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre del país"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <div className="flex gap-2 items-center">
                          <input value={editPaisForm.code} onChange={(e) => setEditPaisForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="Código (ej: ar)" maxLength={2}
                            style={{ flex: 1, backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-mono)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                            onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                          {editPaisForm.code.length === 2 && (
                            <img src={`https://flagcdn.com/w40/${editPaisForm.code.toLowerCase()}.png`} alt="" width={28} height={20} className="rounded-sm flex-shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
                          )}
                        </div>
                        <button type="button" onClick={() => setEditPaisForm((prev) => ({ ...prev, mainMarket: !prev.mainMarket }))}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors"
                          style={{ backgroundColor: editPaisForm.mainMarket ? "rgba(245,124,0,0.1)" : "var(--section-card-inner)", border: `1px solid ${editPaisForm.mainMarket ? "var(--brand-orange)" : "var(--section-border)"}`, color: editPaisForm.mainMarket ? "var(--brand-orange)" : "var(--section-muted)", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                          <div className="w-3 h-3 rounded-full border flex-shrink-0" style={{ backgroundColor: editPaisForm.mainMarket ? "var(--brand-orange)" : "transparent", borderColor: editPaisForm.mainMarket ? "var(--brand-orange)" : "var(--section-muted)" }} />
                          Mercado principal
                        </button>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingPaisIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={12} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSavePais} disabled={!editPaisForm.name || !editPaisForm.code}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editPaisForm.name || !editPaisForm.code) ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg p-4 flex items-center gap-3 relative" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}>
                        <img src={`https://flagcdn.com/w40/${p.code}.png`} alt={p.name} width={32} height={22} className="flex-shrink-0 rounded-sm object-cover" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
                        <div className="flex-1 min-w-0 pr-5">
                          <p className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{p.name}</p>
                          <p className="text-xs" style={{ color: p.mainMarket ? "var(--brand-orange)" : "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                            {p.mainMarket ? t("historia.main_market") : t("historia.export")}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="absolute top-2 right-2" ref={isPaisMenuOpen ? paisMenuRef : undefined} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setPaisMenuOpenIdx(isPaisMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isPaisMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditPais(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeletePais(i)}
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
                  </RevealSection>
                </div>
              );
            })}

            {/* Formulario nuevo país */}
            {isAdmin && addingPais && (
              <div className="rounded-lg p-4 space-y-2.5" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo país</p>
                <input value={newPais.name} onChange={(e) => setNewPais((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre del país"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <div className="flex gap-2 items-center">
                  <input value={newPais.code} onChange={(e) => setNewPais((prev) => ({ ...prev, code: e.target.value }))} placeholder="Código (ej: ar)" maxLength={2}
                    style={{ flex: 1, backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-mono)", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                  {newPais.code.length === 2 && (
                    <img src={`https://flagcdn.com/w40/${newPais.code.toLowerCase()}.png`} alt="" width={28} height={20} className="rounded-sm flex-shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
                  )}
                </div>
                <button type="button" onClick={() => setNewPais((prev) => ({ ...prev, mainMarket: !prev.mainMarket }))}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{ backgroundColor: newPais.mainMarket ? "rgba(245,124,0,0.1)" : "var(--section-card-inner)", border: `1px solid ${newPais.mainMarket ? "var(--brand-orange)" : "var(--section-border)"}`, color: newPais.mainMarket ? "var(--brand-orange)" : "var(--section-muted)", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                  <div className="w-3 h-3 rounded-full border flex-shrink-0" style={{ backgroundColor: newPais.mainMarket ? "var(--brand-orange)" : "transparent", borderColor: newPais.mainMarket ? "var(--brand-orange)" : "var(--section-muted)" }} />
                  Mercado principal
                </button>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setAddingPais(false); setNewPais({ name: "", code: "", mainMarket: false }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                    style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                    <X size={12} /> Cancelar
                  </button>
                  <button type="button" onClick={handleAddPais} disabled={!newPais.name || newPais.code.length < 2}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newPais.name || newPais.code.length < 2) ? 0.5 : 1 }}>
                    <Plus size={12} /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </RevealSection>

        {/* ── Objetivos ───────────────────────────────────── */}
        <RevealSection>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ backgroundColor: "var(--brand-orange)" }} />
              <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                {t("historia.obj_eyebrow")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                {t("historia.objectives_title")}
              </h2>
              {isAdmin && !addingObj && (
                <button
                  onClick={() => setAddingObj(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
                  style={{ border: "1px solid var(--brand-orange)", color: "var(--brand-orange)", backgroundColor: "rgba(245,124,0,0.08)", fontFamily: "var(--font-body)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,124,0,0.08)"; }}
                >
                  <Plus size={14} /> Nuevo objetivo
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {objetivos.map((o, i) => {
              const IconComp = ICON_MAP[o.iconName] ?? Globe;
              const isObjMenuOpen = objMenuOpenIdx === i;
              const isObjEditing = isAdmin && editingObjIdx === i;
              return (
                <div key={i} style={{ position: "relative", zIndex: isObjMenuOpen ? 50 : 0 }}>
                  <RevealSection delay={i * 60}>
                    {isObjEditing ? (
                      <div className="flex flex-col gap-3 rounded-lg p-5" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Editar objetivo</p>
                        <div>
                          <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ICON_OPTIONS.map((name) => {
                              const Ic = ICON_MAP[name];
                              return (
                                <button key={name} type="button" onClick={() => setEditObjForm((p) => ({ ...p, iconName: name }))}
                                  className="w-8 h-8 rounded flex items-center justify-center transition-all"
                                  style={{ backgroundColor: editObjForm.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${editObjForm.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                                  <Ic size={14} style={{ color: editObjForm.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <input value={editObjForm.title} onChange={(e) => setEditObjForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <textarea rows={3} value={editObjForm.description} onChange={(e) => setEditObjForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción"
                          style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingObjIdx(null)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded"
                            style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            <X size={13} /> Cancelar
                          </button>
                          <button type="button" onClick={handleSaveObj} disabled={!editObjForm.title || !editObjForm.description}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!editObjForm.title || !editObjForm.description) ? 0.5 : 1 }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 rounded-lg p-5 relative" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", boxShadow: "var(--card-shadow)" }}>
                        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(245, 124, 0, 0.12)" }}>
                          <IconComp size={18} style={{ color: "var(--brand-orange)" }} />
                        </div>
                        <div className="flex-1 pr-6">
                          <h4 className="text-sm font-semibold mb-1.5" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{o.title}</h4>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>{o.description}</p>
                        </div>
                        {isAdmin && (
                          <div className="absolute top-2.5 right-2.5" ref={isObjMenuOpen ? objMenuRef : undefined} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setObjMenuOpenIdx(isObjMenuOpen ? null : i)}
                              className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                              style={{ color: "var(--section-muted)", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}>
                              <MoreVertical size={14} />
                            </button>
                            {isObjMenuOpen && (
                              <div className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-30"
                                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)", minWidth: "120px", boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)" }}>
                                <button onClick={() => openEditObj(i)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors"
                                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--section-card-inner)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                                  <Pencil size={11} style={{ color: "var(--brand-orange)" }} /> Editar
                                </button>
                                <div style={{ height: "1px", backgroundColor: "var(--section-border)" }} />
                                <button onClick={() => handleDeleteObj(i)}
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
                  </RevealSection>
                </div>
              );
            })}

            {/* Formulario nuevo objetivo */}
            {isAdmin && addingObj && (
              <div className="flex flex-col gap-3 rounded-lg p-5" style={{ backgroundColor: "var(--section-card)", border: "1px dashed var(--brand-orange)", boxShadow: "var(--card-shadow)" }}>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>Nuevo objetivo</p>
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Símbolo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((name) => {
                      const Ic = ICON_MAP[name];
                      return (
                        <button key={name} type="button" onClick={() => setNewObj((p) => ({ ...p, iconName: name }))}
                          className="w-8 h-8 rounded flex items-center justify-center transition-all"
                          style={{ backgroundColor: newObj.iconName === name ? "rgba(245,124,0,0.2)" : "var(--section-card-inner)", border: `1px solid ${newObj.iconName === name ? "var(--brand-orange)" : "var(--section-border)"}`, cursor: "pointer" }}>
                          <Ic size={14} style={{ color: newObj.iconName === name ? "var(--brand-orange)" : "var(--section-muted)" }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input value={newObj.title} onChange={(e) => setNewObj((p) => ({ ...p, title: e.target.value }))} placeholder="Título"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <textarea rows={3} value={newObj.description} onChange={(e) => setNewObj((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción"
                  style={{ width: "100%", backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)", color: "var(--section-heading)", fontFamily: "var(--font-body)", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--brand-orange)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--section-border)"; }} />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setAddingObj(false); setNewObj({ iconName: "Globe", title: "", description: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded"
                    style={{ border: "1px solid var(--section-border)", color: "var(--section-body)", backgroundColor: "transparent", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                    <X size={13} /> Cancelar
                  </button>
                  <button type="button" onClick={handleAddObj} disabled={!newObj.title || !newObj.description}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded active:scale-95"
                    style={{ backgroundColor: "var(--brand-orange)", color: "oklch(0.12 0.005 285)", fontFamily: "var(--font-body)", cursor: "pointer", opacity: (!newObj.title || !newObj.description) ? 0.5 : 1 }}>
                    <Plus size={13} /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </RevealSection>

      </div>

      {/* ── Footer simple ──────────────────────────────────── */}
      <footer
        className="mt-8 py-8"
        style={{ borderTop: "1px solid var(--section-border)" }}
      >
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center rounded" style={{ backgroundColor: "var(--brand-orange)" }}>
              <Package size={12} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
              Hores Cartotécnica
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
            {t("historia.footer_location")}
          </p>
        </div>
      </footer>
    </div>
  );
}
