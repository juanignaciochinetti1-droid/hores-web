import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function VideoSection() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 relative overflow-hidden"
      style={{ backgroundColor: "var(--section-alt)" }}
    >
      <div className="container">
        {/* Header */}
        <div className={`text-center mb-10 reveal ${visible ? "visible" : ""}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
            <span
              className="text-xs font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
            >
              {t("video.eyebrow")}
            </span>
            <div className="h-px w-10" style={{ backgroundColor: "var(--brand-orange)" }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
          >
            {t("video.title")}
          </h2>
          <p
            className="text-base max-w-lg mx-auto"
            style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            {t("video.subtitle")}
          </p>
        </div>

        {/* Video embed */}
        <div
          className={`relative mx-auto rounded-xl overflow-hidden reveal ${visible ? "visible" : ""}`}
          style={{
            maxWidth: 800,
            aspectRatio: "16 / 9",
            border: "1px solid var(--section-border)",
            boxShadow: "var(--card-shadow)",
            transitionDelay: "80ms",
          }}
        >
          <video
            src="/video-drone-dia.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
