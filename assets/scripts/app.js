/*
 * Shared front-end entry point. Loaded on every page after Vue and skeleton.js.
 *
 * Elipsis.createApp(options).mount("#app") is Vue.createApp with two things set:
 *   - delimiters are [[ ]] so they do not clash with Jinja's {{ }}
 *   - v-skeleton is registered
 */
(function (global) {
  "use strict";

  function createApp(options) {
    var app = global.Vue.createApp(options);
    app.config.compilerOptions.delimiters = ["[[", "]]"];
    app.use(global.Skeleton.vue);
    return app;
  }

  // fetch that returns parsed JSON and rejects on HTTP errors.
  function getJSON(url, options) {
    return fetch(url, options).then(function (response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.json();
    });
  }

  global.Elipsis = { createApp: createApp, getJSON: getJSON };
})(window);
