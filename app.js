/* ==========================================================================
   George's AG Super Value - site behaviour
   Plain JavaScript, no frameworks. Reads the flyer items from data/products.js
   and handles: filtering, search, the saved shopping list, the open/closed
   clock, scroll animations and the mobile tab bar.
   ========================================================================== */

(function () {
  "use strict";

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------- store facts (one place to edit) ---------------- */
  var STORE = { openHour: 8, closeHour: 22, openText: "8am – 10pm" };

  /* ---------------- shopping list, saved in the browser ------------ */
  var STORAGE_KEY = "georges-list-v1";
  var list = [];

  try {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) { list = JSON.parse(saved) || []; }
  } catch (err) {
    list = []; // private browsing, storage blocked - the list just won't persist
  }

  function saveList() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) { /* nothing we can do, keep going */ }
  }

  /* give every product a stable id built from its text */
  function idFor(p) {
    return (p.brand + "-" + p.name + "-" + p.size)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  PRODUCTS.forEach(function (p) { p.id = idFor(p); });

  /* Show the blockbuster deals first, then keep departments grouped
     in the same order as the filter chips. */
  var catOrder = {};
  CATEGORIES.forEach(function (c, i) { catOrder[c.id] = i; });
  PRODUCTS.sort(function (a, b) {
    if (!!b.blockbuster !== !!a.blockbuster) { return b.blockbuster ? 1 : -1; }
    return (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
  });

  function inList(id) {
    return list.some(function (item) { return item.id === id; });
  }

  function money(n) {
    return "$" + n.toFixed(2);
  }

  /* ==========================================================================
     WEEKLY AD: chips, search, grid
     ========================================================================== */
  var grid      = $("#product-grid");
  var chipsWrap = $("#chips");
  var searchBox = $("#search");
  var emptyMsg  = $("#empty");

  var activeCategory = "all";
  var query = "";

  function countIn(catId) {
    if (catId === "all") { return PRODUCTS.length; }
    return PRODUCTS.filter(function (p) { return p.category === catId; }).length;
  }

  function buildChips() {
    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "chip" + (cat.id === activeCategory ? " is-active" : "");
      btn.type = "button";
      btn.dataset.cat = cat.id;
      btn.setAttribute("aria-pressed", cat.id === activeCategory ? "true" : "false");
      btn.innerHTML = cat.label + ' <span class="count">' + countIn(cat.id) + "</span>";
      btn.addEventListener("click", function () {
        activeCategory = cat.id;
        $$(".chip", chipsWrap).forEach(function (c) {
          var on = c.dataset.cat === activeCategory;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        renderGrid();
      });
      chipsWrap.appendChild(btn);
    });
  }

  function matches(p) {
    var okCat = activeCategory === "all" || p.category === activeCategory;
    if (!okCat) { return false; }
    if (!query) { return true; }
    var haystack = (p.brand + " " + p.name + " " + p.size).toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function productCard(p, index) {
    var card = document.createElement("article");
    card.className = "product" + (p.blockbuster ? " is-blockbuster" : "");
    card.style.animationDelay = Math.min(index * 26, 320) + "ms";

    var added = inList(p.id);

    card.innerHTML =
      (p.blockbuster ? '<span class="tag">★ Blockbuster</span>' : "") +
      '<span class="brand-name">' + p.brand + "</span>" +
      '<span class="item-name">' + p.name + "</span>" +
      '<span class="size">' + p.size + "</span>" +
      '<div class="price-row">' +
        '<span class="price">' + p.price + "</span>" +
        '<button class="add' + (added ? " is-added" : "") + '" type="button" ' +
          'aria-label="' + (added ? "Remove" : "Add") + " " + p.brand + " " + p.name + ' to my list">' +
          '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">' +
            (added ? '<path d="M5 13l4 4L19 7"/>' : '<path d="M12 5v14M5 12h14"/>') +
          "</svg>" +
        "</button>" +
      "</div>";

    /* the soft glow follows the cursor */
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });

    $(".add", card).addEventListener("click", function () {
      toggleItem(p);
    });

    return card;
  }

  function renderGrid() {
    var shown = PRODUCTS.filter(matches);
    grid.innerHTML = "";
    shown.forEach(function (p, i) { grid.appendChild(productCard(p, i)); });
    emptyMsg.hidden = shown.length !== 0;
  }

  if (searchBox) {
    searchBox.addEventListener("input", function () {
      query = searchBox.value.trim().toLowerCase();
      renderGrid();
    });
  }

  /* ==========================================================================
     SHOPPING LIST
     ========================================================================== */
  var sheet     = $("#sheet");
  var scrim     = $("#scrim");
  var sheetBody = $("#sheet-body");

  function toggleItem(p) {
    if (inList(p.id)) {
      list = list.filter(function (item) { return item.id !== p.id; });
    } else {
      list.push({ id: p.id, brand: p.brand, name: p.name, size: p.size,
                  price: p.price, unitPrice: p.unitPrice });
    }
    saveList();
    renderGrid();
    renderList();
  }

  function renderList() {
    var count = list.length;
    ["#list-count-header", "#list-count-sheet", "#list-count-tab"].forEach(function (sel) {
      var el = $(sel);
      if (el) {
        el.textContent = count;
        if (sel === "#list-count-tab") { el.hidden = count === 0; }
      }
    });

    if (!count) {
      sheetBody.innerHTML = '<p class="sheet-empty">Your list is empty.<br>Tap the + on any weekly special to add it.</p>';
    } else {
      sheetBody.innerHTML = "";
      list.forEach(function (item) {
        var row = document.createElement("div");
        row.className = "list-item";
        row.innerHTML =
          '<div class="info"><strong>' + item.brand + " · " + item.name + "</strong>" +
          "<small>" + item.size + "</small></div>" +
          '<span class="li-price">' + item.price + "</span>" +
          '<button class="remove" type="button" aria-label="Remove ' + item.brand + ' from list">' +
            '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          "</button>";
        $(".remove", row).addEventListener("click", function () {
          list = list.filter(function (x) { return x.id !== item.id; });
          saveList();
          renderGrid();
          renderList();
        });
        sheetBody.appendChild(row);
      });
    }

    var total = list.reduce(function (sum, item) { return sum + (item.unitPrice || 0); }, 0);
    $("#list-total").textContent = money(total);
  }

  function openSheet() {
    sheet.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(function () {
      sheet.classList.add("is-open");
      scrim.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
    $("#list-close").focus();
  }

  function closeSheet() {
    sheet.classList.remove("is-open");
    scrim.classList.remove("is-open");
    document.body.style.overflow = "";
    window.setTimeout(function () {
      sheet.hidden = true;
      scrim.hidden = true;
    }, 400);
  }

  $("#list-open").addEventListener("click", openSheet);
  $("#tab-list").addEventListener("click", openSheet);
  $("#list-close").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) { closeSheet(); }
  });

  $("#list-clear").addEventListener("click", function () {
    if (!list.length) { return; }
    list = [];
    saveList();
    renderGrid();
    renderList();
  });

  $("#list-print").addEventListener("click", function () {
    if (!list.length) { return; }
    window.print();
  });

  /* ==========================================================================
     OPEN / CLOSED CLOCK + today's hours
     ========================================================================== */
  function updateOpenStatus() {
    var now = new Date();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpen = hour >= STORE.openHour && hour < STORE.closeHour;

    var label = isOpen
      ? "Open now · " + STORE.openText
      : "Closed now · opens 8am";

    var pill = $(".pill-live");
    if (pill) { pill.classList.toggle("is-closed", !isOpen); }

    var a = $("#open-status");
    var b = $("#open-status-2");
    if (a) { a.textContent = label; }
    if (b) { b.textContent = isOpen ? "Open · closes 10pm" : "Closed · opens 8am"; }

    /* mark today's row in the hours table */
    $$(".hour-row[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", Number(row.dataset.day) === now.getDay());
    });
  }

  /* ==========================================================================
     SCROLL REVEAL + NAV HIGHLIGHTING + STICKY HEADER
     ========================================================================== */
  function setupReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  function setupScrollSpy() {
    var sections = ["home", "weekly", "departments", "deli", "about", "visit"];
    var header = $("#header");

    function onScroll() {
      header.classList.toggle("is-stuck", window.scrollY > 8);

      var current = "home";
      sections.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) { current = id; }
      });

      $$(".nav-desktop a").forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
      });
      $$(".tab[data-target]").forEach(function (t) {
        t.classList.toggle("is-active", t.dataset.target === current);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================================
     GO
     ========================================================================== */
  buildChips();
  renderGrid();
  renderList();
  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);
  setupReveal();
  setupScrollSpy();

  var dealCount = $("#deal-count");
  if (dealCount) { dealCount.textContent = PRODUCTS.length; }

  var year = $("#year");
  if (year) { year.textContent = new Date().getFullYear(); }
})();
