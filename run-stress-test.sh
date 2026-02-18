#!/bin/bash
# run-stress-test.sh - Convenient wrapper for stress-test with NVM

export NVM_DIR="$HOME/.var/app/com.visualstudio.code/config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/run/media/shinehealthcaremagicstarswall/8928883d-165d-44b5-b4e4-6061c55fa00d/MyWebsite - Amazing/Policy.Complince.by.Hnoss.PrisManTHarIOn"

echo ""
echo "🔥 INITIATING STRESS-TEST..."
echo "⚠️  Watch the browser - Frame should turn RED then ICE BLUE!"
echo ""
echo "Press Ctrl+C to stop the test"
echo ""
sleep 2

node scripts/stress-test.js
