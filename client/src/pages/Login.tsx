import { useState } from "react";
import { Package, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const { login, register } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "register") {
      if (form.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        return;
      }
      if (form.password !== form.confirm) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }
    setLoading(true);
    const result =
      tab === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate("/");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--section-border)",
    backgroundColor: "var(--section-card-inner)",
    color: "var(--section-heading)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--section-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-orange)" }}
          >
            <Package size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
            Hores Cartotécnica
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-lg p-1 mb-6 gap-1"
          style={{ backgroundColor: "var(--section-card-inner)" }}
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setForm({ name: "", email: "", password: "", confirm: "" }); }}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: tab === t ? "var(--section-card)" : "transparent",
                color: tab === t ? "var(--brand-orange)" : "var(--section-muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {tab === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                Nombre completo
              </label>
              <input name="name" required value={form.name} onChange={handle} placeholder="Tu nombre" style={inputStyle} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              Email
            </label>
            <input name="email" type="email" required value={form.email} onChange={handle} placeholder="tu@email.com" style={inputStyle} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              Contraseña {tab === "register" && <span style={{ color: "var(--section-muted)", fontWeight: 400 }}>(mín. 8 caracteres)</span>}
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? "text" : "password"}
                required
                minLength={tab === "register" ? 8 : undefined}
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--section-muted)" }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirm}
                  onChange={handle}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--section-muted)" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-center px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#ef4444", fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 mt-2"
            style={{
              backgroundColor: loading ? "rgba(245,124,0,0.6)" : "var(--brand-orange)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {tab === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? "Cargando..." : tab === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {tab === "login" && (
          <div className="mt-6 p-4 rounded-lg text-xs" style={{ backgroundColor: "var(--section-card-inner)", fontFamily: "var(--font-body)", color: "var(--section-muted)" }}>
            <p className="font-medium mb-2" style={{ color: "var(--section-heading)" }}>Cuentas de prueba:</p>
            <p><span className="font-medium">Admin:</span> juan@gmail.com / 1234 · leandro@gmail.com / 5678</p>
            <p><span className="font-medium">Empleado:</span> carlos@hores.com / emp123</p>
            <p><span className="font-medium">Cliente:</span> registrate con cualquier email</p>
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-xs text-center transition-colors duration-200"
          style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
        >
          ← Volver a la página principal
        </button>
      </div>
    </div>
  );
}
