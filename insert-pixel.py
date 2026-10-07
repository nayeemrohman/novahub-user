import glob
import os

print('🚀 Starting pixel insertion...')
print()

# Read template
with open('pixel-template.txt', 'r', encoding='utf-8') as f:
    pixel = f.read()

# Process all HTML files
for filename in sorted(glob.glob('*.html')):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f'❌ {filename} — read error: {e}')
        continue
    
    # Skip if already has pixel
    if '1072007485675742' in content:
        print(f'⏭️  {filename} — already has pixel')
        continue
    
    # Insert before </head>
    if '</head>' in content:
        new_content = content.replace('</head>', pixel + '\n</head>', 1)
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'✅ {filename} — inserted')
        except Exception as e:
            print(f'❌ {filename} — write error: {e}')
    else:
        print(f'⚠️  {filename} — no </head> tag found')

print()
print('═══════════════════')
print('✅ Done!')
