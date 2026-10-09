import os
import re

BACKEND_DIR = os.path.abspath("backend")

fstring_queries = []
concat_queries = []
all_executes = []

for root, _, files in os.walk(BACKEND_DIR):
    for f in files:
        if f.endswith(".py"):
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, BACKEND_DIR)
            with open(filepath, "r", encoding="utf-8") as fc:
                lines = fc.readlines()
            
            for idx, line in enumerate(lines, 1):
                # Search for strings containing SQL keywords that use f-strings or format or concat
                lower_line = line.lower()
                if any(k in lower_line for k in ["select ", "insert into", "update ", "delete from"]):
                    if line.strip().startswith("f\"") or line.strip().startswith("f'") or " f\"" in line or " f'" in line:
                        fstring_queries.append((rel_path, idx, line.strip()))
                    if ".format(" in line:
                        concat_queries.append((rel_path, idx, line.strip()))
                    if " + " in line and any(q in line for q in ["\"", "'"]):
                        concat_queries.append((rel_path, idx, line.strip()))

print("--- F-STRING SQL STATEMENTS ---")
for f in fstring_queries:
    print(f"[{f[0]}:{f[1]}] {f[2]}")

print("\n--- FORMAT / CONCAT SQL STATEMENTS ---")
for c in concat_queries:
    print(f"[{c[0]}:{c[1]}] {c[2]}")
