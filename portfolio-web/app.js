const DATA = window.PORTFOLIO_DATA;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let galleryState = { project: null, index: 0, mode: "grid" };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function allProjects() {
  return DATA.sections.flatMap((section) => section.projects.map((project) => ({ ...project, section })));
}

function findProject(title) {
  return allProjects().find((project) => project.title === title);
}

function findPiece(id) {
  for (const project of allProjects()) {
    const piece = project.pieces.find((item) => item.id === id);
    if (piece) return { piece, project };
  }
  return null;
}

function imageMarkup(item, className = "media") {
  if (item.preview) {
    return `<img class="${className}" src="${escapeHtml(item.preview)}" alt="${escapeHtml(item.title)}" loading="lazy">`;
  }
  return `<div class="${className} media-placeholder"><span>${escapeHtml(item.extension || "Media")}</span></div>`;
}

function imageFullMarkup(item, className = "media") {
  const source = item.full || item.original || item.preview;
  if (source) {
    return `<img class="${className}" src="${escapeHtml(source)}" alt="${escapeHtml(item.title)}" loading="lazy">`;
  }
  return imageMarkup(item, className);
}

function videoPosterMarkup(item, className = "video-poster") {
  return `
    <button class="${className}" data-load-video="${escapeHtml(item.id)}">
      ${imageMarkup(item, "video-poster-image")}
      <span class="inline-play">Play</span>
    </button>
  `;
}

function youtubeEmbedSrc(piece) {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (window.location.origin && window.location.origin !== "null") {
    params.set("origin", window.location.origin);
    params.set("widget_referrer", window.location.href);
  }
  return `${piece.embedUrl}?${params.toString()}`;
}

function youtubeEmbedMarkup(piece) {
  const wrapper = document.createElement("div");
  wrapper.className = "youtube-embed";

  const iframe = document.createElement("iframe");
  iframe.className = "youtube-frame";
  iframe.title = piece.title;
  iframe.loading = "eager";
  iframe.referrerPolicy = "origin";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.src = youtubeEmbedSrc(piece);

  const fallback = document.createElement("a");
  fallback.className = "youtube-fallback";
  fallback.href = piece.youtubeUrl;
  fallback.target = "_blank";
  fallback.rel = "noopener";
  fallback.textContent = "Abrir en YouTube";

  wrapper.append(iframe, fallback);
  return wrapper;
}

function mediaMarkup(item, className = "media") {
  return item.type === "video" ? videoPosterMarkup(item, className) : imageMarkup(item, className);
}

function projectType(project) {
  if (project.kind === "gallery") return "Galeria";
  if (project.pieces.length > 1) return `${project.pieces.length} videos`;
  return project.main.type === "video" ? "Video" : "Imagen";
}

function renderHome() {
  const sectionsNode = $("#homeSections");
  if (!sectionsNode) return;

  sectionsNode.innerHTML = DATA.sections.map((section) => {
    const visualProject = section.projects.find((project) => project.main.preview) || section.projects[0];
    return `
      <a class="section-card reveal" href="${escapeHtml(section.href)}" style="--accent:${section.accent}">
        <div class="section-thumb">
          ${imageMarkup(visualProject.main, "section-media")}
        </div>
        <div class="section-card-copy">
          <p class="eyebrow">${escapeHtml(section.kicker)}</p>
          <h3>${escapeHtml(section.title)}</h3>
          <span>${section.projects.length} proyectos</span>
        </div>
      </a>
    `;
  }).join("");
}

function galleryProjectCard(project, section) {
  return `
    <article class="project-card gallery-project reveal" style="--accent:${section.accent}">
      <a class="project-cover" href="${escapeHtml(project.galleryHref)}">
        ${imageMarkup(project.main, "project-media")}
        <span class="play-badge">Abrir galeria</span>
      </a>
      <div class="project-content">
        <p class="eyebrow">${escapeHtml(projectType(project))}</p>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description)}</p>
        <div class="project-actions">
          <a class="text-button" href="${escapeHtml(project.galleryHref)}">Ver grilla</a>
          <span class="micro-meta">${project.pieces.length} imagenes</span>
        </div>
      </div>
    </article>
  `;
}

function videoProjectCard(project, section) {
  const hasMany = project.pieces.length > 1;
  const pieces = project.pieces.map((piece) => `
    <li class="piece-row video-piece">
      <div class="piece-video-wrap">${videoPosterMarkup(piece, "piece-video-poster")}</div>
      <div class="piece-copy">
        <strong>${escapeHtml(piece.title)}</strong>
        <span>${piece.provider === "youtube" ? "YouTube" : `${escapeHtml(piece.extension)} · ${piece.sizeMb} MB`}</span>
      </div>
    </li>
  `).join("");

  return `
    <article class="project-card reveal" style="--accent:${section.accent}">
      <div class="project-cover video-cover">
        ${videoPosterMarkup(project.main, "project-video-poster")}
      </div>
      <div class="project-content">
        <p class="eyebrow">${escapeHtml(projectType(project))}</p>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description)}</p>
        <div class="project-actions">
          ${hasMany ? `<button class="text-button muted" data-toggle-project>Ver ${project.pieces.length} piezas</button>` : `<span class="micro-meta">Pieza principal</span>`}
        </div>
      </div>
      ${hasMany ? `
        <div class="pieces-panel" hidden>
          <ul>${pieces}</ul>
        </div>
      ` : ""}
    </article>
  `;
}

function projectCard(project, section) {
  return project.kind === "gallery" ? galleryProjectCard(project, section) : videoProjectCard(project, section);
}

function renderSectionPage() {
  const slug = document.body.dataset.section;
  const section = DATA.sections.find((item) => item.slug === slug);
  if (!section) return;

  document.documentElement.style.setProperty("--page-accent", section.accent);
  $("#sectionHero").innerHTML = `
    <div>
      <p class="eyebrow">${escapeHtml(section.kicker)}</p>
      <h1>${escapeHtml(section.title)}</h1>
    </div>
    <p>${escapeHtml(section.description)}</p>
  `;
  $("#projectCount").textContent = `${section.projects.length} proyectos`;
  $("#projectsGrid").innerHTML = section.projects.map((project) => projectCard(project, section)).join("");
}

function renderGalleryPage() {
  const projectTitle = document.body.dataset.project;
  const project = findProject(projectTitle);
  if (!project) return;

  galleryState = { project, index: 0, mode: "grid" };
  $("#galleryHero").innerHTML = `
    <div>
      <p class="eyebrow">Galeria</p>
      <h1>${escapeHtml(project.title)}</h1>
    </div>
    <p>${escapeHtml(project.description)} ${project.pieces.length} imagenes.</p>
  `;
  renderGallery();
}

function renderGallery() {
  const root = $("#galleryRoot");
  const { project, index, mode } = galleryState;
  if (!root || !project) return;

  $("[data-gallery-mode='grid']")?.classList.toggle("muted", mode !== "grid");
  $("[data-gallery-mode='carousel']")?.classList.toggle("muted", mode !== "carousel");

  if (mode === "carousel") {
    const piece = project.pieces[index];
    root.innerHTML = `
      <div class="carousel-view">
        <button class="carousel-nav" data-carousel-prev>Anterior</button>
        <figure class="carousel-frame">
          ${imageFullMarkup(piece, "carousel-image")}
          <figcaption>
            <span>${escapeHtml(piece.title)}</span>
            <span>${index + 1} / ${project.pieces.length}</span>
          </figcaption>
        </figure>
        <button class="carousel-nav" data-carousel-next>Siguiente</button>
        <button class="carousel-fullscreen" data-carousel-fullscreen>Pantalla completa</button>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="gallery-grid">
      ${project.pieces.map((piece, pieceIndex) => `
        <button class="gallery-tile reveal is-visible" data-gallery-index="${pieceIndex}">
          ${imageMarkup(piece, "gallery-image")}
          <span>${escapeHtml(piece.title)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function closeCarouselFullscreen() {
  $(".carousel-view.is-fallback-fullscreen")?.classList.remove("is-fallback-fullscreen");
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function bindInteractions() {
  document.addEventListener("click", (event) => {
    const videoButton = event.target.closest("[data-load-video]");
    if (videoButton) {
      const found = findPiece(videoButton.dataset.loadVideo);
      if (!found) return;
      const { piece } = found;
      if (piece.provider === "youtube") {
        videoButton.replaceWith(youtubeEmbedMarkup(piece));
      } else {
        const video = document.createElement("video");
        video.className = "loaded-video";
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.poster = piece.preview || "";
        video.src = piece.original;
        videoButton.replaceWith(video);
        video.play().catch(() => {});
      }
      return;
    }

    const toggle = event.target.closest("[data-toggle-project]");
    if (toggle) {
      const card = toggle.closest(".project-card");
      const panel = $(".pieces-panel", card);
      const isHidden = panel.hasAttribute("hidden");
      panel.toggleAttribute("hidden", !isHidden);
      card.classList.toggle("is-open", isHidden);
      toggle.textContent = isHidden ? "Ocultar piezas" : `Ver ${$$(".piece-row", panel).length} piezas`;
      return;
    }

    const modeButton = event.target.closest("[data-gallery-mode]");
    if (modeButton) {
      galleryState.mode = modeButton.dataset.galleryMode;
      renderGallery();
      return;
    }

    const tile = event.target.closest("[data-gallery-index]");
    if (tile) {
      galleryState.index = Number(tile.dataset.galleryIndex);
      galleryState.mode = "carousel";
      renderGallery();
      return;
    }

    if (event.target.closest("[data-carousel-prev]")) {
      galleryState.index = (galleryState.index - 1 + galleryState.project.pieces.length) % galleryState.project.pieces.length;
      renderGallery();
      return;
    }

    if (event.target.closest("[data-carousel-next]")) {
      galleryState.index = (galleryState.index + 1) % galleryState.project.pieces.length;
      renderGallery();
      return;
    }

    if (event.target.closest("[data-carousel-fullscreen]")) {
      const frame = $(".carousel-frame");
      const view = $(".carousel-view");
      if (document.fullscreenElement || document.webkitFullscreenElement || view?.classList.contains("is-fallback-fullscreen")) {
        closeCarouselFullscreen();
        return;
      }
      if (document.fullscreenEnabled === true && frame?.requestFullscreen) {
        frame.requestFullscreen().catch(() => view?.classList.add("is-fallback-fullscreen"));
      } else if (document.webkitFullscreenEnabled === true && frame?.webkitRequestFullscreen) {
        frame.webkitRequestFullscreen();
      } else {
        view?.classList.add("is-fallback-fullscreen");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!galleryState.project || galleryState.mode !== "carousel") return;
    if (event.key === "ArrowLeft") {
      galleryState.index = (galleryState.index - 1 + galleryState.project.pieces.length) % galleryState.project.pieces.length;
      renderGallery();
    }
    if (event.key === "ArrowRight") {
      galleryState.index = (galleryState.index + 1) % galleryState.project.pieces.length;
      renderGallery();
    }
    if (event.key === "Escape") {
      if (document.fullscreenElement || document.webkitFullscreenElement || $(".carousel-view.is-fallback-fullscreen")) {
        closeCarouselFullscreen();
      } else {
        galleryState.mode = "grid";
        renderGallery();
      }
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.16 });
  $$(".reveal").forEach((node) => observer.observe(node));
}

function init() {
  if (!DATA) return;
  renderHome();
  renderSectionPage();
  renderGalleryPage();
  bindInteractions();
}

init();
