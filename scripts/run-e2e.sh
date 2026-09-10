#!/usr/bin/env bash
set -euo pipefail

qa_cache_dir=".cache/playwright-libs"
qa_lib_dir="$qa_cache_dir/extracted/usr/lib/x86_64-linux-gnu"

if [[ "$(uname -s)" == "Linux" ]] && command -v ldconfig >/dev/null; then
  for qa_dependency in 'libasound2t64:libasound.so.2' 'libnspr4:libnspr4.so' 'libnss3:libnss3.so'; do
    qa_package="${qa_dependency%%:*}"
    qa_library="${qa_dependency#*:}"
    if [[ ! -f "$qa_lib_dir/$qa_library" ]] && ! ldconfig -p 2>/dev/null | grep -F "$qa_library" >/dev/null; then
      if ! command -v apt >/dev/null || ! command -v dpkg-deb >/dev/null; then
        echo "Playwright needs $qa_library. Install your platform's browser runtime dependencies, then rerun npm run e2e." >&2
        exit 1
      fi
      mkdir -p "$qa_cache_dir"
      (cd "$qa_cache_dir" && apt download "$qa_package" && dpkg-deb -x "${qa_package}"_*.deb extracted)
    fi
  done
  export LD_LIBRARY_PATH="$qa_lib_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

npx playwright test
