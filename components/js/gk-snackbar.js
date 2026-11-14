export function mountPopupMenu(options = {}) {
  const opts = {
    parent: options.parent ?? document.body,
    className: options.className ?? "gk-snackbar",
    delayMs: options.delayMs ?? 850,

    title: options.title ?? "Grant Kopczenski",
    subtitle: options.subtitle ?? "",
    subtitleSecondary: options.subtitleSecondary ?? "",

    subtitleCycleMs: options.subtitleCycleMs ?? 8000,
    subtitleFirstCycleMs: options.subtitleFirstCycleMs ?? 5500,
  };

  const el = document.createElement("div");
  el.className = opts.className;
  el.setAttribute("data-state", "hidden");
  el.setAttribute("data-intro", "1");
  el.setAttribute("data-subtitle", "a");

  const inner = document.createElement("div");
  inner.className = "gk-snackbar__inner";

  const identity = document.createElement("div");
  identity.className = "gk-snackbar__identity";

  const title = document.createElement("div");
  title.className = "gk-snackbar__title";
  title.textContent = opts.title;

  const subtitleWrap = document.createElement("div");
  subtitleWrap.className = "gk-snackbar__subtitle-wrap";

  const subtitle = document.createElement("div");
  subtitle.className = "gk-snackbar__subtitle";
  subtitle.textContent = opts.subtitle;

  const secondary = document.createElement("div");
  secondary.className =
    "gk-snackbar__subtitle gk-snackbar__subtitle--secondary";
  secondary.textContent = opts.subtitleSecondary;

  subtitleWrap.append(subtitle, secondary);
  identity.append(title, subtitleWrap);

  const nav = document.createElement("nav");
  nav.className = "gk-snackbar__nav";
  nav.setAttribute("aria-label", "Main navigation");

  const links = [
    { label: "Projects", href: "#projects" },
    { label: "Photos", href: "#photos" },
    { label: "3D Prints", href: "#prints" },
  ];

  for (const item of links) {
    const a = document.createElement("a");
    a.className = "gk-snackbar__btn";
    a.href = item.href;
    a.textContent = item.label;
    nav.appendChild(a);
  }

  // =========================================
  // MOBILE MENU BUTTON
  // =========================================

  const menuToggle = document.createElement("button");

  menuToggle.className = "gk-snackbar__menu-toggle";
  menuToggle.type = "button";

  menuToggle.setAttribute("aria-label", "Open navigation");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-controls", "gk-mobile-nav");

  menuToggle.innerHTML = `
    <span class="gk-snackbar__menu-line"></span>
    <span class="gk-snackbar__menu-line"></span>
    <span class="gk-snackbar__menu-line"></span>
  `;

  nav.id = "gk-mobile-nav";

  inner.append(identity, menuToggle, nav);
  el.appendChild(inner);
  opts.parent.appendChild(el);

  /* =========================================
     MOBILE MENU INTERACTIONS
  ========================================= */

  let menuOpen = false;

  function setMenuOpen(open) {
    menuOpen = open;

    el.classList.toggle("is-menu-open", open);

    menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );
  }

  function toggleMenu() {
    setMenuOpen(!menuOpen);
  }

  function onDocumentClick(event) {
    if (
      menuOpen &&
      !el.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  }

  function onDocumentKeydown(event) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener("click", toggleMenu);

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener(
    "pointerdown",
    onDocumentClick
  );

  document.addEventListener(
    "keydown",
    onDocumentKeydown
  );

  /* =========================================
     MOBILE SCROLL POSITIONING
  ========================================= */

  const mobileBreakpoint = window.matchMedia(
    "(max-width: 760px)"
  );

  function updateMobileNavigation() {
    const styles = getComputedStyle(el);

    const offset =
      parseFloat(
        styles.getPropertyValue(
          "--gk-mobile-bottom-offset"
        )
      ) || 16;

    // The navbar's height stays constant
    // regardless of whether it's docked.
    const navbarHeight = el.offsetHeight;

    // Initial position at the bottom
    // of the viewport / hero.
    const startY = Math.max(
      0,
      window.innerHeight - navbarHeight - offset
    );

    const scrollY = Math.max(0, window.scrollY);

    // Move upward exactly one pixel
    // for each pixel scrolled.
    //
    // Once the navbar reaches the top,
    // prevent it from moving any farther.
    const currentY = Math.max(
      0,
      startY - scrollY
    );

    el.style.setProperty(
      "--gk-mobile-y",
      `${currentY}px`
    );

    const isDocked = currentY <= 0;

    const layout = isDocked
      ? "docked"
      : "floating";

    if (el.dataset.layout !== layout) {
      el.dataset.layout = layout;
    }
  }

  /* =========================================
     SCROLL-DRIVEN NAVIGATION
  ========================================= */

  let scrollTicking = false;
  let resizeTicking = false;
  let measured = false;

  let identityStart = { x: 0, y: 0 };
  let navigationStart = { x: 0, y: 0 };

  const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

  function getFloatingOffset() {
    return (
      parseFloat(
        getComputedStyle(el).getPropertyValue(
          "--gk-nav-float-offset"
        )
      ) || 28
    );
  }

  function measureNavigation() {

    if (mobileBreakpoint.matches) {
      measured = false;
      updateMobileNavigation();
      return;
    }

    // Temporarily put both cards into their
    // original docked positions for measurement.

    el.style.setProperty("--gk-identity-x", "0px");
    el.style.setProperty("--gk-identity-y", "0px");

    el.style.setProperty("--gk-navigation-x", "0px");
    el.style.setProperty("--gk-navigation-y", "0px");

    const identityRect = identity.getBoundingClientRect();
    const navigationRect = nav.getBoundingClientRect();

    const snackbarRect = el.getBoundingClientRect();

    const identityLeft =
      identityRect.left - snackbarRect.left;
      
    const identityBottom =
      identityRect.bottom - snackbarRect.top;
      
    const navigationRight =
      navigationRect.right - snackbarRect.left;
      
    const navigationBottom =
      navigationRect.bottom - snackbarRect.top;

    const offset = getFloatingOffset();

    const mobileLift =
      parseFloat(
        getComputedStyle(el).getPropertyValue(
          "--gk-nav-mobile-lift"
        )
      ) || 0;

    // Position both bubbles at the bottom
    // corners of the initial viewport.

    identityStart = {
      x: offset + 18 - identityLeft,
    
      y:
        window.innerHeight -
        offset -
        14 -
        identityBottom,
    };

    navigationStart = {
      x:
        window.innerWidth -
        offset -
        14 -
        navigationRight,
    
      y:
        window.innerHeight -
        offset -
        12 -
        navigationBottom,
    };

    measured = true;

    updateNavigation();
  }

  function updateNavigation() {
    if (mobileBreakpoint.matches) {
      updateMobileNavigation();
      return;
    }

    if (!measured) return;

    const scroll = Math.max(0, window.scrollY);

    // Each card moves upward with scrolling.
    // Once it reaches its navbar position,
    // the vertical offset stops at zero.

    const identityY = Math.max(
      0,
      identityStart.y - scroll
    );

    const navigationY = Math.max(
      0,
      navigationStart.y - scroll
    );

    // Horizontal movement is proportional
    // to the remaining vertical distance.

    const identityRemaining =
      identityStart.y > 0
        ? identityY / identityStart.y
        : 0;

    const navigationRemaining =
      navigationStart.y > 0
        ? navigationY / navigationStart.y
        : 0;

    const identityX =
      identityStart.x * identityRemaining;

    const navigationX =
      navigationStart.x * navigationRemaining;

    // Apply GPU-friendly transforms.

    el.style.setProperty(
      "--gk-identity-x",
      `${identityX}px`
    );

    el.style.setProperty(
      "--gk-identity-y",
      `${identityY}px`
    );

    el.style.setProperty(
      "--gk-navigation-x",
      `${navigationX}px`
    );

    el.style.setProperty(
      "--gk-navigation-y",
      `${navigationY}px`
    );

    // Overall merging progress.

    const totalTravel = Math.max(
      identityStart.y,
      navigationStart.y,
      1
    );

    const progress = clamp(
      scroll / totalTravel,
      0,
      1
    );

    // Begin merging backgrounds during
    // the final 20% of movement.

    const mergeProgress = clamp(
      (progress - 0.8) / 0.2,
      0,
      1
    );

    el.style.setProperty(
      "--gk-shell-opacity",
      mergeProgress
    );

    el.style.setProperty(
      "--gk-bubble-opacity",
      1 - mergeProgress
    );

    el.setAttribute(
      "data-layout",
      progress >= 1 ? "docked" : "floating"
    );
  }

  function onScroll() {
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
      updateNavigation();
      scrollTicking = false;
    });
  }

  function onResize() {
    if (resizeTicking) return;

    resizeTicking = true;

    requestAnimationFrame(() => {
      measureNavigation();
      resizeTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, {
    passive: true,
  });

  window.addEventListener("resize", onResize);


  let subtitleTimer = null;
  let subtitleFirstTimer = null;
  let subtitleState = "a";
  let introTimer = null;

  function stopSubtitleCycle() {
    if (subtitleFirstTimer !== null) {
      clearTimeout(subtitleFirstTimer);
      subtitleFirstTimer = null;
    }

    if (subtitleTimer !== null) {
      clearInterval(subtitleTimer);
      subtitleTimer = null;
    }
  }

  function startSubtitleCycle() {
    if (!opts.subtitleSecondary || opts.subtitleCycleMs <= 0) return;

    stopSubtitleCycle();

    const firstMs = Math.max(
      0,
      Math.min(
        opts.subtitleFirstCycleMs,
        opts.subtitleCycleMs
      )
    );

    function flip() {
      subtitleState = subtitleState === "a" ? "b" : "a";
      el.setAttribute("data-subtitle", subtitleState);
    }

    if (firstMs > 0 && firstMs < opts.subtitleCycleMs) {
      subtitleFirstTimer = window.setTimeout(() => {
        subtitleFirstTimer = null;
        flip();

        subtitleTimer = window.setInterval(
          flip,
          opts.subtitleCycleMs
        );
      }, firstMs);
    } else {
      subtitleTimer = window.setInterval(
        flip,
        opts.subtitleCycleMs
      );
    }
  }

  function show() {
    el.setAttribute("data-state", "visible");

    measureNavigation();
    startSubtitleCycle();

    introTimer = window.setTimeout(() => {
      el.removeAttribute("data-intro");
      introTimer = null;
    }, 2000);
  }

  function hide() {
    el.setAttribute("data-state", "hidden");
    stopSubtitleCycle();

    if (introTimer !== null) {
      clearTimeout(introTimer);
      introTimer = null;
    }
  }

  function setText(nextTitle, nextSubtitle, nextSecondary = "") {
    title.textContent = String(nextTitle ?? "");
    subtitle.textContent = String(nextSubtitle ?? "");
    secondary.textContent = String(nextSecondary ?? "");

    opts.subtitleSecondary = String(nextSecondary ?? "");

    subtitleState = "a";
    el.setAttribute("data-subtitle", "a");

    startSubtitleCycle();
  }

  function destroy() {
    stopSubtitleCycle();

    menuToggle.removeEventListener("click", toggleMenu);

    document.removeEventListener(
      "pointerdown",
      onDocumentClick
    );

    document.removeEventListener(
      "keydown",
      onDocumentKeydown
    );

    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);

    if (introTimer !== null) {
      clearTimeout(introTimer);
      introTimer = null;
    }

    el.remove();
  }

  const delayTimer = window.setTimeout(show, opts.delayMs);

  return {
    el,
    show,
    hide,
    setText,
    destroy: () => {
      clearTimeout(delayTimer);
      destroy();
    },
  };
}