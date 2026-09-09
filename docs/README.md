# GitHub Pages site

- [Interactive demo](https://jrepp.github.io/ipv6-parse/) — `index.html`
- [IPv6 introduction](https://jrepp.github.io/ipv6-parse/guide.html) — `guide.html`
- [C guide](https://jrepp.github.io/ipv6-parse/c-api.html) — `c-api.html`
- [JavaScript guide](https://jrepp.github.io/ipv6-parse/javascript.html) — `javascript.html`
- [TypeScript guide](https://jrepp.github.io/ipv6-parse/typescript.html) — `typescript.html`
- [Development](https://jrepp.github.io/ipv6-parse/development.html) — `development.html`

The pages are static HTML. Edit them directly; no site generator is required.
Documentation pages share `guide.css`. Keep navigation consistent across them.
The demo loads `ipv6-parse.js` (generated WebAssembly) and `ipv6-parse-api.js`.

To rebuild WebAssembly, activate the Emscripten SDK and run `./build_wasm.sh`
from the repository root. See the [WebAssembly guide](../README_WASM.md).

Preview locally from the repository root:

```sh
python3 -m http.server --directory docs 8000
```

Open `http://localhost:8000/` for the demo or `/guide.html` for the introduction and links to each language guide.

The [Pages workflow](../.github/workflows/pages.yml) builds pull requests and
publishes changes from `main`. Set **Settings → Pages → Source** to **GitHub
Actions** and allow `main` in the `github-pages` deployment environment.
Release tags do not publish Pages; deployment is managed by `pages.yml`.
