import json
from pathlib import Path
ext = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
print(f"Extract nodes: {len(ext['nodes'])}, edges: {len(ext['edges'])}")
print(f"First node: {ext['nodes'][0]}")
print(f"First edge: {ext['edges'][0]}")
