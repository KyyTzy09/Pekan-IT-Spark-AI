import json
from pathlib import Path

graph = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
print(f"Nodes: {len(graph.get('nodes', []))}")
print(f"Edges: {len(graph.get('edges', []))}")
print(f"Communities: {len(graph.get('communities', {}))}")

print("\nEdges:")
for e in graph.get('edges', []):
    print(f"  {e.get('source', '?')} -> {e.get('target', '?')} ({e.get('label', '')})")

print("\nTop 10 nodes by degree:")
nodes = graph.get('nodes', [])
edges = graph.get('edges', [])
degree = {}
for e in edges:
    s = e.get('source', '')
    t = e.get('target', '')
    degree[s] = degree.get(s, 0) + 1
    degree[t] = degree.get(t, 0) + 1
for nid, deg in sorted(degree.items(), key=lambda x: -x[1])[:10]:
    print(f"  {nid}: {deg}")
