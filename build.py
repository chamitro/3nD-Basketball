#!/usr/bin/env python3
# Puts the server function together: the game rules (engine.js) + the league (server.js) + the database + the web part.
# Run after changing engine.js or server.js:   python3 build.py
import io, os
here = os.path.dirname(os.path.abspath(__file__))
parts = ['engine.js', 'server.js', 'store_rest.js', 'serve_deno.js']
out = ['// @ts-nocheck', '// 3nD Basketball server function. BUILT FILE: do not edit here, edit the parts and run build.py.', '']
for p in parts:
    text = io.open(os.path.join(here, p), encoding='utf-8').read().replace("'use strict';\n", '')
    out += ['// ======================= ' + p + ' =======================', text]
dst = os.path.join(here, 'supabase', 'functions', 'b3', 'index.ts')
io.open(dst, 'w', encoding='utf-8').write('\n'.join(out))
print('wrote', dst, os.path.getsize(dst), 'bytes')
