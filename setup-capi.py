#!/usr/bin/env python3
# ============================================================
# NOVAHUB — Meta CAPI Auto Setup Script
# Updates ACCESS_TOKEN and TEST_EVENT_CODE in api/meta-capi.js
# ============================================================
# SECURITY: This script requires META_ACCESS_TOKEN to be set in
# the environment. It never hardcodes tokens.
#
# Usage:
#   META_ACCESS_TOKEN='EAA...' python setup-capi.py
#
# The script will replace the token placeholder in api/meta-capi.js.
# NOTE: As of Phase 2, api/meta-capi.js reads tokens from process.env,
# so this script is kept for backward compatibility / template
# replacement purposes only.
# ============================================================

import os
import re
import sys

print("=" * 60)
print("  NOVAHUB — Meta CAPI Auto Setup")
print("=" * 60)
print()

# ============================================================
# CONFIGURATION — read from environment (never hardcode)
# ============================================================
CAPI_FILE = "api/meta-capi.js"

NEW_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
NEW_TEST_CODE = os.environ.get("META_TEST_EVENT_CODE", "")

if not NEW_TOKEN:
    print("❌ META_ACCESS_TOKEN environment variable not set.")
    print()
    print("   Usage:")
    print("     META_ACCESS_TOKEN='EAA...' python setup-capi.py")
    print()
    print("   Optional:")
    print("     META_TEST_EVENT_CODE='TEST12345' META_ACCESS_TOKEN='EAA...' python setup-capi.py")
    print()
    sys.exit(1)

# ============================================================
# VERIFY FILE EXISTS
# ============================================================
if not os.path.exists(CAPI_FILE):
    print(f"❌ File not found: {CAPI_FILE}")
    print(f"   Current directory: {os.getcwd()}")
    print(f"   Files: {os.listdir('.')[:10]}")
    sys.exit(1)

print(f"📄 File: {CAPI_FILE}")
print(f"📏 Size: {os.path.getsize(CAPI_FILE)} bytes")
print()

# ============================================================
# READ FILE
# ============================================================
with open(CAPI_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Backup
with open(CAPI_FILE + '.backup', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Backup created: api/meta-capi.js.backup")
print()

# ============================================================
# DETECT: env-var mode vs hardcode mode
# ============================================================
# If api/meta-capi.js already uses process.env.META_ACCESS_TOKEN,
# there is nothing to replace. This script becomes a no-op.
env_var_mode = "process.env.META_ACCESS_TOKEN" in content

if env_var_mode:
    print("ℹ️  api/meta-capi.js is already using process.env.META_ACCESS_TOKEN.")
    print("    Nothing to replace. Set env vars in Vercel instead.")
    print()
    print("   Required env vars:")
    print("     META_PIXEL_ID         — Meta Dataset / Pixel ID")
    print("     META_ACCESS_TOKEN     — Meta Conversions API Access Token")
    print("     META_TEST_EVENT_CODE  — Optional, for testing")
    print()
    sys.exit(0)

# ============================================================
# LEGACY MODE — replace hardcoded ACCESS_TOKEN (unlikely now)
# ============================================================
print("⚠️  Legacy hardcoded mode detected. Replacing...")
print()

token_pattern = r"const ACCESS_TOKEN = '[^']*';"
new_token_line = f"const ACCESS_TOKEN = '{NEW_TOKEN}';"

if re.search(token_pattern, content):
    content = re.sub(token_pattern, new_token_line, content)
    print(f"✅ ACCESS_TOKEN updated (hidden for security)")
else:
    print("⚠️  ACCESS_TOKEN pattern not found")

print()

# ============================================================
# REPLACE TEST_EVENT_CODE (only if provided)
# ============================================================
if NEW_TEST_CODE:
    testcode_pattern = r"const TEST_EVENT_CODE = '[^']*';"
    new_testcode_line = f"const TEST_EVENT_CODE = '{NEW_TEST_CODE}';"

    if re.search(testcode_pattern, content):
        content = re.sub(testcode_pattern, new_testcode_line, content)
        print(f"✅ TEST_EVENT_CODE updated: {NEW_TEST_CODE}")
    else:
        print("⚠️  TEST_EVENT_CODE pattern not found")
    print()

# ============================================================
# WRITE FILE
# ============================================================
with open(CAPI_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ File updated: {CAPI_FILE}")
print()

# ============================================================
# VERIFY
# ============================================================
print("=" * 60)
print("  VERIFICATION")
print("=" * 60)
print()

with open(CAPI_FILE, 'r', encoding='utf-8') as f:
    updated = f.read()

if NEW_TOKEN in updated:
    print("✅ Token verification: PASSED")
else:
    print("❌ Token verification: FAILED")

if NEW_TEST_CODE:
    if f"'{NEW_TEST_CODE}'" in updated:
        print(f"✅ Test Code verification: PASSED ({NEW_TEST_CODE})")
    else:
        print("⚠️  Test Code verification: CHECK NEEDED")

print()
print("=" * 60)
print("  ✅ SETUP COMPLETE")
print("=" * 60)
print()
print("NEXT STEPS:")
print("  1. git add . && git commit -m 'Update CAPI token' && git push")
print("  2. Wait 2-3 min for Vercel deploy")
print("  3. Verify Purchase event in Meta Events Manager")
print()