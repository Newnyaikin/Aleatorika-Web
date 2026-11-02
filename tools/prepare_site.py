"""Check local static assets and stage only public site files. No pip dependencies."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re, shutil, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'_site'
html=(ROOT/'index.html').read_text(encoding='utf-8')
for js in sorted(ROOT.glob('*.js')):
    subprocess.run(['node','--check',str(js)],check=True)
for block in re.findall(r'<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script>',html,re.S|re.I):
    with tempfile.TemporaryDirectory() as tmp:
        p=Path(tmp)/'inline.js';p.write_text(block,encoding='utf-8')
        subprocess.run(['node','--check',str(p)],check=True)
for asset in re.findall(r'(?:src|href)="([^"#]+)"',html):
    url=urlsplit(asset)
    if url.scheme or url.netloc: continue
    assert (ROOT/unquote(url.path)).is_file(), f'Missing HTML asset: {asset}'
if SITE.exists():shutil.rmtree(SITE)
SITE.mkdir()
for p in sorted(ROOT.iterdir()):
    if p.is_file() and p.suffix in {'.html','.js','.css','.png','.svg','.webmanifest','.ico'}:
        shutil.copy2(p,SITE/p.name)
shutil.copytree(ROOT/'fonts',SITE/'fonts')
(SITE/'.nojekyll').touch()
for asset in re.findall(r"['\"](\./[^'\"]*)['\"]",(ROOT/'sw.js').read_text()):
    path=SITE/unquote(urlsplit(asset).path)
    assert path.exists(),f'Missing service worker asset: {asset}'
assert (SITE/'fonts/manrope.ttf').is_file()
assert (SITE/'index.html').is_file()
print('PASS: JavaScript syntax, local files and offline cache. Public site staged in _site/.')
