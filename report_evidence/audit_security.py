import os
import re
import glob
import ast

BACKEND_DIR = os.path.abspath("backend")

print("=" * 60)
print("AUDITING SQL QUERIES IN BACKEND")
print("=" * 60)

sql_pattern = re.compile(r'cursor\.execute\s*\(\s*(.*?)\)', re.DOTALL)

query_records = []

for root, _, files in os.walk(BACKEND_DIR):
    for f in files:
        if f.endswith(".py"):
            filepath = os.path.join(root, f)
            rel_path = os.path.relpath(filepath, BACKEND_DIR)
            with open(filepath, "r", encoding="utf-8") as file_content:
                lines = file_content.readlines()
            
            content = "".join(lines)
            
            # Find cursor.execute calls
            for idx, line in enumerate(lines, 1):
                if "cursor.execute(" in line:
                    # Collect multi-line statement if needed
                    full_stmt = line.strip()
                    j = idx
                    while ")" not in full_stmt and j < len(lines):
                        full_stmt += " " + lines[j].strip()
                        j += 1
                    
                    # Check for vulnerabilities / parameterization
                    # Look inside cursor.execute(...)
                    call_match = re.search(r'cursor\.execute\s*\((.*)\)', full_stmt)
                    call_args = call_match.group(1) if call_match else full_stmt
                    
                    is_vulnerable = False
                    vuln_reason = "Parameterized"
                    
                    if "f\"" in call_args or "f'" in call_args:
                        is_vulnerable = True
                        vuln_reason = "Uses Python f-string formatting directly inside query!"
                    elif "%" in call_args and "," not in call_args:
                        # might be "query % val"
                        is_vulnerable = True
                        vuln_reason = "Uses Python % string formatting without parameter tuple!"
                    elif ".format(" in call_args:
                        is_vulnerable = True
                        vuln_reason = "Uses str.format() directly in query!"
                    elif "+" in call_args and ("\"" in call_args or "'" in call_args) and "," not in call_args:
                        is_vulnerable = True
                        vuln_reason = "Uses string concatenation (+)"
                    
                    query_records.append({
                        "file": rel_path,
                        "line": idx,
                        "statement": full_stmt[:120],
                        "vulnerable": is_vulnerable,
                        "reason": vuln_reason
                    })

print(f"Total execute calls found: {len(query_records)}")
vulnerabilities = [q for q in query_records if q["vulnerable"]]
print(f"Potential SQL injections found: {len(vulnerabilities)}")
for v in vulnerabilities:
    print(f"  [{v['file']}:{v['line']}] {v['reason']}")
    print(f"    Code: {v['statement']}")

print("\n" + "=" * 60)
print("AUDITING SECRETS AND CONFIGURATIONS")
print("=" * 60)

secret_keys = ["SECRET_KEY", "JWT_SECRET_KEY", "DB_PASSWORD", "MYSQL_ROOT_PASSWORD", "API_KEY", "OPENAI_API_KEY"]

for root, _, files in os.walk("."):
    if any(skip in root for skip in [".git", "node_modules", "report_evidence", ".system_generated"]):
        continue
    for f in files:
        if f.endswith((".py", ".env", ".yml", ".yaml", ".json", ".sql")):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file_content:
                for line_no, line in enumerate(file_content, 1):
                    for key in secret_keys:
                        if key in line and not line.strip().startswith("#"):
                            print(f"[{filepath}:{line_no}] {line.strip()[:100]}")
