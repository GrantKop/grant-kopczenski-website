
import {
  mountPopupMenu
} from "/components/js/gk-snackbar.js?v=1.0.0";

import {
  mountHomeProjects
} from "/components/js/gk-home-projects.js?v=1.0.0";

import {
  PANELS
} from "/components/js/gk-panels.js?v=1.0.0";

import {
  renderPanelByType
} from "/components/js/gk-panel-renderers.js?v=1.0.0";

import {
  startShowcase
} from "/components/js/gk-image-showcase.js?v=1.0.0";

// =========================================
// NAVIGATION
// =========================================

mountPopupMenu({
  parent: document.getElementById("site-navigation"),

  delayMs: 850,

  title: "Grant Kopczenski",

  subtitle: "Software Developer | Photographer",

  subtitleSecondary:
    "Project Portfolio | Photograph Album",

  subtitleCycleMs: 8000,
  subtitleFirstCycleMs: 5500,
});

// =========================================
// PROJECTS
// =========================================

mountHomeProjects({
  parent: document.getElementById("projects-view"),
  panels: PANELS,
  renderPanel: renderPanelByType,
  initialPanelId: "home_projects_all",
});

// =========================================
// PHOTOGRAPHY
// =========================================

renderPanelByType(PANELS.home_photos, {
  panelEl: document.getElementById("photos-content"),
  panel: null,
});

// =========================================
// 3D PRINTS
// =========================================

renderPanelByType(PANELS.home_prints, {
  panelEl: document.getElementById("prints-content"),
  panel: null,
});

// =========================================
// FOOTER
// =========================================

document.getElementById("footer-year").textContent =
  new Date().getFullYear();

// =========================================
// IMAGE SHOWCASE
// =========================================

startShowcase({
  parent: document.getElementById("bg"),
  folder: "images/",
  intervalMs: 8000,
  firstIntervalMs: 4500,
  fadeMs: 900,
  shuffle: true,
  overlay: true,
}).catch(console.error);
