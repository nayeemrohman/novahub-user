#!/usr/bin/env python3
# ============================================================
# NOVAHUB — Meta CAPI Auto Setup Script
# Updates ACCESS_TOKEN and TEST_EVENT_CODE in api/meta-capi.js
# ============================================================

import os
import re
import sys

print("=" * 60)
print("  NOVAHUB — Meta CAPI Auto Setup")
print("=" * 60)
print()

# ============================================================
# CONFIGURATION
# ============================================================
CAPI_FILE = "api/meta-capi.js"

NEW_TOKEN = "EAAP8WCYcuFYBSvi9YTLImCCGdn2ZBWjmR8bavON1HQFefTlcE11XAkhXiCkhyjy1NR1pLt1fyJZCe1LFxZCcaCpRNcyQrAEmyj2X9WZAZB6wwNwD95e0zJZAxZB3Cy4S7OlmYZAl1vD3NvQ7z6IZC8jvhJ8ZAngAE6tJOSzPR1424bbUJeO5Yozm2p8EOkn9qefdsqsgZDZD"

# Test Event Code — এখানে আপনার actual code বসান
# Events Manager → Test Events tab থেকে copy করুন
NEW_TEST_CODE = "TEST12345"  # ← আপনার actual code দিয়ে replace করুন

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
# REPLACE ACCESS_TOKEN
# ============================================================
token_pattern = r"const ACCESS_TOKEN = '[^']*';"
new_token_line = f"const ACCESS_TOKEN = '{NEW_TOKEN}';"

if re.search(token_pattern, content):
    content = re.sub(token_pattern, new_token_line, content)
    print(f"✅ ACCESS_TOKEN updated")
    print(f"   New: {NEW_TOKEN[:30]}...{NEW_TOKEN[-10:]}")
else:
    print("⚠️  ACCESS_TOKEN pattern not found")

print()

# ============================================================
# REPLACE TEST_EVENT_CODE
# ============================================================
testcode_pattern = r"const TEST_EVENT_CODE = '[^']*';"
new_testcode_line = f"const TEST_EVENT_CODE = '{NEW_TEST_CODE}';"

if re.search(testcode_pattern, content):
    content = re.sub(testcode_pattern, new_testcode_line, content)
    print(f"✅ TEST_EVENT_CODE updated")
    print(f"   New: {NEW_TEST_CODE}")
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

# Check token
if NEW_TOKEN in updated:
    print("✅ Token verification: PASSED")
else:
    print("❌ Token verification: FAILED")

# Check test code
if f"'{NEW_TEST_CODE}'" in updated:
    print(f"✅ Test Code verification: PASSED ({NEW_TEST_CODE})")
else:
    print("⚠️  Test Code verification: CHECK NEEDED")

print()

# Show the config lines
print("─" * 60)
print("CURRENT CONFIG:")
print("─" * 60)
for line in updated.split('\n'):
    if 'ACCESS_TOKEN' in line:
        print(f"  {line[:60]}...{line[-20:]}")
    elif 'TEST_EVENT_CODE' in line:
        print(f"  {line}")
    elif 'PIXEL_ID' in line:
        print(f"  {line}")
    elif 'API_VERSION' in line:
        print(f"  {line}")

print()
print("=" * 60)
print("  ✅ SETUP COMPLETE")
print("=" * 60)
print()
print("NEXT STEPS:")
print("  1. git add . && git commit -m 'Update CAPI token' && git push")
print("  2. Wait 2-3 min for Vercel deploy")
print("  3. Run curl test")
print()
