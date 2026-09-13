/* ==========================================================================
   George's AG Super Value — behaviour + micro-interactions
   --------------------------------------------------------------------------
   Vanilla JS, no dependencies. Every animation here runs on transform or
   opacity only (the two properties the browser can composite on the GPU),
   stays under 300ms when a finger started it, and is switched off by the
   OS "reduce motion" setting.

   Each interaction below is written as: TRIGGER / RULES / FEEDBACK / MODE.
   ========================================================================== */

(function () {
  "use strict";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isCompact = window.matchMedia("(max-width: 859px)");

  var STORE = { open: 8, close: 22, openLabel: "8am – 10pm" };

  /* ----------------------------------------------------------------------
     Haptics. A 10ms tick on a committed action only — never on hover, never
     on scroll. Silently absent on iOS Safari, which does not expose it.
     -------------------------------------------------------------------- */
  function tap(ms) {
    if (reduceMotion.matches) { return; }
    if (navigator.vibrate) { try { navigator.vibrate(ms || 10); } catch (e) {} }
  }

  /* ----------------------------------------------------------------------
     Storage helpers — every read and write is guarded, because private
     browsing throws instead of returning null.
     -------------------------------------------------------------------- */
  function read(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  /* ======================================================================
     THEME
     Trigger  : tap the sun/moon in the app bar
     Rules    : flip the data-theme attribute, remember the choice
     Feedback : icon swaps; the whole page cross-fades where the browser
                supports View Transitions, instantly everywhere else
     Mode     : an explicit choice overrides the OS setting from then on
     ==================================================================== */
  var themeBtn = $("#theme-toggle");
  var themeIcon = $("#theme-icon");

  var SUN = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>';
  var MOON = '<path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>';

  function currentTheme() {
    if (document.documentElement.dataset.theme) { return document.documentElement.dataset.theme; }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function paintThemeButton() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeIcon.innerHTML = next === "light" ? SUN : MOON;
    themeBtn.setAttribute("aria-label", "Switch to " + next + " theme");
  }

  function applyTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    write("georges-theme", next);
    paintThemeButton();
    tap(8);
  }

  themeBtn.addEventListener("click", function () {
    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
  });
  paintThemeButton();

  /* ======================================================================
     DATA
     ==================================================================== */
  PRODUCTS.forEach(function (p) {
    p.id = (p.brand + "-" + p.name + "-" + p.size)
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  });

  var order = {};
  CATEGORIES.forEach(function (c, i) { order[c.id] = i; });
  PRODUCTS.sort(function (a, b) {
    if (!!b.blockbuster !== !!a.blockbuster) { return b.blockbuster ? 1 : -1; }
    return (order[a.category] || 99) - (order[b.category] || 99);
  });

  var list = [];
  try { list = JSON.parse(read("georges-list-v1", "[]")) || []; } catch (e) { list = []; }

  function inList(id) { return list.some(function (i) { return i.id === id; }); }
  function saveList() { write("georges-list-v1", JSON.stringify(list)); }
  function money(n) { return "$" + n.toFixed(2); }

  /* ======================================================================
     HERO FLYER — the three Blockbuster deals, set like the paper circular
     ==================================================================== */
  (function buildFlyer() {
    var host = $("#flyer-items");
    var picks = PRODUCTS.filter(function (p) { return p.blockbuster; }).slice(0, 3);

    host.innerHTML = picks.map(function (p) {
      return '<div class="flyer__item">' +
               '<span class="flyer__label"><b>' + esc(p.brand) + "</b>" +
                 "<span>" + esc(p.name) + "</span></span>" +
               '<span class="leader" aria-hidden="true"></span>' +
               '<span class="price">' + esc(p.price) + "</span>" +
             "</div>";
    }).join("");
  })();

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ======================================================================
     SEGMENTED FILTER
     Trigger  : tap a department
     Rules    : one pill slides to the tapped segment; the grid re-renders
     Feedback : the indicator moves in 240ms; a live region announces the count
     Mode     : filter state persists until changed; search narrows within it
     ==================================================================== */
  var filters = $("#filters");
  var indicator = $("#filter-indicator");
  var grid = $("#ad-grid");
  var statusLine = $("#ad-status");
  var emptyState = $("#ad-empty");
  var activeCat = "all";
  var query = "";

  function countIn(id) {
    return id === "all" ? PRODUCTS.length
      : PRODUCTS.filter(function (p) { return p.category === id; }).length;
  }

  CATEGORIES.forEach(function (cat) {
    var b = document.createElement("button");
    b.className = "segmented__btn";
    b.type = "button";
    b.role = "tab";
    b.dataset.cat = cat.id;
    b.setAttribute("aria-selected", cat.id === activeCat ? "true" : "false");
    b.innerHTML = esc(cat.label) + ' <span class="segmented__count">' + countIn(cat.id) + "</span>";
    b.addEventListener("click", function () { selectCategory(cat.id, b); });
    filters.appendChild(b);
  });

  function moveIndicator(btn) {
    /* transform + width on one absolutely positioned element: the siblings
       never reflow, so this stays cheap even mid-scroll. */
    indicator.style.transform = "translateX(" + btn.offsetLeft + "px)";
    indicator.style.width = btn.offsetWidth + "px";
  }

  function selectCategory(id, btn) {
    activeCat = id;
    $$(".segmented__btn", filters).forEach(function (b) {
      b.setAttribute("aria-selected", b.dataset.cat === id ? "true" : "false");
    });
    moveIndicator(btn);
    btn.scrollIntoView({ inline: "nearest", block: "nearest",
                         behavior: reduceMotion.matches ? "auto" : "smooth" });
    renderGrid();
    tap(6);
  }

  /* ======================================================================
     SEARCH
     Trigger  : typing
     Rules    : match brand, product and pack size; clear button appears
     Feedback : result count read out politely; empty state offers a way back
     ==================================================================== */
  var searchInput = $("#search");
  var searchField = $("#search-field");
  var searchClear = $("#search-clear");

  searchInput.addEventListener("input", function () {
    query = searchInput.value.trim().toLowerCase();
    searchField.classList.toggle("field--filled", query.length > 0);
    renderGrid();
  });

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    query = "";
    searchField.classList.remove("field--filled");
    renderGrid();
    searchInput.focus();
  });

  $("#empty-reset").addEventListener("click", function () {
    searchInput.value = "";
    query = "";
    searchField.classList.remove("field--filled");
    var allBtn = $('.segmented__btn[data-cat="all"]', filters);
    selectCategory("all", allBtn);
  });

  /* ======================================================================
     DEAL GRID
     ==================================================================== */
  function matches(p) {
    if (activeCat !== "all" && p.category !== activeCat) { return false; }
    if (!query) { return true; }
    return (p.brand + " " + p.name + " " + p.size).toLowerCase().indexOf(query) !== -1;
  }

  var PLUS = '<path d="M12 5v14M5 12h14"/>';
  var CHECK = '<path d="M5 13l4 4L19 7"/>';

  function renderGrid() {
    var shown = PRODUCTS.filter(matches);
    var html = shown.map(function (p) {
      var on = inList(p.id);
      return '<article class="deal' + (p.blockbuster ? " deal--flagged" : "") + '" data-id="' + p.id + '">' +
        (p.blockbuster ? '<span class="deal__flag">★ Blockbuster</span>' : "") +
        '<h3 class="deal__brand">' + esc(p.brand) + "</h3>" +
        '<p class="deal__name">' + esc(p.name) + "</p>" +
        '<p class="deal__size">' + esc(p.size) + "</p>" +
        '<span class="leader leader--rule" aria-hidden="true"></span>' +
        '<div class="deal__foot">' +
          '<span class="price">' + esc(p.price) + "</span>" +
          '<button class="add" type="button" aria-pressed="' + on + '" ' +
            'aria-label="' + esc(p.brand + " " + p.name + ", " + p.price) + '. Add to my list">' +
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (on ? CHECK : PLUS) + "</svg>" +
          "</button>" +
        "</div></article>";
    }).join("");

    grid.innerHTML = html;
    emptyState.hidden = shown.length > 0;

    var label = CATEGORIES.filter(function (c) { return c.id === activeCat; })[0].label;
    statusLine.textContent = shown.length + (shown.length === 1 ? " item" : " items") +
      (activeCat === "all" ? "" : " in " + label) + (query ? ' matching "' + searchInput.value.trim() + '"' : "");
  }

  /* Delegated: one listener for the whole grid instead of 25, so re-rendering
     never leaks handlers. */
  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".add");
    if (!btn) { return; }
    var id = btn.closest(".deal").dataset.id;
    var product = PRODUCTS.filter(function (p) { return p.id === id; })[0];
    if (product) { toggleItem(product, btn); }
  });

  /* ======================================================================
     ADD TO LIST
     Trigger  : tap +
     Rules    : item goes in or comes out of the saved list
     Feedback : + rotates into a check, the button fills, the tab badge
                springs, a haptic tick fires, and a toast offers Undo
     Mode     : the list persists on this device between visits
     ==================================================================== */
  function toggleItem(p, btn) {
    var adding = !inList(p.id);

    if (adding) {
      list.push({ id: p.id, brand: p.brand, name: p.name, size: p.size,
                  price: p.price, unitPrice: p.unitPrice });
    } else {
      list = list.filter(function (i) { return i.id !== p.id; });
    }
    saveList();

    if (btn) {
      btn.setAttribute("aria-pressed", String(adding));
      $(".icon", btn).innerHTML = adding ? CHECK : PLUS;
    }

    paintCounts(true);
    renderSheet();
    tap(adding ? 12 : 6);

    showToast(
      (adding ? "Added " : "Removed ") + p.brand + " " + p.name,
      adding ? "Undo" : "Undo",
      function () { toggleItem(p, $('.deal[data-id="' + p.id + '"] .add')); }
    );
  }

  /* ======================================================================
     TOAST
     Trigger  : any list change
     Rules    : shows for 4s, replaced if another change lands first
     Feedback : slides up 24px and fades in; never takes focus
     Mode     : transient, and always undoable while it is on screen
     ==================================================================== */
  var toast = $("#toast");
  var toastText = $("#toast-text");
  var toastAction = $("#toast-action");
  var toastTimer = null;
  var undoFn = null;

  function showToast(message, actionLabel, onAction) {
    toastText.textContent = message;
    toastAction.textContent = actionLabel;
    undoFn = onAction;
    toast.dataset.open = "true";

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 4000);
  }
  function hideToast() {
    toast.dataset.open = "false";
    undoFn = null;
  }
  toastAction.addEventListener("click", function () {
    if (undoFn) { undoFn(); }
    hideToast();
  });

  /* ======================================================================
     COUNTS
     ==================================================================== */
  function paintCounts(bump) {
    var n = list.length;
    var tabBadge = $("#count-tab");
    var sheetBadge = $("#count-sheet");

    tabBadge.textContent = n;
    tabBadge.hidden = n === 0;
    sheetBadge.textContent = n;

    if (bump && !reduceMotion.matches) {
      [tabBadge, sheetBadge].forEach(function (el) {
        el.classList.remove("badge--bump");
        void el.offsetWidth;          /* restart the animation */
        el.classList.add("badge--bump");
      });
    }
    $("#list-total").textContent = money(list.reduce(function (s, i) {
      return s + (i.unitPrice || 0);
    }, 0));
  }

  /* ======================================================================
     SHEET (the list)
     Trigger  : My List tab, or the header button on desktop
     Rules    : modal; focus moves in and is trapped; Escape closes
     Feedback : slides from the bottom (side panel ≥860px), scrim fades
     Mode     : blocks page scroll while open, restores focus on close
     ==================================================================== */
  var sheet = $("#sheet");
  var scrim = $("#scrim");
  var sheetBody = $("#sheet-body");
  var lastFocus = null;

  function openSheet() {
    hideToast();                 /* the list itself is the confirmation now */
    toast.classList.add("toast--top");   /* in-sheet toasts clear the footer */
    lastFocus = document.activeElement;
    sheet.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(function () {
      sheet.dataset.open = "true";
      scrim.dataset.open = "true";
    });
    document.body.style.overflow = "hidden";
    $("#sheet-close").focus();
  }

  function closeSheet() {
    toast.classList.remove("toast--top");
    sheet.dataset.open = "false";
    scrim.dataset.open = "false";
    document.body.style.overflow = "";
    window.setTimeout(function () {
      sheet.hidden = true;
      scrim.hidden = true;
      sheet.style.transform = "";
    }, 300);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  $("#tab-list").addEventListener("click", openSheet);
  $("#sheet-close").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);

  document.addEventListener("keydown", function (e) {
    if (sheet.hidden) { return; }
    if (e.key === "Escape") { closeSheet(); return; }
    if (e.key !== "Tab") { return; }

    /* focus trap */
    var focusables = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', sheet)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusables.length) { return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- drag to dismiss (phones only) --------------------------------
     Trigger  : drag the grabber or the header
     Rules    : the sheet follows your finger down, resists upward
     Feedback : the scrim fades in proportion to the drag
     Mode     : past 96px or a fast flick it closes, otherwise it springs back
     ------------------------------------------------------------------ */
  (function dragToDismiss() {
    var startY = 0, delta = 0, dragging = false, startTime = 0;
    var handles = [$("#grabber"), $(".sheet__head")];

    function down(e) {
      if (!isCompact.matches || e.target.closest("button")) { return; }
      dragging = true;
      startY = e.clientY;
      delta = 0;
      startTime = Date.now();
      sheet.dataset.dragging = "true";
      sheet.style.willChange = "transform";
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    function move(e) {
      if (!dragging) { return; }
      delta = e.clientY - startY;
      if (delta < 0) { delta = delta * 0.25; }      /* rubber band upward */
      sheet.style.transform = "translateY(" + delta + "px)";
      scrim.style.opacity = String(Math.max(0, 1 - delta / 400));
    }

    function up(e) {
      if (!dragging) { return; }
      dragging = false;
      sheet.dataset.dragging = "false";
      sheet.style.willChange = "";                   /* release the layer */
      scrim.style.opacity = "";

      var velocity = delta / Math.max(1, Date.now() - startTime);
      if (delta > 96 || velocity > 0.55) {
        sheet.style.transform = "";
        closeSheet();
      } else {
        sheet.style.transform = "translateY(0)";
      }
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    handles.forEach(function (h) {
      if (!h) { return; }
      h.addEventListener("pointerdown", down);
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", up);
    });
  })();

  /* ======================================================================
     LIST ROWS + SWIPE TO DELETE
     Trigger  : swipe a row left, or press its Remove button
     Rules    : the row tracks your finger to a 88px stop; past 160px it goes
     Feedback : a red Remove panel is revealed underneath
     Mode     : the gesture is a shortcut, never the only way — the same
                button is reachable by keyboard and screen reader
     ==================================================================== */
  function renderSheet() {
    if (!list.length) {
      sheetBody.innerHTML =
        '<div class="ad__empty"><b>Nothing on your list yet</b>' +
        "<p>Tap the + on any special and it lands here, ready for the trip in.</p></div>";
      paintCounts(false);
      return;
    }

    sheetBody.innerHTML = list.map(function (i) {
      var label = esc(i.brand + " " + i.name);
      return '<div class="row" data-id="' + i.id + '">' +
        /* revealed by the swipe; the button in the row is the accessible twin */
        '<button class="row__delete" type="button" tabindex="-1" aria-hidden="true">Remove</button>' +
        '<div class="row__content">' +
          '<span class="row__text"><b>' + esc(i.brand) + " · " + esc(i.name) + "</b>" +
            "<span>" + esc(i.size) + "</span></span>" +
          '<span class="leader leader--center" aria-hidden="true"></span>' +
          '<span class="price" style="font-size:var(--text-headline)">' + esc(i.price) + "</span>" +
          '<button class="row__remove" type="button" aria-label="Remove ' + label + ' from my list">' +
            '<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          "</button>" +
        "</div></div>";
    }).join("");

    paintCounts(false);
  }

  sheetBody.addEventListener("click", function (e) {
    var hit = e.target.closest(".row__remove, .row__delete");
    if (!hit) { return; }
    removeRow(hit.closest(".row"));
  });

  function removeRow(row) {
    var id = row.dataset.id;
    var item = list.filter(function (i) { return i.id === id; })[0];
    if (!item) { return; }

    row.classList.add("row--leaving");
    tap(10);

    window.setTimeout(function () {
      list = list.filter(function (i) { return i.id !== id; });
      saveList();
      renderSheet();
      renderGrid();
      paintCounts(true);
    }, reduceMotion.matches ? 0 : 220);

    showToast("Removed " + item.brand + " " + item.name, "Undo", function () {
      list.push(item);
      saveList();
      renderSheet();
      renderGrid();
      paintCounts(true);
    });
  }

  (function swipeRows() {
    var row = null, content = null, startX = 0, startY = 0, dx = 0, locked = null;

    sheetBody.addEventListener("pointerdown", function (e) {
      content = e.target.closest(".row__content");
      if (!content || e.target.closest(".row__remove")) { content = null; return; }
      row = content.closest(".row");
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      locked = null;
    });

    sheetBody.addEventListener("pointermove", function (e) {
      if (!content) { return; }
      var mx = e.clientX - startX;
      var my = e.clientY - startY;

      /* Decide once whether this gesture is ours or the scroller's, so a
         swipe never fights a scroll. */
      if (locked === null) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) { return; }
        locked = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        if (locked === "x") { row.classList.add("row--dragging"); }
      }
      if (locked !== "x") { return; }

      dx = Math.min(0, mx);
      if (dx < -120) { dx = -120 + (dx + 120) * 0.3; }
      content.style.transform = "translateX(" + dx + "px)";
    }, { passive: true });

    function end() {
      if (!content) { return; }
      row.classList.remove("row--dragging");

      if (dx < -160) { removeRow(row); }
      else if (dx < -44) { content.style.transform = "translateX(-88px)"; }
      else { content.style.transform = ""; }

      content = null; row = null; locked = null;
    }

    sheetBody.addEventListener("pointerup", end);
    sheetBody.addEventListener("pointercancel", end);
  })();

  $("#list-clear").addEventListener("click", function () {
    if (!list.length) { return; }
    var backup = list.slice();
    list = [];
    saveList();
    renderSheet();
    renderGrid();
    paintCounts(true);
    showToast("List cleared", "Undo", function () {
      list = backup;
      saveList();
      renderSheet();
      renderGrid();
      paintCounts(true);
    });
  });

  $("#list-print").addEventListener("click", function () {
    if (!list.length) { return; }
    window.print();
  });

  /* ======================================================================
     APP BAR + TAB BAR
     Trigger  : scrolling
     Rules    : the bar gains a hairline and its compact title once the hero
                title has left; the current section lights up in both navs
     Feedback : opacity + 8px translate, 240ms
     ==================================================================== */
  (function navigation() {
    var appbar = $("#appbar");
    var sections = ["home", "weekly", "departments", "deli", "story", "visit"];
    var ticking = false;

    function update() {
      ticking = false;
      appbar.classList.toggle("appbar--condensed", window.scrollY > 40);

      var current = "home";
      sections.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) { current = id; }
      });

      $$(".appbar__nav a").forEach(function (a) {
        a.setAttribute("aria-current", a.getAttribute("href") === "#" + current ? "true" : "false");
      });
      $$(".tab[data-section]").forEach(function (t) {
        t.setAttribute("aria-current", t.dataset.section === current ? "true" : "false");
      });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ======================================================================
     OPEN / CLOSED — reads the visitor's own clock
     ==================================================================== */
  function updateStatus() {
    var now = new Date();
    var hour = now.getHours() + now.getMinutes() / 60;
    var open = hour >= STORE.open && hour < STORE.close;

    $("#status-chip").classList.toggle("chip--closed", !open);
    $("#status-text").textContent = open
      ? "Open now · " + STORE.openLabel
      : "Closed · opens 8am";
    $("#status-long").textContent = open ? "Open · closes 10pm" : "Closed · opens at 8am";

    $$(".hours__row[data-day]").forEach(function (r) {
      var today = Number(r.dataset.day) === now.getDay();
      r.dataset.today = String(today);
      var label = $("span", r);
      if (today && !$(".hours__today", r)) {
        label.insertAdjacentHTML("beforeend", '<span class="hours__today">Today</span>');
      }
    });
  }

  /* ======================================================================
     REVEAL ON SCROLL — one quiet move, once, then the observer lets go
     ==================================================================== */
  (function reveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.dataset.visible = "true"; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) { return; }
        entry.target.style.transitionDelay = Math.min(i * 45, 180) + "ms";
        entry.target.dataset.visible = "true";
        io.unobserve(entry.target);          /* stop watching, free the memory */
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     START
     ==================================================================== */
  renderGrid();
  renderSheet();
  paintCounts(false);
  updateStatus();
  window.setInterval(updateStatus, 60000);

  $("#hero-count").textContent = PRODUCTS.length;
  $("#year").textContent = new Date().getFullYear();

  /* the indicator can only be measured once the buttons have laid out */
  requestAnimationFrame(function () {
    moveIndicator($('.segmented__btn[data-cat="all"]', filters));
  });
  window.addEventListener("resize", function () {
    var active = $('.segmented__btn[aria-selected="true"]', filters);
    if (active) { moveIndicator(active); }
  }, { passive: true });

  /* Once the webfonts settle: re-measure the pill (text metrics changed), and
     if the display face never arrived, tell CSS to thicken the fallback so a
     price never renders thin. Offline and blocked-CDN visitors get this path. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      var active = $('.segmented__btn[aria-selected="true"]', filters);
      if (active) { moveIndicator(active); }

      var hasDisplayFont = false;
      try { hasDisplayFont = document.fonts.check('1em Anton'); } catch (e) {}
      if (!hasDisplayFont) { document.documentElement.classList.add("no-display-font"); }
    });
  }
})();
