#!/usr/bin/env bash
set -euo pipefail

qa_cache_dir=".cache/playwright-libs"
qa_lib_dir="$qa_cache_dir/extracted/usr/lib/x86_64-linux-gnu"

if [[ "$(uname -s)" == "Linux" ]] && command -v ldconfig >/dev/null && ! ldconfig -p 2>/dev/null | grep -q 'libasound.so.2'; then
  if [[ ! -f "$qa_lib_dir/libasound.so.2" ]]; then
    if ! command -v apt >/dev/null || ! command -v dpkg-deb >/dev/null; then
      echo "Playwright needs libasound.so.2. Install your platform's ALSA runtime package, then rerun npm run e2e." >&2
      exit 1
    fi
    mkdir -p "$qa_cache_dir"
    (cd "$qa_cache_dir" && apt download libasound2t64 >/dev/null 2>&1 && dpkg-deb -x libasound2t64_*.deb extracted)
  fi
  export LD_LIBRARY_PATH="$qa_lib_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

npx playwright test
