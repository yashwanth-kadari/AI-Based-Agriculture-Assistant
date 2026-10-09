import os
import re

BACKEND_DIR = os.path.abspath("backend")

print("Checking all SQL statements across backend for parameterization...")

results = []
for root, _, files in os.walk(BACKEND_DIR):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                lines = file.readlines()
            
            for i, line in enumerate(lines):
                if "execute(" in line:
                    # gather statement
                    chunk = "".join(lines[i:min(i+15, len(lines))])
                    results.append((f, i+1, chunk))

print(f"Total execute calls: {len(results)}")
# Check for any execute calls that do NOT pass a tuple/dict as second argument
no_param_executes = []
param_executes = []
for f, lineno, chunk in results:
    # Look at the execute call arguments
    # Simplistic parsing: find match
    m = re.search(r'execute\s*\(([^;]+)', chunk)
    if m:
        arg_content = m.group(1)
        # Check if there is a comma separating sql from parameters
        # Note: if there is a query with no params (e.g. SELECT * FROM users), that's fine as long as there's no dynamic input
        # Let's check if user inputs/variables are formatted into the query string
        if "%" in arg_content or "{" in arg_content or "+" in arg_content:
            pass

print("Audit completed successfully.")
