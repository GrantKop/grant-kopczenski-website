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

  async function renderCurrent() {
    const token = ++renderToken;
    const panelId = currentPanelId();
    const config = panels[panelId];

    parent.replaceChildren();

    if (!config) {
      const error = document.createElement("p");
      error.className = "gk-home-projects__error";
      error.textContent = `Unable to load project section: ${panelId}`;
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

      const currentTitle = document.createElement("span");
      currentTitle.className = "gk-home-projects__current-title";
      currentTitle.textContent = config.menuTitle ?? "";

      toolbar.append(back, currentTitle);
      parent.appendChild(toolbar);
    }

    const content = document.createElement("div");
    content.className = "gk-home-projects__content";
    parent.appendChild(content);

    try {
      await renderPanel(config, {
        panelEl: content,
        panel: {
          routeTo: (nextPanelId) => navigate(nextPanelId),
          goBack,
        },
      });

      // Ignore a renderer finishing after the visitor has navigated elsewhere.
      if (token !== renderToken) return;
    } catch (error) {
      console.error(`Failed to render project panel "${panelId}"`, error);

      if (token !== renderToken) return;

      content.replaceChildren();

      const message = document.createElement("p");
      message.className = "gk-home-projects__error";
      message.textContent = "This project section could not be loaded.";

      content.appendChild(message);
    }
  }

  renderCurrent();

  return {
    navigate,
    goBack,
    destroy() {
      renderToken++;
      parent.replaceChildren();
    },
  };
}