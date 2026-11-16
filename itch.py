#!/usr/bin/env python3
"""Bundle the static page for itch.io: a zip with index.html at its root, the same files GitHub Pages serves.
Run build.py first. Usage: python3 itch.py [out.zip]  (default: ../3nD-Basketball-itch.zip, next to the repo)."""
import io, os, sys, zipfile, json
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '3nD-Basketball-itch.zip')
files = ['index.html', 'engine.js', 'manifest.json', 'sw.js', 'version.json'] + ['icons/' + f for f in sorted(os.listdir(os.path.join(here, 'icons')))]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(here, f), f)
ver = json.load(io.open(os.path.join(here, 'version.json'), encoding='utf-8')).get('version')
print('itch bundle %s: %d files, page %s, %.0f KB' % (os.path.abspath(out), len(files), ver, os.path.getsize(out) / 1024))
