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

  inner.append(identity, nav);
  el.appendChild(inner);
  opts.parent.appendChild(el);

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