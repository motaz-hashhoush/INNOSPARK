import json
import base64
import gzip
import re
import os

input_file = r'd:\Work\INNOSPARK\INNOSPARK Landing Page.html'
output_dir = r'd:\Work\INNOSPARK\unpacked_landing'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find manifest
manifest_match = re.search(r'<script type="__bundler/manifest">(.*?)</script>', content, re.DOTALL)
if not manifest_match:
    print("Manifest not found")
    exit(1)

manifest = json.loads(manifest_match.group(1).strip())

# Find template
template_match = re.search(r'<script type="__bundler/template">(.*?)</script>', content, re.DOTALL)
if template_match:
    template_json = template_match.group(1).strip()
    try:
        template = json.loads(template_json)
        
        # Replace UUIDs with local paths in the template
        for uuid in manifest:
            mime = manifest[uuid]['mime']
            ext = mime.split('/')[-1]
            if 'javascript' in ext: ext = 'js'
            if 'css' in ext: ext = 'css'
            template = template.replace(uuid, f"./{uuid}.{ext}")
            
        with open(os.path.join(output_dir, "index.html"), 'w', encoding='utf-8') as f:
            f.write(template)
        print("Saved index.html from template tag")
    except Exception as e:
        print(f"Error parsing template JSON: {e}")
else:
    print("Template script tag not found")

# Asset extraction (already handles manifest)
print(f"Extracting {len(manifest)} assets...")
for uuid, entry in manifest.items():
    data = base64.b64decode(entry['data'])
    if entry.get('compressed'):
        data = gzip.decompress(data)
    
    mime = entry['mime']
    ext = mime.split('/')[-1]
    if 'javascript' in ext: ext = 'js'
    if 'css' in ext: ext = 'css'
    if 'html' in ext: ext = 'html'
    
    filename = f"{uuid}.{ext}"
    with open(os.path.join(output_dir, filename), 'wb') as f:
        f.write(data)
    print(f"Saved {filename} ({mime})")
