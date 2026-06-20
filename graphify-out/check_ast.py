import json
from pathlib import Path
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
print(f"AST nodes: {len(ast['nodes'])}, edges: {len(ast['edges'])}")
for n in ast['nodes'][:5]:
    print(f"  {n['id']}: {n.get('label', 'no label')}")
