"""Comprueba referencias locales a archivos mencionadas en HTML/CSS/JS."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
checked = set()

# Direct HTML file references.
html = (ROOT / 'index.html').read_text(encoding='utf-8')
for attr in ('src', 'href'):
    for value in re.findall(rf'{attr}=["\']([^"\']+)["\']', html, flags=re.I):
        if value.startswith(('https://', 'http://', 'mailto:', 'tel:', '#', 'data:')):
            continue
        clean = value.split('#', 1)[0].split('?', 1)[0]
        if clean:
            checked.add((ROOT / clean).resolve())

# CSS url() local resources, resolved from each stylesheet directory.
for css in ROOT.rglob('*.css'):
    content = css.read_text(encoding='utf-8')
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.S)
    for raw in re.findall(r'url\(\s*["\']?([^"\')]+)', content, flags=re.I):
        raw = raw.strip()
        if raw.startswith(('https://', 'http://', 'data:', '#', '%23')):
            continue
        clean = raw.split('?', 1)[0]
        if clean.startswith('/'):
            # Las URL absolutas del CSS de Angular apuntan a assets públicos
            # servidos desde frontend-angular/public durante la ejecución.
            rel = clean.lstrip('/')
            candidates = [ROOT / 'frontend-angular' / 'public' / rel, ROOT / rel]
            existing = next((candidate for candidate in candidates if candidate.exists()), candidates[0])
            checked.add(existing.resolve())
        else:
            checked.add((css.parent / clean).resolve())

# Explicit local paths in JS string literals. Strip comments so examples are not counted.
for js in (ROOT / 'js').glob('*.js'):
    content = js.read_text(encoding='utf-8')
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.S)
    content = re.sub(r'(^|\s)//.*$', r'\1', content, flags=re.M)
    for quote, pattern in [('"', r'"((?:Im|css|js|docs)/[^"\n]+)"'), ("'", r"'((?:Im|css|js|docs)/[^'\n]+)'")]:
        for val in re.findall(pattern, content):
            # Ignore strings that clearly describe routes/fragments rather than paths.
            clean = val.split('#', 1)[0].split('?', 1)[0]
            if clean:
                checked.add((ROOT / clean).resolve())

for path in sorted(checked):
    if not path.exists():
        errors.append(str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path))

if errors:
    print('ERROR: faltan estas referencias locales:')
    print('\n'.join(f'- {e}' for e in errors))
    raise SystemExit(1)
print(f'OK: {len(checked)} referencias locales encontradas; ninguna rota.')
