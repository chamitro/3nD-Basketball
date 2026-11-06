#!/usr/bin/env python3
# Run before every release:   python3 build.py
# 1. Puts the server function together: the game rules (engine.js) + the league (server.js) + the database + the web part.
# 2. Stamps one version number into index.html, sw.js and version.json. Phones that have the game open or installed
#    compare their number with version.json and show an "Update now" button when it differs.
import io, os, re, json, datetime, hashlib
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: io.open(os.path.join(here, p), encoding='utf-8').read()
def wr(p, t): io.open(os.path.join(here, p), 'w', encoding='utf-8').write(t)

parts = ['engine.js', 'push.js', 'server.js', 'store_rest.js', 'serve_deno.js']
out = ['// @ts-nocheck', '// 3nD Basketball server function. BUILT FILE: do not edit here, edit the parts and run build.py.', '']
for p in parts:
    out += ['// ======================= ' + p + ' =======================', rd(p).replace("'use strict';\n", '')]
new = '\n'.join(out)
build_id = hashlib.sha256(new.encode('utf-8')).hexdigest()[:8]     # a fingerprint of the server code
assert new.count("const SERVER_BUILD='dev';") == 1
new = new.replace("const SERVER_BUILD='dev';", "const SERVER_BUILD='%s';" % build_id)
dst = os.path.join('supabase', 'functions', 'b3', 'index.ts')
changed = (not os.path.exists(os.path.join(here, dst))) or rd(dst) != new
wr(dst, new)
print('server function:', ('CHANGED, deploy it again in Supabase' if changed else 'unchanged, nothing to deploy') + ' (build ' + build_id + ')')

version = datetime.datetime.utcnow().strftime('%Y.%m.%d-%H%M')
page, n1 = re.subn(r"const APP_VERSION='[^']*';", "const APP_VERSION='%s';" % version, rd('index.html'))
sw, n2 = re.subn(r"const CACHE_NAME = '[^']*';", "const CACHE_NAME = 'b3-%s';" % version, rd('sw.js'))
assert n1 == 1 and n2 == 1, 'version markers not found'
wr('index.html', page); wr('sw.js', sw); wr('version.json', json.dumps({'version': version}) + '\n')
print('version', version)
