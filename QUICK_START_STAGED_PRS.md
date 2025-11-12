# Quick Start: Staged PRs

**Goal**: Break WASM implementation into 5 small, reviewable PRs.

## One-Command Setup

```bash
# Run this from wasm-build-target branch
./stage_prs.sh
```

This creates all 5 PR branches automatically!

---

## The 5 PRs

```
master
  ↑
  └─ (Final PR)
     ↑
wasm-build-target (staging)
  ├─ PR #1: wasm-primitives          (2 files)
  ├─ PR #2: js-api-layer              (1 file)
  ├─ PR #3: typescript-and-demo       (4 files)
  ├─ PR #4: build-tooling             (1 file)
  └─ PR #5: wasm-documentation        (5 files)
```

### PR #1: WASM Primitives (2 files)
- `ipv6_wasm.c`
- `cmake/emscripten.cmake`

**Review time**: ~30 minutes
**Focus**: C code quality, API design

### PR #2: JavaScript API (1 file)
- `docs/ipv6-parse-api.js`

**Review time**: ~45 minutes
**Focus**: API usability, error handling

### PR #3: TypeScript & Demo (4 files)
- `docs/ipv6-parse-api.d.ts`
- `docs/index.html`
- `docs/README.md`
- `docs/README_TYPESCRIPT.md`

**Review time**: ~60 minutes
**Focus**: Type correctness, UI/UX

### PR #4: Build Tooling (1 file)
- `build_wasm.sh`

**Review time**: ~15 minutes
**Focus**: Build reliability

### PR #5: Documentation (5 files)
- `README_WASM.md`
- `TECHNICAL_REVIEW_WASM_API.md`
- `ROADMAP_RELEASES.md`
- `WASM_IMPLEMENTATION_SUMMARY.md`
- `PR_STAGING_PLAN.md`

**Review time**: ~30 minutes
**Focus**: Clarity, completeness

---

## Workflow

### 1. Create Branches (Automated)

```bash
./stage_prs.sh
```

### 2. Push to Remote

```bash
git push -u origin wasm-primitives
git push -u origin js-api-layer
git push -u origin typescript-and-demo
git push -u origin build-tooling
git push -u origin wasm-documentation
```

### 3. Create PRs on GitHub

For each branch → `wasm-build-target`:

**PR #1**: `wasm-primitives` → `wasm-build-target`
- Title: "Add WASM bindings with efficient single-call API"
- Copy description from `PR_STAGING_PLAN.md`

**PR #2**: `js-api-layer` → `wasm-build-target`
- Title: "Add idiomatic JavaScript API wrapper for WASM"
- Mark as depends on PR #1

**PR #3**: `typescript-and-demo` → `wasm-build-target`
- Title: "Add TypeScript definitions and interactive demo page"
- Mark as depends on PR #1, #2

**PR #4**: `build-tooling` → `wasm-build-target`
- Title: "Add build tooling for WASM compilation"
- Mark as depends on PR #1, #2, #3

**PR #5**: `wasm-documentation` → `wasm-build-target`
- Title: "Add comprehensive WASM documentation"
- Mark as depends on PR #1, #2, #3, #4

### 4. Review & Merge (In Order!)

**Important**: Merge in sequence: PR #1 → #2 → #3 → #4 → #5

Each PR builds on the previous one.

After each merge, update the staging branch:
```bash
git checkout wasm-build-target
git pull
```

### 5. Final Merge

After all 5 PRs merged to `wasm-build-target`:

**Final PR**: `wasm-build-target` → `master`
- Title: "Add WebAssembly build support with TypeScript"
- Copy description from `PR_STAGING_PLAN.md` (bottom section)

---

## Testing Each PR

### PR #1: WASM Primitives
```bash
git checkout wasm-primitives

# Check if it compiles (requires Emscripten)
emcc ipv6.c ipv6_wasm.c -o test.js \
    -s EXPORTED_FUNCTIONS='["_ipv6_parse_full"]'
```

### PR #2: JavaScript API
```bash
git checkout js-api-layer

# Check for syntax errors
node -c docs/ipv6-parse-api.js
echo "✓ No syntax errors"
```

### PR #3: TypeScript & Demo
```bash
git checkout typescript-and-demo

# Validate TypeScript definitions
tsc --noEmit docs/ipv6-parse-api.d.ts

# Check HTML syntax
# (Just open in browser after WASM is built)
```

### PR #4: Build Tooling
```bash
git checkout build-tooling

# Test build script (requires Emscripten + previous PRs)
./build_wasm.sh

# Test output
open docs/index.html
```

### PR #5: Documentation
```bash
git checkout wasm-documentation

# Check Markdown rendering
# Read through docs to verify accuracy
```

---

## Benefits

✅ **Smaller reviews**: 15-60 min each instead of 3+ hours
✅ **Focused discussion**: Each PR has a specific topic
✅ **Incremental testing**: Test each layer independently
✅ **Clear history**: Git log shows logical progression
✅ **Rollback safety**: Can revert individual PRs if needed

---

## Timeline

**Total review time**: ~3 hours spread across 5 PRs
**Estimated calendar time**: 1-3 days (depending on review speed)

Much more manageable than reviewing all 11 files at once!

---

## Troubleshooting

### "Branch already exists"
```bash
# Delete and recreate
git branch -D wasm-primitives
./stage_prs.sh
```

### "Uncommitted changes"
```bash
# Commit or stash first
git stash
./stage_prs.sh
git stash pop
```

### "Not on wasm-build-target"
```bash
git checkout wasm-build-target
./stage_prs.sh
```

---

## Quick Commands

```bash
# Create all branches
./stage_prs.sh

# Push all branches
for branch in wasm-primitives js-api-layer typescript-and-demo build-tooling wasm-documentation; do
    git push -u origin $branch
done

# Check all branches
git branch | grep wasm
```

---

## Next Steps After Final Merge

After `wasm-build-target` → `master` is merged:

1. **Enable GitHub Pages**:
   - Settings → Pages → Source: `master` branch, `/docs` folder

2. **Test live demo**:
   - Visit `https://yourusername.github.io/ipv6-parse/`

3. **Tag release**:
   ```bash
   git tag v1.3.0-wasm
   git push origin v1.3.0-wasm
   ```

4. **Continue with future PRs**:
   - See `ROADMAP_RELEASES.md` for NPM package, Linux packages, etc.

---

## Need Help?

See detailed PR descriptions in:
- `PR_STAGING_PLAN.md` - Complete PR breakdown with descriptions
- `WASM_IMPLEMENTATION_SUMMARY.md` - Technical overview
- `TECHNICAL_REVIEW_WASM_API.md` - Design rationale
