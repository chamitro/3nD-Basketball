#!/usr/bin/env python3
"""Bundle the itch.io launcher: a one-screen page that sends people to the real site to install the game (the game itself
is not played inside itch's frame, so a team is never tied to itch's storage). Zip with index.html at its root.
Usage: python3 itch.py [out.zip]  (default: ../3nD-Basketball-itch.zip, next to the repo)."""
import os, sys, zipfile
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '3nD-Basketball-itch.zip')
files = ['index.html', 'icon.png']
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(here, 'itch', f), f)
print('itch launcher %s: %d files, %.0f KB' % (os.path.abspath(out), len(files), os.path.getsize(out) / 1024))
