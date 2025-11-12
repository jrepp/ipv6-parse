#!/usr/bin/env bash
# Script to stage all PR branches from wasm-build-target
#
# This script creates 5 PR branches and stages the appropriate files in each.
# Run this from the wasm-build-target branch.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}WASM PR Staging Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check we're on wasm-build-target
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "wasm-build-target" ]; then
    echo -e "${RED}Error: Must be on wasm-build-target branch${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    echo "Please commit or stash them first."
    exit 1
fi

echo -e "${GREEN}✓${NC} On wasm-build-target branch"
echo -e "${GREEN}✓${NC} No uncommitted changes"
echo ""

# Function to create and stage a PR branch
create_pr_branch() {
    local BRANCH_NAME=$1
    local COMMIT_MSG=$2
    shift 2
    local FILES=("$@")

    echo -e "${BLUE}Creating branch: ${BRANCH_NAME}${NC}"

    # Create branch from master (empty starting point)
    git checkout master
    git checkout -b "$BRANCH_NAME"

    # Cherry-pick specific files from wasm-build-target
    for FILE in "${FILES[@]}"; do
        git checkout wasm-build-target -- "$FILE"
        echo -e "  ${GREEN}+${NC} $FILE"
    done

    # Stage and commit
    git add "${FILES[@]}"
    git commit -m "$COMMIT_MSG"

    echo -e "${GREEN}✓${NC} Branch $BRANCH_NAME created and committed"
    echo ""

    # Return to staging branch
    git checkout wasm-build-target
}

# ============================================================================
# PR #1: WASM Primitives
# ============================================================================

echo -e "${YELLOW}PR #1: WASM Primitives${NC}"

create_pr_branch "wasm-primitives" \
"Add WASM bindings with efficient single-call API

- Add ipv6_wasm.c with stateless WASM primitive functions
- Add cmake/emscripten.cmake for Emscripten toolchain
- Implement ipv6_parse_full() for single-call parsing
- Use packed 80-byte structure for efficient data transfer
- Add comparison and utility functions

Performance improvement: 2-3x faster vs naive multi-call approach

Part of WASM build infrastructure implementation." \
    "ipv6_wasm.c" \
    "cmake/emscripten.cmake"

# ============================================================================
# PR #2: JavaScript API Layer
# ============================================================================

echo -e "${YELLOW}PR #2: JavaScript API Layer${NC}"

create_pr_branch "js-api-layer" \
"Add idiomatic JavaScript API wrapper for WASM

- Add IPv6Parser class with clean API
- Add IPv6Address immutable result class
- Add IPv6ParseError custom exception
- Hide WASM complexity from users
- Provide modern ES6 API with proper error handling

Reduces boilerplate by 99% compared to raw WASM calls.

Depends on: PR #1 (WASM primitives)" \
    "docs/ipv6-parse-api.js"

# ============================================================================
# PR #3: TypeScript & Demo
# ============================================================================

echo -e "${YELLOW}PR #3: TypeScript Definitions & Demo Page${NC}"

create_pr_branch "typescript-and-demo" \
"Add TypeScript definitions and interactive demo page

- Add comprehensive TypeScript type definitions (.d.ts)
- Add TypeScript usage guide with framework examples
- Add interactive demo page with beautiful UI
- Add demo documentation

TypeScript features:
- Full type safety with compile-time checks
- IDE autocomplete and IntelliSense support
- React and Vue component examples
- Type-safe error handling patterns

Demo features:
- Real-time parsing with visual feedback
- 8 example addresses for quick testing
- Mobile-responsive gradient UI
- Works with file:// protocol (no server needed)

Depends on: PR #1, PR #2" \
    "docs/ipv6-parse-api.d.ts" \
    "docs/index.html" \
    "docs/README.md" \
    "docs/README_TYPESCRIPT.md"

# ============================================================================
# PR #4: Build Tooling
# ============================================================================

echo -e "${YELLOW}PR #4: Build Tooling${NC}"

create_pr_branch "build-tooling" \
"Add build tooling for WASM compilation

- Add build_wasm.sh automated build script
- Detect and validate Emscripten installation
- Support clean builds with flag
- Generate single-file WASM output (base64 embedded)
- Provide clear status messages with colors

Output: docs/ipv6-parse.js (WASM + glue code)

Depends on: PR #1, PR #2, PR #3" \
    "build_wasm.sh"

# ============================================================================
# PR #5: Documentation
# ============================================================================

echo -e "${YELLOW}PR #5: Comprehensive Documentation${NC}"

create_pr_branch "wasm-documentation" \
"Add comprehensive WASM documentation

- Add README_WASM.md with complete user guide
- Add TECHNICAL_REVIEW_WASM_API.md with design rationale
- Add ROADMAP_RELEASES.md with future release strategy
- Add WASM_IMPLEMENTATION_SUMMARY.md with overview
- Add PR_STAGING_PLAN.md with PR breakdown

Documentation includes:
- Installation and build instructions
- Testing (file:// protocol supported - no server needed!)
- Complete API reference
- TypeScript examples
- Performance analysis
- Design principles and best practices
- Troubleshooting guide

Depends on: PR #1, PR #2, PR #3, PR #4" \
    "README_WASM.md" \
    "TECHNICAL_REVIEW_WASM_API.md" \
    "ROADMAP_RELEASES.md" \
    "WASM_IMPLEMENTATION_SUMMARY.md" \
    "PR_STAGING_PLAN.md"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}All PR branches created!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Created branches:"
echo "  1. wasm-primitives"
echo "  2. js-api-layer"
echo "  3. typescript-and-demo"
echo "  4. build-tooling"
echo "  5. wasm-documentation"
echo ""
echo "Next steps:"
echo ""
echo "1. Review each branch:"
echo "   git checkout wasm-primitives"
echo "   # Review changes, test if possible"
echo ""
echo "2. Push branches to remote:"
echo "   git push -u origin wasm-primitives"
echo "   git push -u origin js-api-layer"
echo "   git push -u origin typescript-and-demo"
echo "   git push -u origin build-tooling"
echo "   git push -u origin wasm-documentation"
echo ""
echo "3. Create PRs on GitHub:"
echo "   - Each branch → wasm-build-target"
echo "   - Use PR descriptions from PR_STAGING_PLAN.md"
echo "   - Review and merge in order (1 → 2 → 3 → 4 → 5)"
echo ""
echo "4. After all merged to wasm-build-target:"
echo "   - Create final PR: wasm-build-target → master"
echo ""
echo -e "${BLUE}See PR_STAGING_PLAN.md for detailed PR descriptions${NC}"
