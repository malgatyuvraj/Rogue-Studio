#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Rogue Studio — Production Readiness Test Suite
# Run against a live server: ./tests/e2e/smoke.sh [base_url]
# ══════════════════════════════════════════════════════════════

set -o pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

green() { echo -e "\033[32m✓ $1\033[0m"; }
red() { echo -e "\033[31m✗ $1\033[0m"; }

assert_status() {
  local desc="$1" url="$2" method="${3:-GET}" status="${4:-200}" data="${5:-}" header="${6:-}"
  local actual
  if [[ "$method" == "POST" ]]; then
    if [[ -n "$header" ]]; then
      actual=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -H "$header" -d "$data") || actual="000"
    else
      actual=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data") || actual="000"
    fi
  else
    actual=$(curl -s -o /dev/null -w "%{http_code}" "$url") || actual="000"
  fi
  if [[ "$actual" == "$status" ]]; then
    green "$desc (HTTP $actual)"
    ((PASS++))
  else
    red "$desc — expected $status, got $actual"
    ((FAIL++))
  fi
}

assert_contains() {
  local desc="$1" url="$2" method="${3:-GET}" expected="$4" data="${5:-}" header="${6:-}"
  local body
  if [[ "$method" == "POST" ]]; then
    if [[ -n "$header" ]]; then
      body=$(curl -s -X POST "$url" -H "Content-Type: application/json" -H "$header" -d "$data") || body=""
    else
      body=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data") || body=""
    fi
  else
    body=$(curl -s "$url") || body=""
  fi
  if [[ -z "$expected" ]] || echo "$body" | grep -q "$expected"; then
    green "$desc"
    ((PASS++))
  else
    red "$desc — response did not contain '$expected'"
    echo "  Got: ${body:0:200}"
    ((FAIL++))
  fi
}

echo "═══════════════════════════════════════════════════"
echo " Rogue Studio Smoke Tests — $BASE_URL"
echo "═══════════════════════════════════════════════════"
echo ""

# ── Page Load ──
echo "── Page Load ──"
assert_status "Homepage returns 200" "$BASE_URL/"

# ── Air-Gap Enforcement ──
echo ""
echo "── Air-Gap Enforcement ──"
assert_contains "Air-gap blocks OpenAI" "$BASE_URL/api/chat" POST "AIR-GAP VIOLATION" \
  '{"messages":[{"role":"user","content":"hi"}],"provider":"openai","model":"gpt-4o"}' \
  "x-air-gap-mode: true"

assert_contains "Air-gap blocks Anthropic" "$BASE_URL/api/chat" POST "AIR-GAP VIOLATION" \
  '{"messages":[{"role":"user","content":"hi"}],"provider":"anthropic","model":"claude-3"}' \
  "x-air-gap-mode: true"

assert_contains "Air-gap allows Ollama provider" "$BASE_URL/api/chat" POST "" \
  '{"messages":[{"role":"user","content":"hi"}],"provider":"ollama","model":"llama3"}' \
  "x-air-gap-mode: true"

# ── Models Endpoint ──
echo ""
echo "── Models Endpoint ──"
assert_status "GET /api/models returns 200" "$BASE_URL/api/models"

# ── Workspace CRUD ──
echo ""
echo "── Workspace CRUD ──"
assert_contains "Write file" "$BASE_URL/api/workspace/write" POST '"success":true' \
  '{"filepath":"_smoke_test.txt","content":"smoke test content"}'

assert_contains "Read file" "$BASE_URL/api/workspace/read" POST "smoke test content" \
  '{"filepath":"_smoke_test.txt"}'

assert_contains "List shows file" "$BASE_URL/api/workspace/list" GET "_smoke_test.txt"

assert_contains "Delete file" "$BASE_URL/api/workspace/delete" POST '"success":true' \
  '{"filepath":"_smoke_test.txt"}'

assert_contains "Read deleted returns 404" "$BASE_URL/api/workspace/read" POST "File not found" \
  '{"filepath":"_smoke_test.txt"}'

# ── Security Guards ──
echo ""
echo "── Security Guards ──"
assert_contains "Path traversal blocked" "$BASE_URL/api/workspace/read" POST "Path traversal denied" \
  '{"filepath":"../../etc/passwd"}'

assert_contains "Remote host blocked (execute)" "$BASE_URL/api/execute" POST "Access denied" \
  '{"command":"whoami"}' "Host: evil.com"

assert_contains "Remote host blocked (write)" "$BASE_URL/api/workspace/write" POST "Access denied" \
  '{"filepath":"hack.txt","content":"x"}' "Host: evil.com"

assert_contains "Forge injection blocked" "$BASE_URL/api/forge" POST "Invalid model ID" \
  '{"modelId":"model; rm -rf /"}'

# ── Code Execution ──
echo ""
echo "── Code Execution ──"
assert_contains "Python execution" "$BASE_URL/api/execute" POST "hello" \
  '{"code":"print(\"hello\")","language":"python"}'

assert_contains "Bash execution" "$BASE_URL/api/execute" POST "world" \
  '{"code":"echo world","language":"bash"}'

assert_contains "Unsupported lang rejected" "$BASE_URL/api/execute" POST "not supported" \
  '{"code":"fn main(){}","language":"rust"}'

# ── IPFS Deploy ──
echo ""
echo "── IPFS Deploy ──"
assert_contains "Simulated IPFS deploy" "$BASE_URL/api/deploy" POST '"success":true' \
  '{"content":"<h1>Test</h1>","filename":"test.html"}'

# ── Tor Check ──
echo ""
echo "── Tor Binary Detection ──"
assert_status "GET /api/deploy/tor returns 200" "$BASE_URL/api/deploy/tor"

# ── Results ──
echo ""
echo "═══════════════════════════════════════════════════"
echo " Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
