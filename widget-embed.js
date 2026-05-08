/*
 * Chatbot widget embed script (Main Platform Version)
 */
(function () {
  "use strict";
  if (window.__ChatbotWidgetLoaded) return;
  window.__ChatbotWidgetLoaded = true;

  var cfg = window.ChatbotConfig || {};
  var apiKey = cfg.apiKey;
  if (!apiKey) {
    console.warn("[Chatbot] window.ChatbotConfig.apiKey is not set.");
    return;
  }
  var apiUrl = (cfg.apiUrl || "").replace(/\/$/, "");

  // Detect origin of this script
  var scriptOrigin = "";
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || "";
    if (src.indexOf("widget-embed.js") !== -1) {
      try { scriptOrigin = new URL(src).origin; } catch (e) { }
      break;
    }
  }
  if (!apiUrl) apiUrl = scriptOrigin || "https://chatmesaj.cc";
  var embedHost = scriptOrigin || "https://chatmesaj.cc";
  var zIndex = cfg.zIndex !== undefined ? Number(cfg.zIndex) : 2147483647;

  function isAccountRoute() {
    return window.location.pathname.indexOf("/account") !== -1;
  }

  function isMobile() {
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function buildEmbedSrc() {
    var src = embedHost + "/embed.html?apiKey=" + encodeURIComponent(apiKey) +
      "&apiUrl=" + encodeURIComponent(apiUrl);
    if (isAccountRoute() || isMobile()) src += "&noAutoOpen=1";
    if (cfg.title) src += "&title=" + encodeURIComponent(cfg.title);
    if (cfg.subtitle) src += "&subtitle=" + encodeURIComponent(cfg.subtitle);
    src += "&parentUrl=" + encodeURIComponent(window.location.href);
    return src;
  }

  function mount() {
    if (document.getElementById("__chatbot-widget-iframe")) return;

    // ── IFRAME ────────────────────────────────────────────────────────────────
    var iframe = document.createElement("iframe");
    iframe.id = "__chatbot-widget-iframe";
    iframe.src = buildEmbedSrc();
    iframe.title = "Support chat";
    iframe.tabIndex = -1;
    iframe.setAttribute("allow", "clipboard-write; microphone");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.cssText = [
      "position:fixed",
      "bottom:0",
      "right:0",
      "width:450px",
      "height:750px",
      "border:0",
      "z-index:" + zIndex,
      "background:none",
      "pointer-events:none",
      "overflow:visible",
    ].join(";") + ";";
    iframe.setAttribute("inert", "");

    // ── PROXY BUTTON ─────────────────────────────────────────────────────────
    var proxy = document.createElement("div");
    proxy.id = "__chatbot-proxy-btn";
    proxy.setAttribute("aria-label", "Open chat");
    proxy.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "width:80px",
      "height:80px",
      "z-index:" + (zIndex + 1),
      "cursor:pointer",
      "background:transparent",
      "border-radius:50%",
    ].join(";") + ";";

    var userClickedProxy = false;

    function openWidget() {
      userClickedProxy = true;
      iframe.removeAttribute("inert");
      iframe.style.pointerEvents = "auto";
      if (iframe.contentWindow) {
        // Send url-change FIRST so currentPage is correct when the widget opens
        iframe.contentWindow.postMessage({ type: "chatbot:url-change", url: window.location.href }, "*");
        iframe.contentWindow.postMessage({ type: "chatbot:open" }, "*");
      }
    }

    proxy.addEventListener("click", openWidget);
    proxy.addEventListener("touchend", function (e) {
      e.preventDefault(); 
      openWidget();
    }, { passive: false });

    var isOpen = false;

    function onOpen() {
      isOpen = true;
      iframe.removeAttribute("inert");
      iframe.style.pointerEvents = "auto";
      proxy.style.display = "none";
      var w = window.innerWidth;
      var h = window.innerHeight;
      if (w < 600) {
        iframe.style.width = w + "px";
        iframe.style.height = h + "px";
      } else {
        iframe.style.width = "450px";
        iframe.style.height = "750px";
      }
    }

    function onClose() {
      isOpen = false;
      iframe.setAttribute("inert", "");
      iframe.style.pointerEvents = "none";
      proxy.style.display = "block";
      iframe.blur();
      document.body.focus();
    }

    window.addEventListener("message", function (event) {
      if (event.origin !== embedHost) return;
      var data = event.data;
      if (!data) return;
      // Handle both chatbot:opened/chatbot:closed (from ChatWidget) and legacy chatbot-state
      var newIsOpen;
      if (data.type === "chatbot:opened") {
        newIsOpen = true;
      } else if (data.type === "chatbot:closed") {
        newIsOpen = false;
      } else if (data.type === "chatbot-state") {
        newIsOpen = !!data.isOpen;
      } else {
        return;
      }

      if (newIsOpen && !userClickedProxy && (isAccountRoute() || isMobile())) {
        return;
      }

      if (isOpen === newIsOpen) return;
      if (newIsOpen) { onOpen(); } else { onClose(); }
    });

    window.addEventListener("resize", function () {
      if (isOpen) {
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w < 600) {
          iframe.style.width = w + "px";
          iframe.style.height = h + "px";
        }
      }
    });

    // SPA route watcher: notify iframe on route change
    var lastPath = window.location.pathname + window.location.search;
    setInterval(function () {
      var currentPath = window.location.pathname + window.location.search;
      if (currentPath === lastPath) return;
      lastPath = currentPath;
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "chatbot:url-change", url: window.location.href }, "*");
      }
    }, 500);

    iframe.addEventListener("load", function() {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "chatbot:url-change", url: window.location.href }, "*");
      }
    });

    document.body.appendChild(iframe);
    document.body.appendChild(proxy);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
