/* 学习笔记页：渲染目录与内容 / 主题与语言切换 / 滚动高亮 / 搜索过滤 / 锚点瞬时定位 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var DATA = window.NOTES_DATA || { updated: "", chapters: [] };
  var TRIGGER = 110; /* 触发线：视口顶部之下 110px，滚过即视为当前节 */

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
  function fmt(s) {
    /* 转义 HTML 后：`代码` → 代码框，**关键词** → 加粗 */
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
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
      tocHtml += '<a class="toc-link" href="#' + sid + '" data-ch="' + cid + '" data-search="' + esc((sec.t + " " + (sec.lead || "") + " " + sec.points.join(" ")).toLowerCase()) + '">' + esc(sec.t) + '</a>';
      contentHtml += '<div class="note-sec" id="' + sid + '"><h3>' + esc(sec.t) +
        (sec.doc ? '<a class="sec-doc" href="' + esc(sec.doc) + '" target="_blank" rel="noopener">官方文档 ↗</a>' : '') +
        '</h3>' +
        (sec.lead ? '<p class="sec-lead">' + fmt(sec.lead) + '</p>' : '') +
        '<' + (sec.ordered ? 'ol' : 'ul') + ' class="pts">' +
        sec.points.map(function (p) {
          var warn = p.indexOf("⚠") === 0;
          return '<li' + (warn ? ' class="warn"' : '') + '>' + fmt(p) + '</li>';
        }).join("") +
        '</' + (sec.ordered ? 'ol' : 'ul') + '>' +
        (sec.see ? '<p class="see-chip">' + esc(sec.see) + '</p>' : '') +
        '</div>';
    });

    tocHtml += '</div></div>';
    contentHtml += '</section>';
  });

  tocNav.innerHTML = tocHtml;
  content.innerHTML = contentHtml;

  /* ---------- 章折叠 ---------- */
  var chapters = $$(".toc-chapter");
  function openChapter(el, open) {
    el.classList.toggle("open", open === undefined ? true : open);
  }
  tocNav.addEventListener("click", function (e) {
    var head = e.target.closest(".toc-ch-head");
    if (head) {
      var ch = head.parentElement;
      openChapter(ch, !ch.classList.contains("open"));
    }
  });
  openChapter(chapters[0], true);

  /* ---------- 高亮工具 ---------- */
  var secEls = $$(".note-sec");
  var linkMap = {};
  $$(".toc-link").forEach(function (a) { linkMap[a.getAttribute("href").slice(1)] = a; });

  function setActive(id, keepChapters) {
    $$(".toc-link.active").forEach(function (a) { a.classList.remove("active"); });
    var link = linkMap[id];
    if (keepChapters) { /* 搜索过滤中：只更新高亮，不打破用户看到的展开状态 */
      if (link) link.classList.add("active");
      return;
    }
    /* 手风琴跟随：正在看的章展开，其余全部折叠；尚未进入任何节时视为第一章 */
    var target = link ? link.closest(".toc-chapter") : chapters[0];
    chapters.forEach(function (ch) { openChapter(ch, ch === target); });
    if (!link) return;
    link.classList.add("active");
    /* 只滚动目录容器自身——scrollIntoView 会连带滚动页面，造成高亮回跳 */
    var nr = tocNav.getBoundingClientRect();
    var lr = link.getBoundingClientRect();
    if (lr.top < nr.top || lr.bottom > nr.bottom) tocNav.scrollTop += lr.top - nr.top - 24;
  }

  /* ---------- 滚动高亮：scroll 监听 + rAF 节流 ---------- */
  /* 取“最后一个滚过触发线的小节”为当前节，避免视口带监听漏掉矮小节 */
  var pending = false;
  function updateActive() {
    pending = false;
    var current = null;
    var ref = window.scrollY + TRIGGER;
    for (var i = 0; i < secEls.length; i++) {
      if (secEls[i].getBoundingClientRect().top + window.scrollY <= ref) current = secEls[i];
      else break;
    }
    /* 滚到页底时强制点亮最后一节 */
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = secEls[secEls.length - 1];
    setActive(current ? current.id : null, searchInput.value.trim() !== "");
  }
  window.addEventListener("scroll", function () {
    if (!pending) { pending = true; requestAnimationFrame(updateActive); }
  }, { passive: true });

  /* ---------- 侧栏点击：瞬时定位 + 立即高亮 ---------- */
  function jumpTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    var top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(top, 0), behavior: "instant" });
    setActive(id);
  }
  tocNav.addEventListener("click", function (e) {
    var link = e.target.closest(".toc-link");
    if (!link) return;
    e.preventDefault();
    jumpTo(link.getAttribute("href").slice(1));
    if (window.innerWidth <= 960) closeDrawer();
  });

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
  /* 开合用内联样式驱动 transform：内联优先级最高，不依赖级联与动画状态，
     任何内核（含后台恢复、渲染节流）下都立即可靠 */
  function closeDrawer() {
    sidebar.classList.remove("drawer-open");
    sidebar.style.transform = "";
    mask.hidden = true;
    document.body.classList.remove("drawer-lock");
  }
  function openDrawer() {
    sidebar.classList.add("drawer-open");
    sidebar.style.transform = "translateX(0)";
    mask.hidden = false;
    document.body.classList.add("drawer-lock");
  }
  fab.addEventListener("click", function () {
    var open = sidebar.classList.contains("drawer-open");
    if (open) closeDrawer(); else openDrawer();
  });
  /* 文档级委托 + pointerup 兜底：部分移动内核对动态元素的 click 合成不可靠 */
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("#tocClose")) closeDrawer();
  });
  document.addEventListener("pointerup", function (e) {
    if (e.target && e.target.closest && e.target.closest("#tocClose")) closeDrawer();
  });
  mask.addEventListener("click", closeDrawer);
  tocNav.addEventListener("click", function (e) {
    if (e.target.closest(".toc-link") && window.innerWidth <= 960) closeDrawer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (searchInput.value) { searchInput.value = ""; searchInput.dispatchEvent(new Event("input")); }
      closeDrawer();
      searchInput.blur();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      /* PC 快捷键：Ctrl/Cmd+K 聚焦目录搜索（移动端唤起目录） */
      e.preventDefault();
      if (window.innerWidth <= 960) openDrawer(); else { searchInput.focus(); searchInput.select(); }
    } else if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || "")) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  /* ---------- 导航滚动态 ---------- */
  var nav = $("#siteNav");
  function onScrollNav() { nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- 移动端菜单（与主页一致） ---------- */
  var navToggle = $("#navToggle");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".nav-links a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- 启动 ---------- */
  applyLang(currentLang);
  var initialHash = location.hash.slice(1);
  if (initialHash && document.getElementById(initialHash)) {
    var link = linkMap[initialHash];
    if (link && link.closest(".toc-chapter")) openChapter(link.closest(".toc-chapter"), true);
    setTimeout(function () {
      jumpTo(initialHash);
    }, 80);
  } else {
    updateActive();
  }
})();
