/* Blooming Gioielli — nucleo: anteprima incisione, schede, contatti, stato boutique */
(function () {
  "use strict";

  // Da completare con il cliente: con il numero WhatsApp le richieste partono da lì, con il testo già scritto
  const SITE = {
    instagram: "blooming.gioielli",
    whatsapp: "" // es. "393331234567": prefisso internazionale, senza + e senza spazi
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- Medaglietta incisa (SVG) ---------- */
  const METALS = {
    argento: { label: "argento", stops: ["#fdfeff", "#cdd3d9", "#f3f5f7", "#9aa2ab", "#e8ebee", "#b9c0c7"], ink: "#4a525b", hi: "rgba(255,255,255,.9)", edge: "#89919a", chain: ["#e9edf0", "#9aa2ab"] },
    oro: { label: "oro", stops: ["#fff5d6", "#e3bd6a", "#fcebb4", "#b4873a", "#f2d690", "#c99d4c"], ink: "#6a4d1c", hi: "rgba(255,247,222,.95)", edge: "#a47832", chain: ["#f6dc98", "#b4873a"] },
    rosa: { label: "oro rosa", stops: ["#ffe9e0", "#e2a690", "#fbdacd", "#b4715b", "#f0c2b0", "#cf8f78"], ink: "#6e3a2a", hi: "rgba(255,240,233,.95)", edge: "#a8664f", chain: ["#f5cdbd", "#b4715b"] }
  };

  const FONTS = {
    corsivo: { label: "corsivo", family: "'Pinyon Script', cursive", weight: 400, scale: 1.3, spacing: 0, upper: false },
    stampatello: { label: "stampatello", family: "'Josefin Sans', sans-serif", weight: 600, scale: 0.92, spacing: 3, upper: true },
    macchina: { label: "macchina da scrivere", family: "'Courier Prime', monospace", weight: 700, scale: 0.9, spacing: 0, upper: false }
  };

  function circlePath(cx, cy, r) {
    return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
  }
  function roundRect(x, y, w, h, r) {
    return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
  }

  // viewBox 0 0 300 320; holes = [x, y, r]; text = centro e larghezza utile
  const SHAPES = {
    tondo: { label: "Medaglietta tonda", short: "Tonda", d: circlePath(150, 192, 112), holes: [[150, 98, 7]], text: { cy: 200, maxW: 168, l1: 46, l2: 20 } },
    cuore: { label: "Ciondolo a cuore", short: "Cuore", d: "M150 300 C 96 263 28 216 28 152 C 28 107 60 78 99 78 C 123 78 140 90 150 106 C 160 90 177 78 201 78 C 240 78 272 107 272 152 C 272 216 204 263 150 300 Z", holes: [[150, 124, 6]], text: { cy: 182, maxW: 150, l1: 42, l2: 18 } },
    barretta: { label: "Barretta", short: "Barretta", d: roundRect(14, 150, 272, 84, 10), holes: [[32, 192, 5.5], [268, 192, 5.5]], text: { cy: 192, maxW: 190, l1: 38, l2: 16 } },
    piastrina: { label: "Piastrina", short: "Piastrina", d: roundRect(78, 84, 144, 222, 34), holes: [[150, 108, 6]], text: { cy: 206, maxW: 108, l1: 34, l2: 16 } }
  };

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function drawTag(svg, cfg) {
    const uid = svg.id;
    const metal = METALS[cfg.metal];
    const shape = SHAPES[cfg.shape];
    const holeD = shape.holes.map(([x, y, r]) => circlePath(x, y, r)).join(" ");
    const bodyD = shape.d + " " + holeD;

    svg.textContent = "";
    const defs = el("defs", {}, svg);
    const grad = el("linearGradient", { id: uid + "-metal", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    metal.stops.forEach((c, i) => el("stop", { offset: i / (metal.stops.length - 1), "stop-color": c }, grad));
    const chainGrad = el("linearGradient", { id: uid + "-chain", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
    el("stop", { offset: "0", "stop-color": metal.chain[0] }, chainGrad);
    el("stop", { offset: "1", "stop-color": metal.chain[1] }, chainGrad);
    const glint = el("linearGradient", { id: uid + "-glint", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    el("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0" }, glint);
    el("stop", { offset: ".5", "stop-color": "#fff", "stop-opacity": ".8" }, glint);
    el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, glint);
    const clip = el("clipPath", { id: uid + "-clip" }, defs);
    el("path", { d: bodyD, "clip-rule": "evenodd" }, clip);
    const brush = el("filter", { id: uid + "-brush", x: "0", y: "0", width: "100%", height: "100%" }, defs);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.004 0.7", numOctaves: "2", seed: "4" }, brush);
    el("feColorMatrix", { type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" }, brush);

    // catenina e anellini
    const chain = el("g", { fill: "none", stroke: `url(#${uid}-chain)`, "stroke-linecap": "round" }, svg);
    shape.holes.forEach(([x, y, r], i) => {
      const ringCy = y - r - 4;
      const ringRy = r + 11;
      const ringTop = ringCy - ringRy;
      if (shape.holes.length === 1) {
        el("path", { d: `M${x},${ringTop} C ${x - 40},${ringTop - 30} ${x - 110},${ringTop - 62} -20,${ringTop - 80}`, "stroke-width": "3", "stroke-dasharray": "5 2.5" }, chain);
        el("path", { d: `M${x},${ringTop} C ${x + 40},${ringTop - 30} ${x + 110},${ringTop - 62} 320,${ringTop - 80}`, "stroke-width": "3", "stroke-dasharray": "5 2.5" }, chain);
      } else {
        const dir = i === 0 ? -1 : 1;
        const toX = i === 0 ? -20 : 320;
        el("path", { d: `M${x},${ringTop} C ${x + dir * 6},${ringTop - 60} ${x + dir * 20},${ringTop - 120} ${toX},${ringTop - 170}`, "stroke-width": "3", "stroke-dasharray": "5 2.5" }, chain);
      }
      el("ellipse", { cx: x, cy: ringCy, rx: r + 2, ry: ringRy, "stroke-width": "3.4" }, chain);
    });

    // corpo in metallo
    el("path", { d: bodyD, "fill-rule": "evenodd", fill: `url(#${uid}-metal)` }, svg);
    const inner = el("g", { "clip-path": `url(#${uid}-clip)` }, svg);
    el("rect", { x: "0", y: "0", width: "300", height: "320", filter: `url(#${uid}-brush)`, opacity: ".16", style: "mix-blend-mode:multiply" }, inner);
    el("path", { d: bodyD, fill: "none", stroke: "rgba(255,255,255,.75)", "stroke-width": "7" }, inner);
    el("rect", { class: "tag-glint", x: "0", y: "-20", width: "70", height: "360", fill: `url(#${uid}-glint)` }, inner);
    el("path", { d: bodyD, "fill-rule": "evenodd", fill: "none", stroke: metal.edge, "stroke-width": "1.6" }, svg);

    // incisione
    const font = FONTS[cfg.font];
    const t = shape.text;
    const lines = [];
    const fix = (s) => (font.upper ? s.toUpperCase() : s);
    if (cfg.line1) lines.push({ text: fix(cfg.line1), size: t.l1 * font.scale, gap: 1.0 });
    if (cfg.line2) lines.push({ text: fix(cfg.line2), size: t.l2 * (font.upper ? 0.95 : 1.05), gap: 1.35, font: cfg.font === "corsivo" ? FONTS.macchina : font });
    if (cfg.symbol) lines.push({ text: cfg.symbol, size: 24, gap: 1.2, font: { family: "'Jost', 'Segoe UI Symbol', sans-serif", weight: 400, spacing: 0 } });

    const textGroup = el("g", { "text-anchor": "middle", "dominant-baseline": "central" }, svg);
    const nodes = lines.map((ln) => {
      const f = ln.font || font;
      const common = { x: "150", "font-family": f.family, "font-weight": f.weight, "letter-spacing": f.spacing || 0 };
      const hi = el("text", Object.assign({ fill: metal.hi }, common), textGroup);
      const ink = el("text", Object.assign({ fill: metal.ink, "fill-opacity": ".88" }, common), textGroup);
      hi.textContent = ink.textContent = ln.text;
      hi.setAttribute("font-size", ln.size);
      ink.setAttribute("font-size", ln.size);
      // la scritta si adatta alla larghezza utile
      const w = ink.getComputedTextLength ? ink.getComputedTextLength() : 0;
      if (w > t.maxW) ln.size = (ln.size * t.maxW) / w;
      hi.setAttribute("font-size", ln.size);
      ink.setAttribute("font-size", ln.size);
      return { hi, ink, ln };
    });
    const total = nodes.reduce((sum, n) => sum + n.ln.size * n.ln.gap, 0);
    let y = t.cy - total / 2;
    nodes.forEach((n) => {
      const cy = y + (n.ln.size * n.ln.gap) / 2;
      n.ink.setAttribute("y", cy.toFixed(1));
      n.hi.setAttribute("y", (cy + 1.1).toFixed(1));
      y += n.ln.size * n.ln.gap;
    });
  }

  function glint(svg) {
    if (reduceMotion) return;
    svg.classList.remove("is-glinting");
    void svg.getBoundingClientRect();
    svg.classList.add("is-glinting");
  }

  /* ---------- Lab ---------- */
  const form = document.getElementById("lab-form");
  const labSvg = document.getElementById("lab-tag");
  const miniSvg = document.getElementById("lab-mini-tag");
  const miniText = document.getElementById("lab-mini-text");
  const summary = document.getElementById("lab-summary");
  const counter = document.getElementById("line1-count");
  const line1 = document.getElementById("line1");

  function readCfg() {
    const fd = new FormData(form);
    return {
      shape: fd.get("shape"),
      metal: fd.get("metal"),
      font: fd.get("font"),
      line1: (fd.get("line1") || "").trim(),
      line2: (fd.get("line2") || "").trim(),
      symbol: fd.get("symbol") || ""
    };
  }

  function engravedText(cfg) {
    const parts = [];
    if (cfg.line1) parts.push(`"${cfg.line1}"`);
    if (cfg.line2) parts.push(`"${cfg.line2}"`);
    if (cfg.symbol) parts.push(cfg.symbol);
    return parts.length ? parts.join(" + ") : "nessun testo";
  }

  function describe(cfg) {
    return `${SHAPES[cfg.shape].label} in acciaio 316L color ${METALS[cfg.metal].label}, scrittura ${FONTS[cfg.font].label}: ${engravedText(cfg)}`;
  }

  function updateLab(withGlint) {
    const cfg = readCfg();
    drawTag(labSvg, cfg);
    if (miniSvg) drawTag(miniSvg, cfg);
    const text = describe(cfg);
    summary.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = "La tua idea: ";
    summary.append(strong, document.createTextNode(text + "."));
    if (miniText) miniText.textContent = `${SHAPES[cfg.shape].short} ${METALS[cfg.metal].label}: ${engravedText(cfg)}`;
    labSvg.setAttribute("aria-label", "Anteprima: " + text);
    counter.textContent = `${line1.value.length} di ${line1.maxLength} caratteri`;
    if (withGlint) glint(labSvg);
  }

  form.addEventListener("input", (e) => updateLab(e.target.type === "radio"));
  form.addEventListener("submit", (e) => e.preventDefault());

  // imposta il Lab da un'idea pronta (ispirazioni, prodotti, idee regalo)
  function apply(cfg) {
    ["shape", "metal", "font", "symbol"].forEach((name) => {
      const input = form.querySelector(`input[name="${name}"][value="${cfg[name] || ""}"]`);
      if (input) input.checked = true;
    });
    form.elements.line1.value = cfg.line1 || "";
    form.elements.line2.value = cfg.line2 || "";
    form.querySelector('input[name="metal"]:checked').dispatchEvent(new Event("input", { bubbles: true }));
    document.dispatchEvent(new CustomEvent("lab:applied"));
  }

  /* ---------- Contatti ---------- */
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 4200);
  }

  async function contact(message) {
    if (SITE.whatsapp) {
      window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(message);
      copied = true;
    } catch (err) { /* appunti non disponibili */ }
    window.open(`https://ig.me/m/${SITE.instagram}`, "_blank", "noopener");
    toast(copied ? "Messaggio copiato: incollalo nella chat di Instagram." : "Si apre Instagram: scrivici pure lì.");
  }

  const sendBtn = document.getElementById("send-idea");
  if (SITE.whatsapp) {
    sendBtn.textContent = "Richiedi su WhatsApp";
    document.getElementById("send-note").textContent = "Si apre WhatsApp con il messaggio già pronto: ti rispondiamo con prezzo e tempi.";
  }
  sendBtn.addEventListener("click", () => {
    contact(`Ciao Blooming! Vorrei incidere questo: ${describe(readCfg())}. Quanto costa e quando posso passare?`);
  });

  /* ---------- Schede della selezione ---------- */
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    if (typeof tab === "string") tab = document.getElementById(tab);
    if (!tab) return;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus({ preventScroll: true });
    // su mobile la fila delle schede scorre in orizzontale: porta al centro quella scelta, senza muovere la pagina
    const list = tab.parentElement;
    if (list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next, true);
    });
  });

  /* ---------- Stato boutique (ora di Roma) ---------- */
  function updateStatus() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = mins >= 570 && mins < 1170;
    const full = open ? "Aperto ora, fino alle 19:30" : mins < 570 ? "Chiuso ora, apriamo alle 9:30" : "Chiuso ora, riapriamo domani alle 9:30";
    const short = open ? "Aperto ora" : "Chiuso ora";
    document.querySelectorAll("[data-store-status]").forEach((node) => {
      node.classList.toggle("store-open", open);
      node.querySelector(".status-text").textContent = node.dataset.storeStatus === "short" ? short : full;
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Avvio: aspetta i font dell'incisione per misurare bene ---------- */
  const fontLoads = ["48px 'Pinyon Script'", "600 48px 'Josefin Sans'", "700 48px 'Courier Prime'"].map((f) => document.fonts.load(f).catch(() => {}));
  updateLab(false);

  // la prima volta che il Lab entra in vista, il nome si incide lettera per lettera
  let labTouched = false;
  form.addEventListener("input", () => { labTouched = true; }, { once: true });
  function engraveLab() {
    if (labTouched || reduceMotion) return;
    const cfg = readCfg();
    const word = cfg.line1;
    let i = 0;
    const tick = setInterval(() => {
      if (labTouched) { clearInterval(tick); return; }
      i++;
      drawTag(labSvg, Object.assign({}, cfg, { line1: word.slice(0, i), line2: "", symbol: "" }));
      if (i >= word.length) {
        clearInterval(tick);
        updateLab(true);
      }
    }, 130);
  }

  Promise.race([Promise.all(fontLoads), new Promise((r) => setTimeout(r, 1500))]).then(() => {
    updateLab(false);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { io.disconnect(); setTimeout(engraveLab, 250); }
      }, { threshold: 0.55 });
      io.observe(labSvg);
    }
  });

  window.Blooming = { SITE, apply, contact, describe, readCfg, selectTab, toast };
})();
