import os
import re

routes_dir = 'backend/routes'
all_files = [os.path.join(routes_dir, f) for f in os.listdir(routes_dir) if f.endswith('.py')]

results = []

for filepath in sorted(all_files):
    fname = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Pattern: @...route(...) followed by optional decorators followed by def func_name(...)
    blocks = re.findall(r'(@[a-zA-Z0-9_]+\.route\([^\)]+\)[\s\S]*?def\s+([a-zA-Z0-9_]+)\s*\([^\)]*\):)', content)
    for full_dec, func in blocks:
        path_m = re.search(r'route\(\s*[\'"]([^\'"]+)[\'"]', full_dec)
        path = path_m.group(1) if path_m else 'unknown'
        methods_m = re.search(r'methods\s*=\s*\[([^\]]+)\]', full_dec)
        methods = methods_m.group(1).replace("'", "").replace('"', '').strip() if methods_m else 'GET'
        has_jwt = '@jwt_required(' in full_dec
        optional_jwt = 'optional=True' in full_dec
        results.append((fname, path, methods, func, has_jwt, optional_jwt))

with open('report_evidence/jwt_scan_results.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total scanned endpoints: {len(results)}\n\n")
    for r in results:
        fname, path, methods, func, has_jwt, opt = r
        jwt_status = 'OPTIONAL' if opt else ('REQUIRED' if has_jwt else 'NONE (UNPROTECTED)')
        out.write(f"{fname:<20} {path:<38} [{methods:<12}] {func:<32} {jwt_status}\n")

print(f"Scanned {len(results)} routes successfully.")
