/* Blooming Gioielli — movimento: intro, scorrimento morbido, comparse, parallasse, Lab */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduceMotion) root.classList.add("motion-ready");

  /* ---------- Scorrimento morbido su desktop ---------- */
  let lenis = null;
  if (!reduceMotion && finePointer && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    window.BloomingScroll = lenis;
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- Intro e ingresso dell'hero ---------- */
  let heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    requestAnimationFrame(() => root.classList.add("is-loaded"));
  }
  const intro = document.querySelector(".intro");
  if (root.classList.contains("has-intro") && intro) {
    root.classList.add("intro-active");
    if (lenis) lenis.stop();
    setTimeout(() => {
      intro.classList.add("is-out");
      root.classList.remove("intro-active");
      if (lenis) lenis.start();
      startHero();
      try { sessionStorage.setItem("bl-intro", "1"); } catch (e) { /* storage non disponibile */ }
    }, 1700);
    setTimeout(() => { intro.remove(); root.classList.remove("has-intro"); }, 3000);
  } else {
    if (intro) intro.remove();
    const heroImg = document.querySelector(".hero-photo img");
    if (heroImg && !heroImg.complete) {
      heroImg.addEventListener("load", startHero, { once: true });
      setTimeout(startHero, 1200);
    } else {
      startHero();
    }
  }

  /* ---------- Comparse a scorrimento ---------- */
  const groups = [".products", ".gift-grid", ".tiles", ".ig-grid", ".steps", ".values-list"];
  const revealItems = [];
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((list) => {
      Array.from(list.children).forEach((child, i) => {
        child.classList.add("reveal");
        child.style.setProperty("--d", `${(i % 4) * 0.1}s`);
        revealItems.push(child);
        const media = child.querySelector(".curtain") || (child.classList.contains("curtain") ? child : null);
        if (media) media.style.setProperty("--d", `${(i % 4) * 0.1 + 0.08}s`);
      });
    });
  });
  const curtains = Array.from(document.querySelectorAll(".curtain"));
  // una foto completamente "chiusa" non viene vista dall'observer: si osserva il suo contenitore
  const curtainHosts = new Map();
  curtains.forEach((c) => { if (!c.closest(".reveal")) curtainHosts.set(c.parentElement, c); });

  // i titoli si dividono in righe che salgono una alla volta
  function splitLines(node) {
    const text = node.textContent.trim().replace(/\s+/g, " ");
    node.dataset.text = text;
    node.textContent = "";
    const words = text.split(" ").map((w, i, all) => {
      const span = document.createElement("span");
      span.textContent = w;
      node.appendChild(span);
      if (i < all.length - 1) node.appendChild(document.createTextNode(" "));
      return span;
    });
    const lines = [];
    let top = null;
    words.forEach((w) => {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    node.textContent = "";
    lines.forEach((words, i) => {
      const line = document.createElement("span");
      const inner = document.createElement("span");
      line.className = "line";
      inner.style.setProperty("--i", i);
      inner.textContent = words.join(" ");
      line.appendChild(inner);
      node.appendChild(line);
      if (i < lines.length - 1) node.appendChild(document.createTextNode(" "));
    });
    node.classList.add("is-split");
  }
  function unsplit(node) {
    if (!node.dataset.text) return;
    node.textContent = node.dataset.text;
    node.classList.remove("is-split");
    delete node.dataset.text;
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.concat(curtains).forEach((n) => n.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const shown = [node];
        node.classList.add("is-in");
        node.querySelectorAll(".curtain").forEach((c) => { c.classList.add("is-in"); shown.push(c); });
        if (curtainHosts.has(node)) { const c = curtainHosts.get(node); c.classList.add("is-in"); shown.push(c); }
        io.unobserve(node);
        // finita la comparsa, il ritardo non deve frenare gli hover
        setTimeout(() => shown.forEach((n) => n.style.removeProperty("--d")), 2600);
        if (node.hasAttribute("data-split")) setTimeout(() => unsplit(node), 1900);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealItems.concat(Array.from(curtainHosts.keys())).forEach((n) => io.observe(n));

    const headings = Array.from(document.querySelectorAll("[data-split]"));
    const ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
    ready.then(() => headings.forEach((h) => { splitLines(h); io.observe(h); }));
  }

  /* ---------- Parallasse e citazione che si accende parola per parola ---------- */
  const parallax = Array.from(document.querySelectorAll("[data-parallax]"));
  const quote = document.querySelector("[data-words]");
  let words = [];
  if (quote) {
    const text = quote.textContent.trim().split(/\s+/);
    quote.textContent = "";
    words = text.map((w, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      quote.appendChild(span);
      if (i < text.length - 1) quote.appendChild(document.createTextNode(" "));
      return span;
    });
    if (reduceMotion) words.forEach((w) => w.classList.add("is-on"));
  }

  let ticking = false;
  function onFrame() {
    ticking = false;
    const vh = window.innerHeight;
    parallax.forEach((node) => {
      const box = node.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;
      const offset = box.top + box.height / 2 - vh / 2;
      node.style.setProperty("--py", `${(-offset * parseFloat(node.dataset.parallax)).toFixed(1)}px`);
    });
    if (words.length) {
      const r = quote.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.45)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("is-on", i < lit));
    }
  }
  if (!reduceMotion) {
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
    }, { passive: true });
    window.addEventListener("resize", onFrame);
    onFrame();
  }

  /* ---------- Lab: inclinazione 3D e luce che segue il puntatore ---------- */
  const tray = document.querySelector(".lab-tray");
  if (tray && finePointer && !reduceMotion) {
    tray.addEventListener("pointermove", (e) => {
      const r = tray.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tray.classList.add("is-tilting");
      tray.style.setProperty("--rx", (x - 0.5).toFixed(3));
      tray.style.setProperty("--ry", (y - 0.5).toFixed(3));
      tray.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
      tray.style.setProperty("--ly", `${(y * 100).toFixed(1)}%`);
    });
    tray.addEventListener("pointerleave", () => {
      tray.classList.remove("is-tilting");
      tray.style.setProperty("--rx", 0);
      tray.style.setProperty("--ry", 0);
    });
  }

  /* ---------- Scintille "laser" mentre si scrive ---------- */
  const labSvg = document.getElementById("lab-tag");
  function sparks(count) {
    if (reduceMotion || !tray || !labSvg) return;
    const ink = labSvg.querySelector("text[fill-opacity]");
    if (!ink) return;
    const t = ink.getBoundingClientRect();
    const r = tray.getBoundingClientRect();
    const x = t.right - r.left - 4;
    const y = t.top + t.height / 2 - r.top;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      const a = Math.random() * Math.PI * 2;
      const d = 14 + Math.random() * 30;
      s.className = "spark";
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
      s.style.setProperty("--dy", `${Math.sin(a) * d}px`);
      tray.appendChild(s);
      setTimeout(() => s.remove(), 750);
    }
  }
  ["line1", "line2"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", () => requestAnimationFrame(() => sparks(7)));
  });

  function pop() {
    if (reduceMotion || !tray) return;
    tray.classList.remove("is-switching");
    void tray.offsetWidth;
    tray.classList.add("is-switching");
  }
  const form = document.getElementById("lab-form");
  if (form) form.addEventListener("input", (e) => { if (e.target.name === "shape") pop(); });
  document.addEventListener("lab:applied", () => {
    pop();
    setTimeout(() => sparks(12), 60);
  });
})();
