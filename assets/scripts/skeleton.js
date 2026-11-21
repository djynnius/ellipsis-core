/*
 * skeleton.js: placeholders for anything that has not loaded yet.
 *
 * Images
 *   <img data-skeleton src="..." width="320" height="180" alt="...">
 *   Shimmers until the image loads. Give images a width/height (or a CSS
 *   aspect-ratio) so the placeholder has the right size.
 *
 * Elements
 *   Skeleton.show(el) / Skeleton.hide(el)
 *   Skeleton.until(el, promise)            shimmer el until the promise settles
 *   <div v-skeleton="loading">             the same, driven by Vue state
 *
 * Pages
 *   Leaving for a slow page: the page skeleton appears if the next page has
 *   not arrived within NAVIGATION_DELAY ms. Opt a link or form out with
 *   data-no-skeleton (do this for file downloads).
 *   A page that renders empty and then loads its data: put data-page-loading
 *   on <body> (block body_attrs in views/base.html) and call
 *   Skeleton.pageReady() when the data is in.
 */
(function (global) {
  "use strict";

  var NAVIGATION_DELAY = 200;
  var NAVIGATION_GIVE_UP = 10000;
  var navigationTimer = null;
  var giveUpTimer = null;

  function show(el) {
    el.classList.add("skeleton");
    el.setAttribute("aria-busy", "true");
  }

  function hide(el) {
    el.classList.remove("skeleton");
    el.removeAttribute("aria-busy");
  }

  function toggle(el, loading) {
    (loading ? show : hide)(el);
  }

  function until(el, promise) {
    show(el);
    var done = function () {
      hide(el);
    };
    promise.then(done, done);
    return promise;
  }

  function watchImage(img) {
    if (img.dataset.skeletonWatched) return;
    img.dataset.skeletonWatched = "1";
    if (img.complete && img.naturalWidth > 0) return;

    show(img);
    img.addEventListener("load", function () {
      img.classList.remove("skeleton-failed");
      hide(img);
    });
    img.addEventListener("error", function () {
      hide(img);
      img.classList.add("skeleton-failed");
    });
    // The image may have failed before the listeners were attached.
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      hide(img);
      img.classList.add("skeleton-failed");
    }
  }

  function scan(root) {
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.matches && root.matches("img[data-skeleton]")) watchImage(root);
    root.querySelectorAll("img[data-skeleton]").forEach(watchImage);
  }

  function pageLoading() {
    document.body.setAttribute("data-page-loading", "");
  }

  function pageReady() {
    clearTimeout(navigationTimer);
    clearTimeout(giveUpTimer);
    document.body.removeAttribute("data-page-loading");
  }

  function expectNavigation() {
    clearTimeout(navigationTimer);
    clearTimeout(giveUpTimer);
    navigationTimer = setTimeout(pageLoading, NAVIGATION_DELAY);
    // If no page ever replaces this one (a download, a cancelled request), come back.
    giveUpTimer = setTimeout(pageReady, NAVIGATION_GIVE_UP);
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || link.target || link.hasAttribute("download")) return;
    if (link.closest("[data-no-skeleton]")) return;
    if (link.origin !== location.origin) return;
    var samePage = link.pathname === location.pathname && link.search === location.search;
    if (samePage && link.hash) return;
    expectNavigation();
  }

  function onSubmit(event) {
    var form = event.target;
    if (event.defaultPrevented || form.target || form.closest("[data-no-skeleton]")) return;
    expectNavigation();
  }

  function start() {
    scan(document);
    // Images added later (Vue renders, fetched fragments) are picked up too.
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(scan);
      });
    }).observe(document.body, { childList: true, subtree: true });

    // Capture phase would miss preventDefault() from page code, so listen late.
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    // Back/forward restores this page from cache with the skeleton still up.
    global.addEventListener("pageshow", function (event) {
      if (event.persisted) pageReady();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  global.Skeleton = {
    show: show,
    hide: hide,
    toggle: toggle,
    until: until,
    scan: scan,
    pageLoading: pageLoading,
    pageReady: pageReady,
    // Vue plugin: app.use(Skeleton.vue) registers v-skeleton.
    vue: {
      install: function (app) {
        app.directive("skeleton", {
          mounted: function (el, binding) {
            toggle(el, binding.value);
          },
          updated: function (el, binding) {
            toggle(el, binding.value);
          },
        });
      },
    },
  };
})(window);
