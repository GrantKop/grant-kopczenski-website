// components/js/gk-image-showcase.js

/**
 * Start a fullscreen-ish slideshow inside `parent` using Option B.
 * It loads `${folder}/${indexFile}` which must be `{ images: ["a.jpg", ...] }`.
 *
 * @param {ShowcaseOptions} options
 * @returns {Promise<{
 *   next: () => void,
 *   prev: () => void,
 *   goTo: (i:number) => void,
 *   pause: () => void,
 *   resume: () => void,
 *   destroy: () => void,
 *   getIndex: () => number,
 *   getSlides: () => {thumb:string, full:string}[],
 *   setFolder: (folder:string, opts?: {shuffle?: boolean, startIndex?: number}) => Promise<void>,
 * }>}
 */
export async function startShowcase(options) {
  const opts = normalizeOptions(options);

  const parent = opts.parent ?? document.body;

  const root = document.createElement("div");
  root.className = "gk-img-showcase";
  parent.appendChild(root);

  const a = document.createElement("img");
  const b = document.createElement("img");
  a.className = "gk-img-showcase__layer";
  b.className = "gk-img-showcase__layer";

  root.append(a, b);

  let overlayEl = null;
  if (opts.overlay) {
    overlayEl = document.createElement("div");
    overlayEl.className = "gk-img-showcase__overlay";
    if (opts.overlayCss) overlayEl.style.cssText += opts.overlayCss;
    root.appendChild(overlayEl);
  }

  const imageCache = new Map();

  function warmImage(url) {
    if (imageCache.has(url)) return imageCache.get(url);

    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;

      const done = () => resolve();
      if (img.decode) img.decode().then(done).catch(done);
      else { img.onload = done; img.onerror = done; }
    });

    imageCache.set(url, p);
    return p;
  }

  const conn = navigator.connection;
  const saveData = !!conn?.saveData;
  const slowNet = /2g/.test(conn?.effectiveType || "");

  function trimCache() {
    const MAX = 24;
    if (imageCache.size > MAX) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
  }

  let slides = [];
  let index = 0;
  let topIsA = true;
  let timer = null;
  let firstTimer = null;
  let paused = false;
  let navToken = 0;
  let folderToken = 0;

  function getIndex() { return index; }
  function getSlides() { return slides.slice(); }

  function stopTimer() {
    if (firstTimer != null) { window.clearTimeout(firstTimer); firstTimer = null; }
    if (timer != null) { window.clearInterval(timer); timer = null; }
  }

  function startTimer() {
    if (opts.intervalMs <= 0) return;
    stopTimer();

    const firstMs = Math.max(0, Math.min(opts.firstIntervalMs ?? opts.intervalMs, opts.intervalMs));
    if (firstMs > 0 && firstMs < opts.intervalMs) {
      firstTimer = window.setTimeout(() => {
        firstTimer = null;
        next();
        if (!paused) timer = window.setInterval(next, opts.intervalMs);
      }, firstMs);
    } else {
      timer = window.setInterval(next, opts.intervalMs);
    }
  }

  function pause() { paused = true; stopTimer(); }
  function resume() { if (!paused) return; paused = false; startTimer(); }


  async function goTo(i) {
    if (!slides.length) return;

    const myToken = ++navToken;
    index = clampIndex(i, slides.length);

    const slide = slides[index];
    const incoming = topIsA ? b : a;
    const outgoing = topIsA ? a : b;

    // Decode the full image before displaying it.
    await setSrcDecoded(incoming, slide.full);

    if (myToken !== navToken) return;

    // Begin the crossfade only after decoding.
    incoming.classList.remove("is-thumb");
    incoming.classList.add("is-visible");
    outgoing.classList.remove("is-visible");

    topIsA = !topIsA;

    warmNeighbors();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function warmNeighbors() {
    if (saveData) return;
    if (!slides.length) return;

    const nextIdx = clampIndex(index + 1, slides.length);
    warmImage(slides[nextIdx].thumb);
    if (!slowNet) warmImage(slides[nextIdx].full);

    trimCache();
  }

  async function loadFolder(folder, { shuffle = opts.shuffle, startIndex: start = 0 } = {}) {
    if (!folder) throw new Error("Showcase: folder is required");

    const myFolderToken = ++folderToken;

    const folderUrl = ensureTrailingSlash(folder);
    const indexUrl = folderUrl + (opts.indexFile || "index.json");

    const res = await fetch(indexUrl, { cache: opts.cache });
    if (!res.ok) throw new Error(`Showcase: failed to load ${indexUrl} (HTTP ${res.status})`);

    const data = await res.json();
    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      throw new Error(`Showcase: ${indexUrl} must contain { "images": [ ... ] }`);
    }

    let nextSlides = data.images.map((name) => {
      const full = folderUrl + encodePathPiece(name);
      const thumb = folderUrl + "thumbs/" + encodePathPiece(name);
      return { thumb, full };
    });

    if (shuffle) nextSlides = shuffleInPlace(nextSlides.slice());

    if (myFolderToken !== folderToken) return;

    slides = nextSlides;
    index = clampIndex(start, slides.length);

    const activeLayer = topIsA ? a : b;

    activeLayer.classList.add("is-thumb");
    await setSrcDecoded(activeLayer, slides[index].thumb);
    if (myFolderToken !== folderToken) return;

    activeLayer.classList.add("is-visible");
    root.classList.add("is-ready");

    await setSrcDecoded(activeLayer, slides[index].full);
    if (myFolderToken !== folderToken) return;

    activeLayer.classList.remove("is-thumb");

    warmNeighbors();

    if (!paused) startTimer();
  }

  async function setFolder(folder, opts2) {
    try {
      await loadFolder(folder, opts2);
    } catch (e) {
      console.error(e);
    }
  }

  function destroy() {
    stopTimer();
    root.remove();
  }

  await loadFolder(opts.folder, { shuffle: opts.shuffle, startIndex: opts.startIndex });

  startTimer();

  return { next, prev, goTo, pause, resume, destroy, getIndex, getSlides, setFolder };
}


function normalizeOptions(o = {}) {
  if (!o.folder) throw new Error("Showcase: folder is required");
  return {
    folder:     o.folder,
    parent:     o.parent,
    intervalMs: typeof o.intervalMs === "number" ? o.intervalMs : 8000,
    firstIntervalMs: typeof o.firstIntervalMs === "number" ? o.firstIntervalMs : 4500,
    fadeMs:     typeof o.fadeMs === "number" ? o.fadeMs : 900,
    shuffle:    o.shuffle !== false,
    overlay:    o.overlay !== false,
    overlayCss: typeof o.overlayCss === "string" ? o.overlayCss : "",
    startIndex: typeof o.startIndex === "number" ? o.startIndex : 0,
    indexFile:  typeof o.indexFile === "string" ? o.indexFile : "index.json",
    cache:      o.cache ?? "no-store",
  };
}

async function setSrcDecoded(imgEl, url) {
  imgEl.src = url;
  if (imgEl.decode) {
    await imgEl.decode().catch(() => {});
  } else {
    await new Promise((res) => {
      imgEl.onload = () => res();
      imgEl.onerror = () => res();
    });
  }
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clampIndex(i, len) {
  if (len <= 0) return 0;
  const n = Math.floor(i);
  return ((n % len) + len) % len;
}

function ensureTrailingSlash(s) {
  return s.endsWith("/") ? s : s + "/";
}

function encodePathPiece(name) {
  return name.split("/").map(encodeURIComponent).join("/");
}
