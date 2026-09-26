/* 学习笔记页：渲染目录与内容 / 主题与语言切换 / 滚动高亮 / 搜索过滤 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var DATA = window.NOTES_DATA || { updated: "", chapters: [] };

  /* ---------- 主题（与主页共用 zc-theme 偏好） ---------- */
  var themeBtn = $("#themeBtn");
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("zc-theme", t); } catch (e) { /* ignore */ }
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem("zc-theme"); } catch (e) { /* ignore */ }
  setTheme(savedTheme === "dark" ? "dark" : "light");
  themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    setTheme(cur === "dark" ? "light" : "dark");
  });

  /* ---------- 语言（与主页共用 zc-lang 偏好；笔记内容保持中文） ---------- */
  var langBtn = $("#langBtn");
  var currentLang = "zh";
  try { if (localStorage.getItem("zc-lang") === "en") currentLang = "en"; } catch (e) { /* ignore */ }
  function applyLang(lang) {
    currentLang = lang;
    var dict = I18N[lang];
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    $$("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    document.documentElement.setAttribute("lang", dict._meta.lang);
    document.title = dict["notes.doc_title"] || dict._meta.title;
    langBtn.textContent = lang === "zh" ? "EN" : "中";
    try { localStorage.setItem("zc-lang", lang); } catch (e) { /* ignore */ }
  }
  langBtn.addEventListener("click", function () {
    applyLang(currentLang === "zh" ? "en" : "zh");
  });

  /* ---------- 渲染 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function bold(s) {
    /* 先转义 HTML，再把 **关键词** 转成 <b> */
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  }

  var tocNav = $("#tocNav");
  var content = $("#notesContent");
  var tocHtml = "";
  var contentHtml = "";

  DATA.chapters.forEach(function (ch) {
    var cid = "ch" + ch.no;
    tocHtml += '<div class="toc-chapter" data-ch="' + cid + '">' +
      '<button class="toc-ch-head" type="button" data-target="' + cid + '">' +
        '<span class="toc-ch-no">' + esc(ch.no) + '</span>' +
        '<span class="toc-ch-name">' + esc(ch.title) + '</span>' +
        '<span class="toc-ch-count">' + ch.sections.length + '</span>' +
        '<svg class="toc-ch-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>' +
      '</button>' +
      '<div class="toc-sections">';
    contentHtml += '<section class="glass note-chapter" id="' + cid + '">' +
      '<div class="note-ch-head">' +
        '<span class="badge ' + (ch.badge === "项目" || ch.badge === "工程" ? "badge-pink" : "badge-blue") + '">' + esc(ch.badge) + '</span>' +
        '<div class="note-ch-title"><h2>' + esc(ch.no) + ' · ' + esc(ch.title) + '</h2></div>' +
        '<p class="note-ch-intro">' + esc(ch.intro) + '</p>' +
      '</div>';

    ch.sections.forEach(function (sec, i) {
      var sid = cid + "-s" + i;
      tocHtml += '<a class="toc-link" href="#' + sid + '" data-ch="' + cid + '" data-search="' + esc((sec.t + " " + sec.points.join(" ")).toLowerCase()) + '">' + esc(sec.t) + '</a>';
      contentHtml += '<div class="note-sec" id="' + sid + '"><h3>' + esc(sec.t) + '</h3><ul>' +
        sec.points.map(function (p) { return "<li>" + bold(p) + "</li>"; }).join("") +
        '</ul></div>';
    });

    tocHtml += '</div></div>';
    contentHtml += '</section>';
  });

  tocNav.innerHTML = tocHtml;
  content.innerHTML = contentHtml;
  $("#tocUpdated").textContent = DATA.updated;

  /* ---------- 章折叠 ---------- */
  var chapters = $$(".toc-chapter");
  function openChapter(el, open) {
    el.classList.toggle("open", open === undefined ? true : open);
  }
  tocNav.addEventListener("click", function (e) {
    var head = e.target.closest(".toc-ch-head");
    if (!head) return;
    var ch = head.parentElement;
    openChapter(ch, !ch.classList.contains("open"));
  });
  openChapter(chapters[0], true);

  /* ---------- 滚动高亮 ---------- */
  var secEls = $$(".note-sec");
  var linkMap = {};
  $$(".toc-link").forEach(function (a) { linkMap[a.getAttribute("href").slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      $$(".toc-link.active").forEach(function (a) { a.classList.remove("active"); });
      var link = linkMap[id];
      if (link) {
        link.classList.add("active");
        var ch = link.closest(".toc-chapter");
        if (ch && !ch.classList.contains("open")) openChapter(ch, true);
        if (ch) {
          var head = ch.querySelector(".toc-ch-head");
          var navRect = tocNav.getBoundingClientRect();
          var r = head.getBoundingClientRect();
          if (r.top < navRect.top - 4 || r.bottom > navRect.bottom + 4) head.scrollIntoView({ block: "start" });
        }
        if (link.scrollIntoViewIfNeeded) link.scrollIntoViewIfNeeded(false);
      }
    });
  }, { rootMargin: "-15% 0px -70% 0px" });
  secEls.forEach(function (el) { spy.observe(el); });

  /* ---------- 搜索过滤 ---------- */
  var searchInput = $("#tocSearch");
  var emptyTip = $("#tocEmpty");
  searchInput.addEventListener("input", function () {
    var q = searchInput.value.trim().toLowerCase();
    var any = false;
    chapters.forEach(function (ch) {
      var visible = 0;
      $$(".toc-link", ch).forEach(function (a) {
        var hit = !q || a.getAttribute("data-search").indexOf(q) !== -1;
        a.classList.toggle("hidden", !hit);
        if (hit) visible++;
      });
      ch.classList.toggle("hidden", q !== "" && visible === 0);
      if (q !== "" && visible > 0) openChapter(ch, true);
      if (visible > 0) any = true;
    });
    emptyTip.hidden = any || q === "";
  });

  /* ---------- 移动端抽屉 ---------- */
  var sidebar = $("#sidebar");
  var fab = $("#tocFab");
  var mask = $("#tocMask");
  function closeDrawer() {
    sidebar.classList.remove("drawer-open");
    mask.hidden = true;
  }
  fab.addEventListener("click", function () {
    var open = sidebar.classList.toggle("drawer-open");
    mask.hidden = !open;
  });
  mask.addEventListener("click", closeDrawer);
  tocNav.addEventListener("click", function (e) {
    if (e.target.closest(".toc-link") && window.innerWidth <= 960) closeDrawer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  /* ---------- 导航滚动态 ---------- */
  var nav = $("#siteNav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 初始定位（支持 #ch06-s3 锚点直达） ---------- */
  applyLang(currentLang);
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) {
      var chEl = target.closest(".toc-chapter") || null;
      var link = linkMap[target.id];
      if (link && link.closest(".toc-chapter")) openChapter(link.closest(".toc-chapter"), true);
      setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 60);
    }
  }
})();
