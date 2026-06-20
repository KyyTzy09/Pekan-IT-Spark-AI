import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))
detection = {
    'files': {'code': [], 'document': [], 'paper': [], 'image': [], 'video': []},
    'total_files': 330,
    'total_words': 207517,
    'scan_root': 'C:\\Koding\\spark-ai'
}

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': 0, 'output': 0}

# Label communities based on node content
labels = {}
for cid, node_ids in communities.items():
    node_labels = []
    for nid in node_ids:
        for n in extraction['nodes']:
            if n['id'] == nid:
                node_labels.append(n.get('label', nid))
                break
    
    # Simple heuristic labeling
    all_labels = ' '.join(node_labels).lower()
    if any(x in all_labels for x in ['auth', 'login', 'register', 'session']):
        labels[cid] = "Authentication & Session"
    elif any(x in all_labels for x in ['admin', 'manage', 'verify']):
        labels[cid] = "Admin Panel"
    elif any(x in all_labels for x in ['parent', 'link', 'invite']):
        labels[cid] = "Parent Dashboard"
    elif any(x in all_labels for x in ['challenge', 'daily', 'weekly']):
        labels[cid] = "Challenge System"
    elif any(x in all_labels for x in ['chat', 'tutor', 'socratic']):
        labels[cid] = "AI Tutor Chat"
    elif any(x in all_labels for x in ['practice', 'quiz', 'question']):
        labels[cid] = "Practice & Quiz"
    elif any(x in all_labels for x in ['gamif', 'badge', 'xp', 'streak', 'level']):
        labels[cid] = "Gamification"
    elif any(x in all_labels for x in ['document', 'upload', 'extract']):
        labels[cid] = "Document Processing"
    elif any(x in all_labels for x in ['material', 'read', 'library']):
        labels[cid] = "Material Library"
    elif any(x in all_labels for x in ['subject', 'topic', 'concept', 'curriculum']):
        labels[cid] = "Curriculum & Knowledge"
    elif any(x in all_labels for x in ['onboarding', 'welcome', 'pretest']):
        labels[cid] = "Onboarding Flow"
    elif any(x in all_labels for x in ['landing', 'hero', 'feature']):
        labels[cid] = "Landing Page"
    elif any(x in all_labels for x in ['activity', 'heatmap', 'chart']):
        labels[cid] = "Activity Tracking"
    elif any(x in all_labels for x in ['nextjs', 'react', 'prisma', 'tailwind']):
        labels[cid] = "Tech Stack"
    elif any(x in all_labels for x in ['model', 'schema', 'database']):
        labels[cid] = "Database Models"
    elif any(x in all_labels for x in ['ai-', 'rag', 'embed', 'generat']):
        labels[cid] = "AI Services"
    elif any(x in all_labels for x in ['action', 'server']):
        labels[cid] = "Server Actions"
    elif any(x in all_labels for x in ['ui', 'button', 'card', 'dialog']):
        labels[cid] = "UI Components"
    elif any(x in all_labels for x in ['comp-', 'component']):
        labels[cid] = "React Components"
    else:
        labels[cid] = f"Community {cid}"

questions = suggest_questions(G, communities, labels)
report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')

print("Report updated with community labels")
print(f"\nCommunity labels:")
for cid, label in sorted(labels.items()):
    print(f"  {cid}: {label}")
