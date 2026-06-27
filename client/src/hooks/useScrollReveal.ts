import { useEffect } from "react";

const REVEAL_CLASSES = [".reveal", ".reveal-left", ".reveal-right", ".reveal-scale"];

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    const observe = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_CLASSES.join(",")).forEach((el) => {
        if (!el.classList.contains("visible")) observer.observe(el);
      });
    };

    observe();

    // Re-observe when DOM changes (route changes, dynamic content)
    const mutation = new MutationObserver(observe);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);
}
