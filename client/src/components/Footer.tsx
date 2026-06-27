/**
 * Footer — Hores Cartotécnica
 * Design: Craft Manufacturing — deep black, orange accents
 */

import { Package, Instagram, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <footer
      className="py-12 border-t"
      style={{
        backgroundColor: "var(--footer-bg)",
        borderColor: "var(--section-border-subtle)",
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 flex items-center justify-center rounded"
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                <Package size={18} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
              </div>
              <div>
                <div
                  className="text-sm font-semibold tracking-wider uppercase"
                  style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                >
                  Hores
                </div>
                <div
                  className="text-xs tracking-widest uppercase"
                  style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                >
                  Cartotécnica
                </div>
              </div>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
            >
              {t("footer.description")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4"
              style={{ color: "oklch(0.55 0.01 85)", fontFamily: "var(--font-mono)" }}
            >
              {t("footer.nav_title")}
            </h4>
            <ul className="space-y-2">
              {[
                { id: "empresa",   label: t("nav.empresa") },
                { id: "productos", label: t("nav.productos") },
                { id: "compras",   label: t("nav.compras") },
                { id: "contacto",  label: t("nav.contacto") },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="text-sm transition-colors duration-150"
                    style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.01 85)"; }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4"
              style={{ color: "oklch(0.55 0.01 85)", fontFamily: "var(--font-mono)" }}
            >
              {t("footer.contact_title")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://instagram.com/horescartotecnica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm transition-colors duration-150"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand-orange)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.65 0.01 85)"; }}
                >
                  <Instagram size={14} style={{ flexShrink: 0 }} />
                  @horescartotecnica
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@horescartotecnica.com"
                  className="flex items-center gap-2.5 text-sm transition-colors duration-150"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand-orange)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.65 0.01 85)"; }}
                >
                  <Mail size={14} style={{ flexShrink: 0 }} />
                  info@horescartotecnica.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+541140000000"
                  className="flex items-center gap-2.5 text-sm transition-colors duration-150"
                  style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand-orange)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.65 0.01 85)"; }}
                >
                  <Phone size={14} style={{ flexShrink: 0 }} />
                  +54 11 4xxx-xxxx
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "var(--section-border-subtle)" }}
        >
          <p
            className="text-xs"
            style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
          >
            © {new Date().getFullYear()} Hores Cartotécnica. {t("footer.rights")}
          </p>
          <div
            className="h-px w-8"
            style={{ backgroundColor: "var(--brand-orange)" }}
          />
          <p
            className="text-xs"
            style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}
          >
            Buenos Aires, Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
