#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v php >/dev/null; then
  exec php artisan serve --host=127.0.0.1 --port="${PORT:-8000}"
fi
if [ -x .tools/php ]; then
  exec .tools/php artisan serve --host=127.0.0.1 --port="${PORT:-8000}"
fi
printf 'PHP 8.3 or newer is required. See README.md.\n' >&2
exit 1
