/* 交互逻辑：主题切换 / 语言切换 / 打字机 / 进场动画 / 数字滚动 / 导航 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 主题 ---------- */
  var themeBtn = $("#themeBtn");
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("zc-theme", t); } catch (e) { /* 隐私模式下忽略 */ }
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem("zc-theme"); } catch (e) { /* ignore */ }
  setTheme(savedTheme === "dark" ? "dark" : "light");
  themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    setTheme(cur === "dark" ? "light" : "dark");
  });

  /* ---------- 语言 ---------- */
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
    document.documentElement.setAttribute("lang", dict._meta.lang);
    document.title = dict._meta.title;
    langBtn.textContent = lang === "zh" ? "EN" : "中";
    try { localStorage.setItem("zc-lang", lang); } catch (e) { /* ignore */ }
    startTypewriter();
  }

  langBtn.addEventListener("click", function () {
    applyLang(currentLang === "zh" ? "en" : "zh");
  });

  /* ---------- Hero 打字机 ---------- */
  var twEl = $("#typewriter");
  var twTimer = null;
  function startTypewriter() {
    if (!twEl) return;
    clearTimeout(twTimer);
    var roles = I18N[currentLang].roles;
    if (reduceMotion) { twEl.textContent = roles[0]; return; }
    var ri = 0, ci = 0, deleting = false;
    function tick() {
      var word = roles[ri];
      if (!deleting) {
        ci++;
        twEl.textContent = word.slice(0, ci);
        if (ci === word.length) {
          deleting = true;
          twTimer = setTimeout(tick, 2300);
          return;
        }
        twTimer = setTimeout(tick, 115);
      } else {
        ci--;
        twEl.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          ri = (ri + 1) % roles.length;
          twTimer = setTimeout(tick, 420);
          return;
        }
        twTimer = setTimeout(tick, 45);
      }
    }
    ci = 0; deleting = false; ri = 0;
    twEl.textContent = "";
    twTimer = setTimeout(tick, 650);
  }

  /* ---------- 进场渐显 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- 数字滚动 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        cio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- 导航 ---------- */
  var nav = $("#siteNav");
  var navToggle = $("#navToggle");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  /* 滚动高亮当前区块 */
  var sections = ["about", "skills", "experience", "projects", "opensource", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var sio = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        $$(".nav-links a").forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(function (s) { sio.observe(s); });

  /* ---------- 邮箱弹窗 ---------- */
  var emailModal = $("#emailModal");
  var emailCopyBtn = $("#emailCopyBtn");
  var emailCopyLabel = emailCopyBtn ? emailCopyBtn.querySelector("[data-i18n='modal.copy']") : null;
  var copyTimer = null;

  function openEmailModal(e) {
    if (e) e.preventDefault();
    emailModal.classList.add("open");
    emailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeEmailModal() {
    emailModal.classList.remove("open");
    emailModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  $$(".js-email-btn").forEach(function (a) { a.addEventListener("click", openEmailModal); });
  $("#emailModalClose").addEventListener("click", closeEmailModal);
  emailModal.addEventListener("click", function (e) {
    if (e.target === emailModal) closeEmailModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeEmailModal();
  });

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  emailCopyBtn.addEventListener("click", function () {
    var text = "chatbotzhou@163.com";
    function done() {
      if (!emailCopyLabel) return;
      emailCopyLabel.textContent = I18N[currentLang]["modal.copied"];
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () {
        emailCopyLabel.textContent = I18N[currentLang]["modal.copy"];
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  });

  /* ---------- 启动 ---------- */
  applyLang(currentLang);
})();
