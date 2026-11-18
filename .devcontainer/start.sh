#!/usr/bin/env bash
# Starts the production build on port 3000 in the background and prints how to open it.
set -euo pipefail
cd "$(dirname "$0")/../ark-web"

if [ ! -d .next ]; then
  echo "No build yet — run: bash .devcontainer/setup.sh" >&2
  exit 0
fi

pkill -f "next-server" 2>/dev/null || true
nohup npm run start > /tmp/ark-web.log 2>&1 &

site=$(grep -E '^SITE_URL=' .env | cut -d= -f2-)
admin_email=$(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2-)
admin_password=$(grep -E '^ADMIN_PASSWORD=' .env | cut -d= -f2-)
cat <<EOF

  The Ark is starting (logs: /tmp/ark-web.log)

  Website : $site
  Admin   : $site/admin   ($admin_email / $admin_password)

  To share with someone: Ports tab → port 3000 → right-click → Port Visibility → Public.

EOF
