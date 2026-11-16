import { loadTemplate } from "/components/js/gk-templates.js";

export async function renderOptionsPanel(panelConfig, { panelEl, panel }) {
  const pad = document.createElement("div");
  pad.className = "gk-popup-panel__pad";

  const grid = document.createElement("div");
  grid.className = "gk-options";
  pad.appendChild(grid);
  panelEl.appendChild(pad);

  const items =
    panelConfig?.options ??
    panelConfig?.data?.options ??
    panelConfig?.cards ??
    panelConfig?.data?.cards ??
    [];

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "8px 0";
    empty.textContent = "No options yet.";
    pad.appendChild(empty);
    return;
  }

  const opts = items.slice(0, 4);
  grid.setAttribute("data-count", String(opts.length));

  const tpl = await loadTemplate("/components/html/gk-option.html", "gk-option");

  for (const o of opts) {
    const el = tpl.content.firstElementChild.cloneNode(true);

    const media = el.querySelector(".gk-option__media");
    const img = el.querySelector(".gk-option__img");
    const title = el.querySelector(".gk-option__title");
    const subtitle = el.querySelector(".gk-option__subtitle");

    title.textContent = o.title ?? "";
    subtitle.textContent = o.subtitle ?? o.desc ?? "";

    if (o.img) {
      img.src = o.img;
      img.alt = o.alt ?? o.title ?? "";
    } else {
      img?.remove();
      media?.classList.add("gk-option__media--placeholder");
    }

    const hasPanelId = typeof o.panelId === "string" && o.panelId.length > 0;
    const hasHref = typeof o.href === "string" && o.href.length > 0 && o.href !== "#";

    if (hasPanelId) {
      el.removeAttribute("href");
      el.setAttribute("role", "button");
      el.style.cursor = "pointer";

      el.addEventListener("click", (e) => {
        e.preventDefault();
        panel?.routeTo(o.panelId, o.title ?? o.panelId);
      });
    } else if (hasHref) {
      el.href = o.href;
    } else {
      el.removeAttribute("href");
      el.setAttribute("role", "article");
      el.style.cursor = "default";
    }

    grid.appendChild(el);
  }
}
