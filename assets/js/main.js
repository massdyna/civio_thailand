(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuButton && nav) {
    const dropdowns = Array.from(nav.querySelectorAll(".nav-dropdown"));

    const setDropdown = (dropdown, open) => {
      dropdown.classList.toggle("is-open", open);
      const toggle = dropdown.querySelector(".nav-dropdown-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
    };
    const closeDropdowns = (except) => {
      dropdowns.forEach((d) => { if (d !== except) setDropdown(d, false); });
    };
    const setNav = (open) => {
      nav.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      if (!open) closeDropdowns();
    };

    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".nav-dropdown-toggle");
      if (!toggle) return;
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains("is-open");
        closeDropdowns(dropdown);
        setDropdown(dropdown, willOpen);
        // Drop focus after closing so the menu cannot stay open by focus alone.
        if (!willOpen) toggle.blur();
      });
    });

    menuButton.addEventListener("click", () => {
      setNav(menuButton.getAttribute("aria-expanded") !== "true");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setNav(false));
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) setNav(false);
      closeDropdowns(event.target.closest ? event.target.closest(".nav-dropdown") : null);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const openDropdown = nav.querySelector(".nav-dropdown.is-open .nav-dropdown-toggle");
      closeDropdowns();
      setNav(false);
      if (openDropdown) openDropdown.focus({ preventScroll: true });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) setNav(false);
    });
  }

  // Reveal sections as they enter the viewport.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Reading progress bar.
  const progress = document.getElementById("scrollProgress");
  const updateProgress = () => {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const year = document.getElementById("currentYear");
  if (year) year.textContent = new Date().getFullYear();

  // Interactive product carousel: selected product rotates forward and grows.
  const productCarousel = document.querySelector("[data-product-carousel]");
  if (productCarousel) {
    const slides = Array.from(productCarousel.querySelectorAll("[data-product-slide]"));
    const selectors = Array.from(productCarousel.querySelectorAll("[data-product-select]"));
    const prevButton = productCarousel.querySelector("[data-product-prev]");
    const nextButton = productCarousel.querySelector("[data-product-next]");
    let activeProduct = 0;

    const showProduct = (requestedIndex) => {
      if (!slides.length) return;
      activeProduct = (requestedIndex + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        slide.classList.remove("is-active", "is-prev", "is-next", "is-back");
        let position = "is-back";
        if (index === activeProduct) position = "is-active";
        else if (index === (activeProduct - 1 + slides.length) % slides.length) position = "is-prev";
        else if (index === (activeProduct + 1) % slides.length) position = "is-next";
        slide.classList.add(position);
        slide.setAttribute("aria-hidden", String(position === "is-back"));
      });

      selectors.forEach((button, index) => {
        const selected = index === activeProduct;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };

    slides.forEach((slide, index) => {
      slide.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) return;
        showProduct(index);
      });
      slide.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showProduct(index); }
      });
    });

    selectors.forEach((button) => {
      button.addEventListener("click", () => {
        showProduct(Number(button.dataset.productSelect));
      });
    });

    if (prevButton) prevButton.addEventListener("click", () => showProduct(activeProduct - 1));
    if (nextButton) nextButton.addEventListener("click", () => showProduct(activeProduct + 1));
    let touchStartX = null;
    const stage = productCarousel.querySelector(".product-carousel-stage");
    if (stage) {
      stage.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
      stage.addEventListener("touchend", (event) => {
        if (touchStartX === null) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 45) showProduct(activeProduct + (delta < 0 ? 1 : -1));
        touchStartX = null;
      }, { passive: true });
    }
    showProduct(0);
  }

  // Contact form opens the visitor's email client with the completed enquiry.
  const civioForm = document.getElementById("civioContactForm");
  if (civioForm) civioForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!civioForm.reportValidity()) return;
    const values = new FormData(civioForm);
    const subject = encodeURIComponent("CIVIO Contact: " + values.get("subject"));
    const body = encodeURIComponent("ชื่อ-นามสกุล: " + values.get("name") + "\nเบอร์โทรศัพท์: " + values.get("phone") + "\nอีเมล: " + values.get("email") + "\nเรื่องที่ต้องการติดต่อ: " + values.get("subject"));
    window.location.href = "mailto:civioteam@massdyna.com?subject=" + subject + "&body=" + body;
  });

  // Local fallbacks keep the layout intact when an external image is unavailable.
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied) return;
      if (img.hasAttribute("onerror")) return; // image supplies its own fallback
      img.dataset.fallbackApplied = "true";
      const alt = (img.alt || "").toLowerCase();
      img.src = alt.includes("ฟาร์ม") || alt.includes("ผัก") || alt.includes("กิจกรรม")
        ? "assets/images/vegetable-farm-natural.webp"
        : "assets/images/compost-soil-seedlings.webp";
      img.classList.add("image-fallback");
    });
  });
  
  // Intro video: play while visible, pause when scrolled away (saves battery/data)
  const introVideo = document.getElementById("civio-intro-video");
  if (introVideo && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const playing = introVideo.play();
          if (playing && playing.catch) playing.catch(() => {});
        } else {
          introVideo.pause();
        }
      });
    }, { threshold: 0.35 });
    videoObserver.observe(introVideo);
  }

  // Recognition gallery: auto-scroll only the unique cards; never clone awards.
  const awardTrack = document.getElementById("awardTrack");
  const awardTrackSet = awardTrack?.querySelector(".award-track-set");
  const awardViewport = awardTrack?.closest(".award-marquee-viewport");

  if (awardTrack && awardTrackSet && awardViewport) {
    // Seamless, faster marquee. The three unique awards are looped; copies are hidden from assistive tech.
    const AWARD_SPEED = 56; // px per second
    let loopReady = false;
    const buildAwardLoop = () => {
      const setWidth = Math.ceil(awardTrackSet.getBoundingClientRect().width);
      if (!setWidth) return;
      awardTrack.querySelectorAll(".award-track-set[data-clone]").forEach((node) => node.remove());
      const copies = Math.max(1, Math.ceil(awardViewport.clientWidth / setWidth) + 1);
      for (let i = 0; i < copies; i += 1) {
        const clone = awardTrackSet.cloneNode(true);
        clone.setAttribute("data-clone", "true");
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("[data-award-open]").forEach((card) => card.setAttribute("tabindex", "-1"));
        awardTrack.appendChild(clone);
      }
      awardTrack.style.setProperty("--award-loop-distance", `${setWidth}px`);
      awardTrack.style.setProperty("--award-loop-duration", `${Math.max(8, setWidth / AWARD_SPEED).toFixed(1)}s`);
      awardTrack.classList.add("is-looping");
      loopReady = true;
    };
    const rebuildAwardLoop = () => { loopReady = false; awardTrack.classList.remove("is-looping"); buildAwardLoop(); };
    buildAwardLoop();
    window.addEventListener("load", rebuildAwardLoop, { once: true });
    let awardResizeTimer = null;
    window.addEventListener("resize", () => { clearTimeout(awardResizeTimer); awardResizeTimer = setTimeout(rebuildAwardLoop, 200); }, { passive: true });
  }

  // External activity photos fall back to a local award visual if a remote host is unavailable.
  document.querySelectorAll(".award-marquee-photo img[data-fallback]").forEach((image) => {
    image.addEventListener("error", () => {
      if (image.dataset.fallback && image.src !== new URL(image.dataset.fallback, document.baseURI).href) {
        image.src = image.dataset.fallback;
        image.removeAttribute("data-fallback");
      }
    }, { once: true });
  });

  const awardButtons = Array.from(document.querySelectorAll(".award-track-set:first-child [data-award-open]"));
  let activeAwardTrigger = null;
  let awardDialog = null;

  const closeAwardDialog = () => {
    if (!awardDialog) return;
    awardDialog.classList.remove("is-open");
    document.body.classList.remove("award-dialog-open");
    document.removeEventListener("keydown", handleAwardDialogKeydown);
    const dialogToRemove = awardDialog;
    awardDialog = null;
    window.setTimeout(() => dialogToRemove.remove(), 180);
    if (activeAwardTrigger) activeAwardTrigger.focus({ preventScroll: true });
  };

  const handleAwardDialogKeydown = (event) => {
    if (event.key === "Escape") closeAwardDialog();
  };

  const openAwardDialog = (trigger) => {
    if (awardDialog) awardDialog.remove();
    activeAwardTrigger = trigger;

    const title = trigger.dataset.title || "ผลงานและรางวัล CiViO Thailand";
    const description = trigger.dataset.description || "ภาพผลงานและความสำเร็จของ CiViO Thailand";
    const image = trigger.dataset.image || "";
    const alt = trigger.dataset.alt || title;
    const points = (trigger.dataset.points || "").split("|").filter(Boolean);

    const overlay = document.createElement("div");
    overlay.className = "award-dialog";
    overlay.setAttribute("role", "presentation");

    const dialog = document.createElement("section");
    dialog.className = "award-dialog-panel";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "awardDialogTitle");

    const closeButton = document.createElement("button");
    closeButton.className = "award-dialog-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "ปิดรายละเอียดรางวัล");
    closeButton.textContent = "×";

    const imageWrap = document.createElement("div");
    imageWrap.className = "award-dialog-image";
    const img = document.createElement("img");
    img.src = image;
    img.alt = alt;
    img.loading = "eager";
    img.addEventListener("error", () => {
      if (trigger.dataset.fallback) img.src = trigger.dataset.fallback;
    }, { once: true });
    imageWrap.appendChild(img);

    const content = document.createElement("div");
    content.className = "award-dialog-content";
    const kicker = document.createElement("span");
    kicker.className = "award-card-kicker";
    kicker.textContent = "CIVIO THAILAND · RECOGNITION";
    const heading = document.createElement("h3");
    heading.id = "awardDialogTitle";
    heading.textContent = title;
    const summary = document.createElement("p");
    summary.textContent = description;

    content.append(kicker, heading, summary);
    if (points.length) {
      const list = document.createElement("ul");
      list.className = "award-dialog-points";
      points.forEach((point) => {
        const item = document.createElement("li");
        item.textContent = point;
        list.appendChild(item);
      });
      content.appendChild(list);
    }

    if (trigger.dataset.source) {
      const sourceLink = document.createElement("a");
      sourceLink.className = "award-dialog-source";
      sourceLink.href = trigger.dataset.source;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = "อ่านข่าวและดูภาพต้นฉบับบน Massdyna ↗";
      content.appendChild(sourceLink);
    }

    dialog.append(closeButton, imageWrap, content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add("award-dialog-open");
    awardDialog = overlay;

    closeButton.addEventListener("click", closeAwardDialog);
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus();
      }
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeAwardDialog();
    });
    document.addEventListener("keydown", handleAwardDialogKeydown);
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    closeButton.focus();
  };

  awardButtons.forEach((button) => {
    button.addEventListener("click", () => openAwardDialog(button));
  });


  // Hover popup: point at an award card to read its details immediately (no click needed).
  if (awardViewport && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const pop = document.createElement("div");
    pop.className = "award-hover";
    pop.setAttribute("role", "tooltip");
    pop.innerHTML = '<div class="award-hover-img"><img alt="" decoding="async"></div><div class="award-hover-body"><small></small><strong></strong><p></p><ul></ul></div>';
    document.body.appendChild(pop);
    const popImg = pop.querySelector("img");
    popImg.addEventListener("error", () => { popImg.style.visibility = "hidden"; });
    popImg.addEventListener("load", () => { popImg.style.visibility = "visible"; });
    const popKicker = pop.querySelector("small");
    const popTitle = pop.querySelector("strong");
    const popText = pop.querySelector("p");
    const popList = pop.querySelector("ul");
    let currentCard = null;

    const placePop = (card) => {
      const rect = card.getBoundingClientRect();
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), window.innerWidth - w - 12);
      const above = rect.top - h - 14;
      const top = above >= 12 ? above : Math.min(rect.bottom + 14, window.innerHeight - h - 12);
      pop.style.left = `${left}px`;
      pop.style.top = `${Math.max(12, top)}px`;
    };
    const showPop = (card) => {
      if (document.querySelector(".award-dialog")) return;
      currentCard = card;
      const d = card.dataset;
      popImg.src = d.image || "";
      popKicker.textContent = card.querySelector(".award-marquee-copy small")?.textContent || "";
      popTitle.textContent = d.title || "";
      popText.textContent = d.description || "";
      popList.innerHTML = "";
      (d.points || "").split("|").filter(Boolean).forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        popList.appendChild(li);
      });
      pop.classList.add("is-visible");
      placePop(card);
    };
    const hidePop = () => { currentCard = null; pop.classList.remove("is-visible"); };

    awardViewport.addEventListener("mouseover", (event) => {
      const card = event.target.closest("[data-award-open]");
      if (card && card !== currentCard) showPop(card);
    });
    awardViewport.addEventListener("mouseout", (event) => {
      const card = event.target.closest("[data-award-open]");
      if (card && !card.contains(event.relatedTarget)) hidePop();
    });
    awardViewport.addEventListener("focusin", (event) => {
      const card = event.target.closest("[data-award-open]");
      if (card) showPop(card);
    });
    awardViewport.addEventListener("focusout", hidePop);
    window.addEventListener("scroll", hidePop, { passive: true });
  }

  // Cloned loop cards open the same dialog on click/tap.
  awardTrack?.addEventListener("click", (event) => {
    const card = event.target.closest(".award-track-set[data-clone] [data-award-open]");
    if (card) openAwardDialog(card);
  });

})();
