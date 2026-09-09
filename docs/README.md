# GitHub Pages site

- [Interactive demo](https://jrepp.github.io/ipv6-parse/) — `index.html`
- [Library documentation](https://jrepp.github.io/ipv6-parse/guide.html) — `guide.html`

Both pages are static HTML. Edit them directly; no site generator is required.
The demo loads `ipv6-parse.js` (generated WebAssembly) and `ipv6-parse-api.js`.

To rebuild WebAssembly, activate the Emscripten SDK and run `./build_wasm.sh`
from the repository root. See the [WebAssembly guide](../README_WASM.md).

Preview locally from the repository root:

```sh
python3 -m http.server --directory docs 8000
```

Open `http://localhost:8000/` for the demo or `/guide.html` for the documentation.

The [Pages workflow](../.github/workflows/pages.yml) builds pull requests and
publishes changes from `main`. Set **Settings → Pages → Source** to **GitHub
Actions** and allow `main` in the `github-pages` deployment environment.
Release tags do not publish Pages; deployment is managed by `pages.yml`.
