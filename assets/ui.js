/* Blooming Gioielli — navigazione: masthead, menu a schermo intero, scheda prodotto, ancore */
(function () {
  "use strict";

  const root = document.documentElement;
  const B = window.Blooming || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = window.matchMedia("(max-width: 959px)");
  const NAV_OFFSET = 72;

  const masthead = document.getElementById("masthead");
  const main = document.getElementById("main");
  const footer = document.querySelector(".site-footer");
  const mobileBar = document.getElementById("mobile-bar");

  /* ---------- Blocco dello scroll (funziona anche su iPhone) ---------- */
  let lockY = 0;
  let locks = 0;
  function lockScroll() {
    if (locks++ > 0) return;
    root.style.setProperty("--sbw", `${window.innerWidth - root.clientWidth}px`);
    lockY = window.scrollY;
    if (window.BloomingScroll) window.BloomingScroll.stop();
    document.body.style.top = `-${lockY}px`;
    root.classList.add("is-locked");
  }
  function unlockScroll() {
    if (locks === 0 || --locks > 0) return;
    root.classList.remove("is-locked");
    document.body.style.top = "";
    root.style.setProperty("--sbw", "0px");
    const behavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, lockY);
    root.style.scrollBehavior = behavior;
    if (window.BloomingScroll) {
      // mentre la pagina era bloccata Lenis l'ha misurata alta zero: riprende le misure prima di ripartire
      window.BloomingScroll.start();
      window.BloomingScroll.resize();
    }
  }

  // mentre un pannello è aperto, il resto della pagina non riceve focus né clic
  function setInert(on) {
    [masthead, main, footer, mobileBar].forEach((node) => { if (node) node.inert = on; });
  }

  function trapFocus(container, e) {
    if (e.key !== "Tab") return;
    const items = Array.from(container.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'))
      .filter((node) => node.offsetParent !== null || node === document.activeElement);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Masthead: si compatta scorrendo, si nasconde scendendo, torna risalendo ---------- */
  const OFFSETS = { top: 112, compact: 60, hidden: 0 };
  let mastState = "";
  let lastY = window.scrollY;
  let keepVisibleUntil = 0;

  function setMast(state) {
    if (state === mastState) return;
    mastState = state;
    masthead.classList.toggle("is-compact", state !== "top");
    masthead.classList.toggle("is-hidden", state === "hidden");
    root.style.setProperty("--header-offset", `${OFFSETS[state]}px`);
  }
  function keepMastVisible(ms) {
    keepVisibleUntil = performance.now() + ms;
    if (window.scrollY > 12) setMast("compact");
  }
  function onScroll() {
    if (root.classList.contains("is-locked")) return;
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    if (y < 12) { setMast("top"); return; }
    if (dy > 4 && y > 420 && performance.now() > keepVisibleUntil) setMast("hidden");
    else if (dy < -4 || mastState === "top") setMast("compact");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  masthead.addEventListener("focusin", () => keepMastVisible(1500));

  /* ---------- Barra annunci a rotazione ---------- */
  const notes = Array.from(document.querySelectorAll(".announce-item"));
  if (notes.length > 1 && !reduceMotion) {
    let current = 0;
    let timer = null;
    const rotate = () => {
      const prev = notes[current];
      current = (current + 1) % notes.length;
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      prev.setAttribute("aria-hidden", "true");
      setTimeout(() => prev.classList.remove("is-leaving"), 900);
      notes[current].classList.add("is-active");
      notes[current].removeAttribute("aria-hidden");
    };
    const play = () => { if (!timer) timer = setInterval(rotate, 4600); };
    const pause = () => { clearInterval(timer); timer = null; };
    const bar = document.querySelector(".announce");
    bar.addEventListener("mouseenter", pause);
    bar.addEventListener("mouseleave", play);
    play();
  }

  /* ---------- Scorrimento verso le sezioni ---------- */
  function scrollToEl(target) {
    keepMastVisible(1600);
    const lenis = window.BloomingScroll;
    const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    if (lenis) {
      // misure e posizione aggiornate prima di partire (schede aperte, immagini caricate, scroll da tastiera)
      lenis.resize();
      lenis.scrollTo(top, { duration: 1.5 });
      return;
    }
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- Menu a schermo intero ---------- */
  const menu = document.getElementById("menu-overlay");
  const toggle = document.querySelector(".menu-toggle");
  const menuClose = menu.querySelector(".menu-close");
  let menuOpen = false;
  let menuTimer = null;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    clearTimeout(menuTimer);
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    lockScroll();
    setInert(true);
    setTimeout(() => menuClose.focus({ preventScroll: true }), 60);
  }
  function closeMenu(restoreFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    setInert(false);
    unlockScroll();
    menuTimer = setTimeout(() => { menu.hidden = true; }, reduceMotion ? 0 : 800);
    if (restoreFocus !== false) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", () => closeMenu());
  menu.addEventListener("keydown", (e) => trapFocus(menu, e));
  mobileQuery.addEventListener("change", (e) => { if (!e.matches) closeMenu(false); });

  /* ---------- Scheda prodotto ---------- */
  const dataNode = document.getElementById("products-data");
  const products = dataNode ? JSON.parse(dataNode.textContent) : {};
  const drawer = document.getElementById("drawer");
  const drawerImg = document.getElementById("drawer-img");
  const drawerSpecs = document.getElementById("drawer-specs");
  const drawerActions = document.getElementById("drawer-actions");
  let drawerOpen = false;
  let drawerTrigger = null;
  let drawerTimer = null;
  let drawerProduct = null;

  function button(label, className) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = label;
    return b;
  }

  function fillDrawer(p) {
    drawerImg.src = p.img;
    drawerImg.alt = p.alt;
    document.getElementById("drawer-collection").textContent = p.collection;
    document.getElementById("drawer-title").textContent = p.name;
    document.getElementById("drawer-desc").textContent = p.desc;

    drawerSpecs.textContent = "";
    const specs = [
      ["Materiale", "Acciaio 316L anallergico"],
      ["Finiture", p.finishes.join(", ")],
      ["Personalizzazione", p.preset ? "Incisione in boutique, in pochi minuti" : (p.custom || "Non prevista")],
      ["Dove trovarlo", "Boutique di Vercelli"]
    ];
    if (p.price) specs.splice(2, 0, ["Prezzo", p.price]);
    specs.forEach(([k, v]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      row.append(dt, dd);
      drawerSpecs.appendChild(row);
    });

    drawerActions.textContent = "";
    const ask = button("Chiedi disponibilità", p.preset ? "btn btn-outline" : "btn");
    ask.dataset.ask = "";
    if (p.preset) {
      const tryIt = button("Prova l'incisione", "btn");
      tryIt.dataset.preset = JSON.stringify(p.preset);
      drawerActions.append(tryIt, ask);
    } else {
      const visit = document.createElement("a");
      visit.className = "btn btn-outline";
      visit.href = "#negozio";
      visit.textContent = "Vieni in boutique";
      drawerActions.append(ask, visit);
    }
  }

  function openDrawer(id, trigger) {
    const p = products[id];
    if (!p) return;
    drawerProduct = p;
    fillDrawer(p);
    clearTimeout(drawerTimer);
    drawerTrigger = trigger || null;
    drawer.hidden = false;
    drawer.querySelector(".drawer-panel").scrollTop = 0;
    void drawer.offsetWidth;
    drawer.classList.add("is-open");
    drawerOpen = true;
    lockScroll();
    setInert(true);
    setTimeout(() => drawer.querySelector(".drawer-close").focus({ preventScroll: true }), 60);
  }
  function closeDrawer(restoreFocus) {
    if (!drawerOpen) return;
    drawerOpen = false;
    drawer.classList.remove("is-open");
    setInert(false);
    unlockScroll();
    drawerTimer = setTimeout(() => { drawer.hidden = true; }, reduceMotion ? 0 : 700);
    if (restoreFocus !== false && drawerTrigger) drawerTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll(".product").forEach((item) => {
    const open = (e) => openDrawer(item.dataset.id, item.querySelector(".product-name") || e.currentTarget);
    item.querySelectorAll(".product-media, .product-name").forEach((b) => b.addEventListener("click", open));
  });
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeDrawer();
    if (e.target.closest("[data-ask]") && drawerProduct && B.contact) {
      B.contact(`Ciao Blooming! Vorrei sapere se è disponibile: ${drawerProduct.name} (${drawerProduct.collection}). Grazie!`);
    }
  });
  drawer.addEventListener("keydown", (e) => trapFocus(drawer, e));

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (drawerOpen) closeDrawer();
    else if (menuOpen) closeMenu();
  });

  /* ---------- Idee pronte: ispirazioni, prodotti, idee regalo ---------- */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-preset]");
    if (!trigger) return;
    e.preventDefault();
    let cfg;
    try { cfg = JSON.parse(trigger.dataset.preset); } catch (err) { return; }
    if (!B.apply) return;
    if (trigger.closest("#incisioni")) { B.apply(cfg); return; }
    if (drawerOpen) closeDrawer(false);
    if (menuOpen) closeMenu(false);
    scrollToEl(document.querySelector(".lab-tray"));
    setTimeout(() => B.apply(cfg), reduceMotion ? 0 : 950);
  });

  /* ---------- Link interni: chiudono i pannelli, scorrono con l'offset giusto, aprono la scheda giusta ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute("data-preset") || e.defaultPrevented) return;
    const hash = link.getAttribute("href");
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (link.dataset.tab && B.selectTab) B.selectTab(link.dataset.tab);
    if (menuOpen) closeMenu(false);
    if (drawerOpen) closeDrawer(false);
    if (hash === "#main") { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    scrollToEl(target);
  });

  /* ---------- Voce del menu attiva in base alla sezione ---------- */
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  if ("IntersectionObserver" in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const a = byId.get(entry.target.id);
        if (a && entry.isIntersecting) navLinks.forEach((l) => l.classList.toggle("is-current", l === a));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    byId.forEach((a, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Mappa caricata solo su richiesta (nessun cookie di Google all'apertura) ---------- */
  const map = document.getElementById("map");
  const mapButton = document.getElementById("map-load");
  if (map && mapButton) {
    mapButton.addEventListener("click", () => {
      if (map.querySelector("iframe")) return;
      const frame = document.createElement("iframe");
      frame.title = "Mappa: boutique Blooming nel Centro Commerciale Carrefour di Vercelli";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.src = map.dataset.src;
      let shown = false;
      const reveal = () => {
        if (shown) return;
        shown = true;
        map.classList.add("is-loaded");
        frame.focus({ preventScroll: true });
      };
      frame.addEventListener("load", reveal, { once: true });
      setTimeout(reveal, 3000);
      map.appendChild(frame);
    });
  }

  /* ---------- Anteprima compatta del Lab su mobile ---------- */
  const mini = document.getElementById("lab-mini");
  const tray = document.querySelector(".lab-tray");
  const labForm = document.getElementById("lab-form");
  if (mini && tray && labForm && "IntersectionObserver" in window) {
    let trayVisible = true;
    let formVisible = false;
    const sync = () => mini.classList.toggle("is-visible", mobileQuery.matches && formVisible && !trayVisible);
    new IntersectionObserver(([entry]) => { trayVisible = entry.isIntersecting; sync(); }, { threshold: 0.2 }).observe(tray);
    new IntersectionObserver(([entry]) => { formVisible = entry.isIntersecting; sync(); }, { rootMargin: "-140px 0px -35% 0px" }).observe(labForm);
    mobileQuery.addEventListener("change", sync);
    mini.addEventListener("click", () => scrollToEl(tray));
  }

  /* ---------- Barra azioni su mobile ---------- */
  const heroSection = document.querySelector(".hero");
  const lab = document.getElementById("incisioni");
  if (mobileBar && "IntersectionObserver" in window) {
    const state = { hero: true, lab: false, footer: false };
    const sync = () => mobileBar.classList.toggle("is-visible", !state.hero && !state.lab && !state.footer);
    const watch = (node, key) => new IntersectionObserver(([entry]) => { state[key] = entry.isIntersecting; sync(); }, { threshold: 0.05 }).observe(node);
    watch(heroSection, "hero");
    watch(lab, "lab");
    watch(footer, "footer");
  }
})();
