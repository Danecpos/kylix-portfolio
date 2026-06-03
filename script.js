const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const contactForm = document.querySelector(".contact-form");
const scrollFocusCards = Array.from(document.querySelectorAll(".scroll-focus-card"));

menuButton?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open") ?? false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  const originalText = button.textContent;

  button.textContent = "Zpráva připravena";
  button.disabled = true;

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    contactForm.reset();
  }, 1800);
});

if (scrollFocusCards.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameRequested = false;

  const updateScrollFocus = () => {
    frameRequested = false;

    if (reducedMotion.matches) {
      scrollFocusCards.forEach((card) => {
        card.classList.remove("is-scroll-focused");
        card.style.removeProperty("--scroll-lift");
        card.style.removeProperty("--scroll-opacity");
        card.style.removeProperty("--scroll-scale");
      });
      return;
    }

    const viewportCenter = window.innerHeight * 0.52;
    const focusRange = Math.max(260, window.innerHeight * 0.64);
    let activeCard = null;
    let activeScore = -1;

    scrollFocusCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      const rawFocus = Math.max(0, 1 - distance / focusRange);
      const focus = rawFocus * rawFocus * (3 - 2 * rawFocus);
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;

      card.style.setProperty("--scroll-scale", (0.94 + focus * 0.1).toFixed(3));
      card.style.setProperty("--scroll-opacity", (0.74 + focus * 0.26).toFixed(3));
      card.style.setProperty("--scroll-lift", `${(-10 * focus).toFixed(1)}px`);

      if (visible && focus > activeScore) {
        activeScore = focus;
        activeCard = card;
      }
    });

    scrollFocusCards.forEach((card) => {
      card.classList.toggle("is-scroll-focused", card === activeCard);
    });
  };

  const requestScrollFocusUpdate = () => {
    if (frameRequested) {
      return;
    }

    frameRequested = true;
    window.requestAnimationFrame(updateScrollFocus);
  };

  updateScrollFocus();
  window.addEventListener("scroll", requestScrollFocusUpdate, { passive: true });
  window.addEventListener("resize", requestScrollFocusUpdate);
  reducedMotion.addEventListener?.("change", updateScrollFocus);
}
