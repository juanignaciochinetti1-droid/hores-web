/**
 * Home — Hores Cartotécnica
 * Design: Craft Manufacturing
 * Sections: Empresa (hero) → Productos → Compras → Contacto
 * Features: scroll-aware navbar, active section tracking, reveal animations
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EmpresaSection from "@/components/sections/EmpresaSection";
import ProductosSection from "@/components/sections/ProductosSection";
import VideoSection from "@/components/sections/VideoSection";
import MisionVisionSection from "@/components/sections/MisionVisionSection";

import TestimoniosSection from "@/components/sections/TestimoniosSection";
import CurriculumSection from "@/components/sections/CurriculumSection";
import ContactoSection from "@/components/sections/ContactoSection";
import Footer from "@/components/Footer";

const SECTIONS = ["empresa", "productos", "trabajo", "contacto"];

export default function Home() {
  const [activeSection, setActiveSection] = useState("empresa");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let current = "empresa";

      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>
      <Navbar activeSection={activeSection} />
      <main>
        <EmpresaSection />
        <MisionVisionSection />
        <VideoSection />
        <ProductosSection />
<TestimoniosSection />
        <CurriculumSection />
        <ContactoSection />
      </main>
      <Footer />
    </div>
  );
}
