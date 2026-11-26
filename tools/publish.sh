#!/bin/bash
# Publish a Companion module release to BOTH GitHub and manarlabs.com (owner rule 2026-11-27: always both).
# usage: tools/publish.sh            (version = package.json; commit the bump first)
# Does: package -> tag + push -> GitHub release with the .tgz -> upload to manarlabs.com/dl/livedeck/companion/
#       (keeps the newest 2 main builds + the c4 build) -> points the site's download links at it -> site build + deploy.
set -euo pipefail
cd "$(dirname "$0")/.."
V=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
T="livedeck-studio-$V.tgz"; KEY=~/.ssh/new_icecast.pem; H=ubuntu@13.210.242.2; D=/opt/shortlisted/web/dl/livedeck/companion
SITE=~/Developer/Shortlisted/site
[ -z "$(git status --porcelain -- src companion package.json)" ] || { echo "commit your changes first"; exit 1; }
corepack yarn package
git push -q origin main
git rev-parse "v$V" >/dev/null 2>&1 || { git tag "v$V"; git push -q origin "v$V"; }
gh release view "v$V" >/dev/null 2>&1 || gh release create "v$V" "$T" --title "LiveDeck Companion module $V" --notes "${NOTES:-See the commits since the previous release.}

Install: Companion 4.3+ → Modules → Import module package → $T."
scp -q -i $KEY "$T" $H:/tmp/ && ssh -i $KEY $H "sudo mv /tmp/$T $D/ && sudo chmod 644 $D/$T && cd $D && ls -t livedeck-studio-[0-9]*.tgz | tail -n +3 | xargs -r sudo rm -f && ls $D"
curl -sfo /dev/null "https://manarlabs.com/dl/livedeck/companion/$T" || { echo "download check failed"; exit 1; }
sed -i '' -E "s#livedeck-studio-[0-9]+\.[0-9]+\.[0-9]+\.tgz#$T#g" "$SITE/content/docs/livedeck.html" "$SITE/lib/products.ts"
(cd "$SITE" && npm run build >/dev/null && rsync -a --rsync-path="sudo rsync" -e "ssh -i $KEY" out/ $H:/opt/shortlisted/web/)
(cd "$SITE/.." && git add site/content/docs/livedeck.html site/lib/products.ts && git commit -q -m "LiveDeck site: Companion module download $V" || true)
curl -s https://manarlabs.com/apps/livedeck/ | grep -q "$T" && echo "published $V: GitHub + manarlabs.com" || { echo "site link check failed"; exit 1; }
