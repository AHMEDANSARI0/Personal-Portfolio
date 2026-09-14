#!/usr/bin/env bash
# End-to-end smoke test against a running server (dev or prod).
#   pnpm dev  (or: pnpm build && node .next/standalone/server.js)  →  pnpm test:smoke
set -u
BASE="${BASE:-http://localhost:3000}"
JAR=$(mktemp)
DIR=$(mktemp -d)
PASS=0; FAIL=0
export DIR="$DIR"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-dev-password-123}"

pyget() { python3 -c "import json,sys;d=json.load(sys.stdin);print(d$1)" 2>/dev/null; }

req() { # <method> <path> <out-file> [extra curl args…] → prints status code
  local method="$1" path="$2" out="$3"; shift 3
  curl -s -o "$out" -w '%{http_code}' -X "$method" "$BASE$path" "$@"
}
check() {
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); printf '  ok   %-46s %s\n' "$1" "$3"
  else FAIL=$((FAIL+1)); printf '  FAIL %-46s expected %s got %s\n' "$1" "$2" "$3"; fi
}
contains() {
  if grep -q "$2" "$3" 2>/dev/null; then PASS=$((PASS+1)); printf '  ok   %-46s contains "%s"\n' "$1" "$2"
  else FAIL=$((FAIL+1)); printf '  FAIL %-46s missing "%s"\n' "$1" "$2"; fi
}
jq_json() { # build json safely via python
  python3 -c "import json,sys;print(json.dumps(json.loads(sys.argv[1])))" "$1"
}

echo "── public site ──────────────────────────────────"
check "GET / 200" 200 "$(req GET / $DIR/home.html)"
contains "home shows placeholder name" "\[Your Name\]" "$DIR/home.html"
contains "meta description present" 'name="description"' "$DIR/home.html"
contains "canonical present" 'rel="canonical"' "$DIR/home.html"
contains "JSON-LD structured data" 'application/ld+json' "$DIR/home.html"
contains "theme vars on html" "-accent" "$DIR/home.html"
check "GET /about 200" 200 "$(req GET /about /dev/null)"
check "GET /work 200" 200 "$(req GET /work /dev/null)"
check "GET /contact 200" 200 "$(req GET /contact /dev/null)"

echo "── SEO infrastructure ───────────────────────────"
req GET /robots.txt $DIR/robots.txt >/dev/null
contains "robots allows crawling" "Allow: /" "$DIR/robots.txt"
contains "robots points at sitemap" "Sitemap" "$DIR/robots.txt"
req GET /sitemap.xml $DIR/sitemap.xml >/dev/null
contains "sitemap has <loc>" "<loc>" "$DIR/sitemap.xml"
contains "sitemap includes published project" "<url>" "$DIR/sitemap.xml"

echo "── 3D assets ────────────────────────────────────"
check "avatar.glb served 200" 200 "$(req GET /uploads/model/avatar.glb /dev/null)"
CT=$(curl -sI "$BASE/uploads/model/avatar.glb" | tr -d '\r' | grep -i '^content-type' | cut -d' ' -f2)
check "avatar.glb mime type" "model/gltf-binary" "$CT"
check "hero poster 200" 200 "$(req GET /uploads/image/hero-poster.jpg /dev/null)"

echo "── auth guard ───────────────────────────────────"
check "admin API blocked when logged out" 401 "$(req GET /api/admin/projects /dev/null)"
check "/admin redirects to login" 307 "$(req GET /admin /dev/null)"
BAD=$(python3 -c "import json;print(json.dumps({'email':'admin@example.com','password':'definitely-not-it'}))")
check "wrong password → 401" 401 "$(req POST /api/admin/auth /dev/null -H 'content-type: application/json' -d "$BAD")"
python3 -c "import json,os;open(os.environ['DIR']+'/good.json','w').write(json.dumps({'email':os.environ['ADMIN_EMAIL'],'password':os.environ['ADMIN_PASSWORD']}))" || { echo "python3 required for smoke test"; exit 2; }
check "correct login → 200 + cookie" 200 "$(curl -s -c "$JAR" -o "$DIR/login.json" -w '%{http_code}' -X POST "$BASE/api/admin/auth" -H 'content-type: application/json' --data-binary @"$DIR/good.json")"
contains "login body says ok" '"ok": *true' "$DIR/login.json"

A=(-b "$JAR")
echo "── admin CRUD (authenticated) ───────────────────"
check "authed projects list" 200 "$(req GET /api/admin/projects $DIR/proj0.json "${A[@]}")"
PRE_IDS=$(python3 -c "import json;print(','.join(str(r['id']) for r in json.load(open('$DIR/proj0.json'))))")
NEW=$(python3 -c "import json;print(json.dumps({'title':'Smoke Test Project','summary':'created by scripts/smoke.sh','tags':['test'],'published':True,'order':9}))")
check "create project → 201" 201 "$(req POST /api/admin/projects $DIR/created.json -H 'content-type: application/json' -d "$NEW" "${A[@]}")"
PROJID=$(pyget '["id"]' < $DIR/created.json)
check "created project has id" "true" "$([ -n "$PROJID" ] && echo true || echo false)"
UPD=$(python3 -c "import json;print(json.dumps({'title':'Smoke Test Project v2','summary':'edited','tags':[],'published':True,'order':9}))")
check "update project" 200 "$(req PUT "/api/admin/projects/$PROJID" /dev/null -H 'content-type: application/json' -d "$UPD" "${A[@]}")"
IDS="$PRE_IDS"
check "reorder persists" 200 "$(req PUT /api/admin/projects $DIR/reorder.json -H 'content-type: application/json' -d "{\"ids\":[$PROJID,$IDS]}" "${A[@]}")"
contains "reorder response" "reordered" "$DIR/reorder.json"
TNEW=$(python3 -c "import json;print(json.dumps({'name':'Smoke Tester','role':'QA','quote':'This smoke test verified the testimonial flow.','rating':5,'approved':True,'order':1}))")
check "create testimonial → 201" 201 "$(req POST /api/admin/testimonials $DIR/t.json -H 'content-type: application/json' -d "$TNEW" "${A[@]}")"
TID=$(pyget '["id"]' < $DIR/t.json)
BADT='{"name":"x","quote":"too short"}'
check "invalid testimonial → 422" 422 "$(req POST /api/admin/testimonials /dev/null -H 'content-type: application/json' -d "$BADT" "${A[@]}")"
THEME=$(python3 -c "import json;print(json.dumps({'key':'theme','value':{'mode':'dark','accent':'#FF6600','fonts':'system','hero3dOnMobile':False,'ogImage':'/uploads/image/og-default.png','faviconUrl':''}}))")
check "save theme content" 200 "$(req PUT /api/admin/content /dev/null -H 'content-type: application/json' -d "$THEME" "${A[@]}")"
check "content GET shows new accent" 200 "$(req GET /api/admin/content $DIR/content.json "${A[@]}")"
contains "accent persisted" "#FF6600" "$DIR/content.json"
check "invalid theme rejected" 422 "$(req PUT /api/admin/content /dev/null -H 'content-type: application/json' -d '{"key":"theme","value":{"mode":"neon","accent":"nope"}}' "${A[@]}")"
# ISR: the earlier GET triggered regeneration after the tag invalidation —
# poll briefly so the test isn't racing the (correctly async) revalidation.
for t in 1 2 3 4 5; do
  req GET / $DIR/home3.html >/dev/null
  grep -q "#FF6600" "$DIR/home3.html" && break
  sleep 1
done
contains "revalidation reaches public HTML" "#FF6600" "$DIR/home3.html"
check "seo pages endpoint" 200 "$(req GET /api/admin/seo $DIR/seo.json "${A[@]}")"
contains "seo lists home" '"/"' "$DIR/seo.json"

echo "── contact → messages pipeline ──────────────────"
MSG=$(python3 -c "import json;print(json.dumps({'name':'Smoke Bot','email':'bot@example.com','subject':'ping','message':'hello from the smoke test','company_website':''}))")
check "contact form accepted" 201 "$(req POST /api/contact /dev/null -H 'content-type: application/json' -d "$MSG")"
check "message visible in admin" 200 "$(req GET /api/admin/messages $DIR/inbox.json "${A[@]}")"
contains "sender in inbox" "Smoke Bot" "$DIR/inbox.json"
MID=$(pyget '[0]["id"]' < $DIR/inbox.json)
check "mark message replied" 200 "$(req PUT /api/admin/messages /dev/null -H 'content-type: application/json' -d "{\"id\":$MID,\"status\":\"replied\"}" "${A[@]}")"
req GET /api/admin/messages $DIR/inbox-after.json "${A[@]}" >/dev/null
contains "status updated" "replied" "$DIR/inbox-after.json"
SPAM=$(python3 -c "import json;print(json.dumps({'name':'Spam','email':'s@x.io','message':'buy my stuff right now please','company_website':'http://spam.example'}))")
check "honeypot submission still 2xx" 200 "$(req POST /api/contact /dev/null -H 'content-type: application/json' -d "$SPAM")"
req GET /api/admin/messages $DIR/inbox2.json "${A[@]}" >/dev/null
if grep -q Spam "$DIR/inbox2.json"; then SPAMSTORED=yes; else SPAMSTORED=no; fi
check "spam NOT stored" "no" "$SPAMSTORED"

echo "── uploads (real file → disk → served back) ─────"
cp "$(dirname "$0")/../uploads/image/hero-poster.jpg" "$DIR/pic.jpg" 2>/dev/null || cp uploads/image/hero-poster.jpg "$DIR/pic.jpg"
check "upload image via admin API" 201 "$(req POST /api/admin/upload $DIR/up.json -F "kind=image" -F "file=@$DIR/pic.jpg;type=image/jpeg" "${A[@]}")"
UPURL=$(pyget '["url"]' < $DIR/up.json)
check "uploaded file is served back" 200 "$(req GET "$UPURL" /dev/null)"
check "oversized GLB rejected with budget note" 413 "$(dd if=/dev/zero bs=1048576 count=7 2>/dev/null of=$DIR/big.glb; req POST /api/admin/upload /dev/null -F "kind=model" -F "file=@$DIR/big.glb;type=model/gltf-binary" "${A[@]}")"

echo "── cleanup ──────────────────────────────────────"
check "delete test project" 200 "$(req DELETE "/api/admin/projects/$PROJID" /dev/null "${A[@]}")"
check "delete testimonial" 200 "$(req DELETE "/api/admin/testimonials/$TID" /dev/null "${A[@]}")"
check "logout clears cookie" 200 "$(req DELETE /api/admin/auth /dev/null "${A[@]}")"
check "unknown content key rejected" 400 \
  "$(req PUT /api/admin/content /dev/null -H 'content-type: application/json' -d '{"key":"nope","value":{}}' "${A[@]}")"
check "forged token rejected at edge" 401 \
  "$(req GET /api/admin/projects /dev/null -H 'cookie: pf_admin=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.badsignature')"
# note: stateless JWT — an already-issued valid token stays usable until expiry by design.
# For instant revocation add a tokenVersion column to AdminUser (see README ▸ Security notes).

rm -rf "$DIR"
[ -n "${KEEP_JAR:-}" ] || rm -f "$JAR"
echo
echo "smoke: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
