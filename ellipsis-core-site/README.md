# Ellipsis Core: one-page site

A static landing page for Ellipsis Core. No build step.

## Open it

Double-click `index.html`, or serve the folder:

    python3 -m http.server 8000     # then visit http://localhost:8000

## What's in the folder

    index.html
    assets/
      css/site.css                 page styles, animations and @font-face rules
      scripts/app.js               page state and behaviour (Vue 3)
      scripts/vendor/vue.global.prod.js   Vue 3.5.46, the copy vendored in ellipsis-core
      images/                      wordmark, three-dot mark, favicon
      fonts/                       Inter and JetBrains Mono (latin, woff2, OFL licence)

The folder follows the Ellipsis Core `assets/` layout (css, scripts, images, fonts), so it can be dropped into a scaffold's `assets/` and served at `/assets`.

## Notes

- All illustrations are inline SVG with CSS animation. Motion is switched off for people who prefer reduced motion.
- The install section builds its text from the harness and method you pick. Edit the `harnessData` list in `assets/scripts/app.js` to add a harness.
- Colours, type and spacing come from the Ellipsis Core design system.
- Inter and JetBrains Mono are from the Fontsource packages (SIL Open Font License 1.1).
