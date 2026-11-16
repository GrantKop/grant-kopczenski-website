
export function mountHomeProjects({
  parent,
  panels,
  renderPanel,
  initialPanelId = "home_projects_all",
}) {
  if (!parent) {
    throw new Error("mountHomeProjects requires a parent element");
  }

  if (!panels || typeof panels !== "object") {
    throw new Error("mountHomeProjects requires the PANELS object");
  }

  if (typeof renderPanel !== "function") {
    throw new Error("mountHomeProjects requires a renderPanel function");
  }

  // =========================================
  // HEADING
  // =========================================

  const section = parent.closest(".gk-home-projects");
  const heading = section?.querySelector(
    ".gk-home-section__heading"
  );

  const headingTitle = heading?.querySelector("h2");
  const headingSubtitle = heading?.querySelector("p");

  const defaultHeading = {
    title: headingTitle?.textContent.trim() ?? "Projects",
    subtitle: headingSubtitle?.textContent.trim() ?? "",
  };

  // Find headings from option definitions.
  const optionHeadings = new Map();

  for (const config of Object.values(panels)) {
    const options =
      config?.options ??
      config?.data?.options ??
      [];

    for (const option of options) {
      if (!option?.panelId) continue;

      optionHeadings.set(option.panelId, {
        title: option.title,
        subtitle: option.subtitle ?? option.desc,
      });
    }
  }

  function updateHeading(panelId, animate = true) {
    if (!heading || !headingTitle || !headingSubtitle) return;

    const config = panels[panelId];

    const isHome = panelId === initialPanelId;

    const option = optionHeadings.get(panelId);

    const title = isHome
      ? defaultHeading.title
      : option?.title ?? config?.menuTitle ?? defaultHeading.title;

    const subtitle = isHome
      ? defaultHeading.subtitle
      : option?.subtitle ?? config?.menuSubtitle ?? defaultHeading.subtitle;

    headingTitle.textContent = title;
    headingSubtitle.textContent = subtitle;

    heading.classList.remove("gk-heading-animate");

    if (animate) {
      // Restart the animation.
      void heading.offsetWidth;
      heading.classList.add("gk-heading-animate");
    }
  }

  // =========================================
  // PANEL NAVIGATION
  // =========================================

  const history = [initialPanelId];
  let renderToken = 0;

  function currentPanelId() {
    return history[history.length - 1];
  }

  function goBack() {
    if (history.length <= 1) return;

    history.pop();
    renderCurrent();
  }

  function navigate(panelId) {
    if (!panels[panelId]) {
      console.warn(`Unknown project panel: ${panelId}`);
      return;
    }

    history.push(panelId);
    renderCurrent();
  }

  // =========================================
  // RENDERING
  // =========================================

  async function renderCurrent(animate = true) {
    const token = ++renderToken;

    const panelId = currentPanelId();
    const config = panels[panelId];

    // Update the heading whenever the panel changes.
    updateHeading(panelId, animate);

    parent.replaceChildren();

    if (!config) {
      const error = document.createElement("p");
      error.className = "gk-home-projects__error";
      error.textContent =
        `Unable to load project section: ${panelId}`;

      parent.appendChild(error);
      return;
    }

    if (history.length > 1) {
      const toolbar = document.createElement("div");
      toolbar.className = "gk-home-projects__toolbar";

      const back = document.createElement("button");
      back.type = "button";
      back.className = "gk-home-projects__back";

      back.innerHTML = `
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        <span>Back</span>
      `;

      back.addEventListener("click", goBack);

      toolbar.appendChild(back);
      parent.appendChild(toolbar);
    }

    const content = document.createElement("div");
    content.className = "gk-home-projects__content";

    if (!animate) {
      content.classList.add("gk-no-animation");
    }

    parent.appendChild(content);

    try {
      await renderPanel(config, {
        panelEl: content,
        panel: {
          routeTo: (nextPanelId) => navigate(nextPanelId),
          goBack,
        },
      });

      // Ignore stale renders.
      if (token !== renderToken) return;

    } catch (error) {
      if (token !== renderToken) return;

      console.error(
        `Failed to render project panel "${panelId}"`,
        error
      );

      content.replaceChildren();

      const message = document.createElement("p");
      message.className = "gk-home-projects__error";
      message.textContent =
        "This project section could not be loaded.";

      content.appendChild(message);
    }
  }

  // Initial render without heading animation.
  renderCurrent(false);

  return {
    navigate,
    goBack,

    destroy() {
      renderToken++;
      parent.replaceChildren();

      if (heading) {
        heading.classList.remove("gk-heading-animate");
      }
    },
  };
}
