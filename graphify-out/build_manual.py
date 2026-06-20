import json
from pathlib import Path

# Build knowledge graph manually from codebase analysis
nodes = []
edges = []

# Core domain concepts
concepts = [
    ("spark-ai", "Spark AI Platform", "platform"),
    ("auth", "Authentication System", "system"),
    ("onboarding", "Onboarding Wizard", "system"),
    ("dashboard", "Student Dashboard", "system"),
    ("chat", "AI Tutor Chat (Socratic)", "system"),
    ("practice", "Adaptive Practice", "system"),
    ("challenge", "Daily Challenge System", "system"),
    ("documents", "Document Upload & Processing", "system"),
    ("gamification", "Gamification System", "system"),
    ("parent", "Parent Dashboard", "system"),
    ("admin", "Admin Panel", "system"),
    ("learning", "Adaptive Learning Engine", "engine"),
    ("ai", "AI Services Layer", "engine"),
    ("database", "PostgreSQL Database", "infrastructure"),
    ("curriculum", "Curriculum System (3-Lapis)", "system"),
    ("activity", "Activity Tracking", "system"),
    ("materials", "Material Library", "system"),
    ("subjects", "Subject Management", "system"),
    ("topics", "Topic & Concept Graph", "system"),
    ("questions", "Question Bank", "system"),
    ("badges", "Badge & Achievement System", "system"),
    ("streak", "Streak System", "system"),
    ("xp", "XP & Level System", "system"),
    ("avatar", "Avatar Customization", "system"),
    ("study-buddy", "Study Buddy (Virtual Plant)", "system"),
    ("invite", "Parent-Child Invite System", "system"),
    ("rag", "RAG (Retrieval Augmented Generation)", "engine"),
    ("embeddings", "Vector Embeddings", "engine"),
    ("adaptive", "Adaptive Difficulty Engine", "engine"),
    ("mix", "Challenge Mix Generator", "engine"),
    ("weekly", "Weekly Challenge System", "system"),
    ("reflection", "Reflection System", "system"),
    ("leaderboard", "Leaderboard", "system"),
    ("upload", "Document Upload Pipeline", "system"),
]

# Tech stack
tech = [
    ("nextjs", "Next.js 16", "tech"),
    ("react", "React 19", "tech"),
    ("prisma", "Prisma ORM", "tech"),
    ("postgresql", "PostgreSQL", "tech"),
    ("tailwind", "Tailwind CSS", "tech"),
    ("shadcn", "shadcn/ui", "tech"),
    ("vercel-ai", "Vercel AI SDK", "tech"),
    ("openai", "OpenAI API", "tech"),
    ("authjs", "Auth.js v5", "tech"),
    ("zod", "Zod Validation", "tech"),
    ("framer", "Framer Motion", "tech"),
    ("biome", "Biome Linter", "tech"),
    ("vitest", "Vitest Testing", "tech"),
    ("bun", "Bun Runtime", "tech"),
    ("katex", "KaTeX Math Rendering", "tech"),
    ("mermaid", "Mermaid Diagrams", "tech"),
    ("pgvector", "pgvector", "tech"),
    ("cloudinary", "Cloudinary (Avatar)", "tech"),
    ("mammoth", "Mammoth (DOCX)", "tech"),
    ("pdf-parse", "pdf-parse", "tech"),
]

# Components
components = [
    ("comp-admin", "Admin Components", "component"),
    ("comp-auth", "Auth Components", "component"),
    ("comp-landing", "Landing Page Components", "component"),
    ("comp-onboarding", "Onboarding Components", "component"),
    ("comp-parent", "Parent Components", "component"),
    ("comp-student", "Student Components", "component"),
    ("comp-shared", "Shared Components", "component"),
    ("comp-ui", "UI Primitives (shadcn)", "component"),
]

# Server actions
actions = [
    ("action-auth", "Auth Actions", "action"),
    ("action-challenge", "Challenge Actions", "action"),
    ("action-chat", "Chat Actions", "action"),
    ("action-documents", "Document Actions", "action"),
    ("action-gamification", "Gamification Actions", "action"),
    ("action-materials", "Material Actions", "action"),
    ("action-practice", "Practice Actions", "action"),
    ("action-subjects", "Subject Actions", "action"),
    ("action-dashboard", "Dashboard Actions", "action"),
    ("action-parent", "Parent Actions", "action"),
    ("action-admin", "Admin Actions", "action"),
    ("action-profile", "Profile Actions", "action"),
    ("action-invite", "Invite Actions", "action"),
    ("action-activity", "Activity Actions", "action"),
    ("action-weekly", "Weekly Challenge Actions", "action"),
    ("action-onboarding", "Onboarding Actions", "action"),
    ("action-avatar", "Avatar Actions", "action"),
]

# AI services
ai_services = [
    ("ai-tutor", "AI Tutor (Socratic)", "ai-service"),
    ("ai-evaluator", "AI Answer Evaluator", "ai-service"),
    ("ai-rag", "AI RAG Service", "ai-service"),
    ("ai-curriculum", "AI Curriculum Designer", "ai-service"),
    ("ai-challenge", "AI Challenge Generator", "ai-service"),
    ("ai-material", "AI Material Generator", "ai-service"),
    ("ai-questions", "AI Question Generator", "ai-service"),
    ("ai-extract", "AI Document Extractor", "ai-service"),
]

# Database models
models = [
    ("model-user", "User Model", "model"),
    ("model-subject", "Subject Model", "model"),
    ("model-topic", "Topic Model", "model"),
    ("model-concept", "Concept Model", "model"),
    ("model-question", "Question Model", "model"),
    ("model-challenge", "Challenge Model", "model"),
    ("model-material", "Material Model", "model"),
    ("model-document", "Document Model", "model"),
    ("model-badge", "Badge Model", "model"),
    ("model-streak", "Streak Model", "model"),
    ("model-xp", "XpTransaction Model", "model"),
    ("model-chat", "ChatSession Model", "model"),
    ("model-reflection", "Reflection Model", "model"),
    ("model-knowledge", "StudentKnowledgeProfile Model", "model"),
    ("model-study-buddy", "StudyBuddy Model", "model"),
    ("model-avatar", "AvatarCustomization Model", "model"),
    ("model-parent-link", "ParentStudentLink Model", "model"),
    ("model-admin-log", "AdminAuditLog Model", "model"),
    ("model-embedding", "ConceptEmbedding Model", "model"),
    ("model-doc-embedding", "DocumentEmbedding Model", "model"),
]

# Add all nodes
for nid, label, ntype in concepts + tech + components + actions + ai_services + models:
    nodes.append({"id": nid, "label": label, "type": ntype})

# Define edges (relationships)
edge_defs = [
    # Platform -> Systems
    ("spark-ai", "auth", "includes"),
    ("spark-ai", "onboarding", "includes"),
    ("spark-ai", "dashboard", "includes"),
    ("spark-ai", "chat", "includes"),
    ("spark-ai", "practice", "includes"),
    ("spark-ai", "challenge", "includes"),
    ("spark-ai", "documents", "includes"),
    ("spark-ai", "gamification", "includes"),
    ("spark-ai", "parent", "includes"),
    ("spark-ai", "admin", "includes"),
    ("spark-ai", "curriculum", "includes"),
    ("spark-ai", "activity", "includes"),
    ("spark-ai", "materials", "includes"),
    
    # Systems -> Tech
    ("auth", "nextjs", "built_with"),
    ("auth", "authjs", "built_with"),
    ("auth", "prisma", "uses"),
    ("chat", "vercel-ai", "built_with"),
    ("chat", "openai", "uses"),
    ("practice", "vercel-ai", "uses"),
    ("challenge", "vercel-ai", "uses"),
    ("documents", "pdf-parse", "uses"),
    ("documents", "mammoth", "uses"),
    ("documents", "pgvector", "uses"),
    ("dashboard", "react", "built_with"),
    ("gamification", "prisma", "uses"),
    ("admin", "prisma", "uses"),
    ("parent", "prisma", "uses"),
    ("onboarding", "zod", "uses"),
    ("materials", "katex", "uses"),
    ("materials", "mermaid", "uses"),
    
    # Systems -> Components
    ("admin", "comp-admin", "has_components"),
    ("auth", "comp-auth", "has_components"),
    ("onboarding", "comp-onboarding", "has_components"),
    ("parent", "comp-parent", "has_components"),
    ("dashboard", "comp-student", "has_components"),
    ("chat", "comp-student", "has_components"),
    ("practice", "comp-student", "has_components"),
    ("challenge", "comp-student", "has_components"),
    ("documents", "comp-student", "has_components"),
    ("materials", "comp-student", "has_components"),
    ("activity", "comp-student", "has_components"),
    ("gamification", "comp-student", "has_components"),
    
    # Systems -> Server Actions
    ("auth", "action-auth", "uses"),
    ("challenge", "action-challenge", "uses"),
    ("chat", "action-chat", "uses"),
    ("documents", "action-documents", "uses"),
    ("gamification", "action-gamification", "uses"),
    ("materials", "action-materials", "uses"),
    ("practice", "action-practice", "uses"),
    ("subjects", "action-subjects", "uses"),
    ("dashboard", "action-dashboard", "uses"),
    ("parent", "action-parent", "uses"),
    ("admin", "action-admin", "uses"),
    ("onboarding", "action-onboarding", "uses"),
    ("activity", "action-activity", "uses"),
    ("weekly", "action-weekly", "uses"),
    
    # Systems -> AI Services
    ("chat", "ai-tutor", "uses"),
    ("practice", "ai-evaluator", "uses"),
    ("chat", "ai-rag", "uses"),
    ("curriculum", "ai-curriculum", "uses"),
    ("challenge", "ai-challenge", "uses"),
    ("materials", "ai-material", "uses"),
    ("practice", "ai-questions", "uses"),
    ("documents", "ai-extract", "uses"),
    
    # Systems -> Database Models
    ("auth", "model-user", "uses"),
    ("subjects", "model-subject", "uses"),
    ("topics", "model-topic", "uses"),
    ("topics", "model-concept", "uses"),
    ("practice", "model-question", "uses"),
    ("challenge", "model-challenge", "uses"),
    ("materials", "model-material", "uses"),
    ("documents", "model-document", "uses"),
    ("gamification", "model-badge", "uses"),
    ("streak", "model-streak", "uses"),
    ("xp", "model-xp", "uses"),
    ("chat", "model-chat", "uses"),
    ("challenge", "model-reflection", "uses"),
    ("learning", "model-knowledge", "uses"),
    ("study-buddy", "model-study-buddy", "uses"),
    ("avatar", "model-avatar", "uses"),
    ("invite", "model-parent-link", "uses"),
    ("admin", "model-admin-log", "uses"),
    ("rag", "model-embedding", "uses"),
    ("rag", "model-doc-embedding", "uses"),
    
    # Engine relationships
    ("learning", "adaptive", "implements"),
    ("learning", "mix", "implements"),
    ("learning", "weekly", "implements"),
    ("adaptive", "model-knowledge", "updates"),
    ("adaptive", "model-question", "selects_from"),
    ("mix", "challenge", "generates_for"),
    ("rag", "embeddings", "uses"),
    ("rag", "ai-rag", "implements"),
    
    # Cross-system relationships
    ("challenge", "gamification", "awards_xp"),
    ("challenge", "streak", "increments"),
    ("challenge", "materials", "includes"),
    ("challenge", "practice", "uses_questions"),
    ("challenge", "learning", "adapts_to"),
    ("practice", "learning", "adapts_to"),
    ("practice", "subjects", "per_subject"),
    ("practice", "topics", "per_topic"),
    ("topics", "subjects", "belongs_to"),
    ("topics", "concepts", "contains"),
    ("concepts", "prerequisites", "has"),
    ("documents", "chat", "attached_to"),
    ("documents", "rag", "indexed_by"),
    ("materials", "documents", "can_derive_from"),
    ("weekly", "challenge", "summary_of"),
    ("weekly", "learning", "adapts_to"),
    ("parent", "invite", "linked_via"),
    ("admin", "subjects", "manages"),
    ("admin", "curriculum", "verifies"),
    ("activity", "gamification", "tracks"),
    ("activity", "streak", "tracks"),
    ("activity", "xp", "tracks"),
    
    # Landing
    ("spark-ai", "comp-landing", "has_components"),
    
    # Tech stack
    ("nextjs", "react", "uses"),
    ("nextjs", "tailwind", "uses"),
    ("nextjs", "shadcn", "uses"),
    ("nextjs", "prisma", "uses"),
    ("nextjs", "biome", "uses"),
    ("nextjs", "bun", "runs_on"),
    ("prisma", "postgresql", "connects_to"),
    ("prisma", "pgvector", "uses"),
    ("vercel-ai", "openai", "uses"),
    ("shadcn", "tailwind", "uses"),
    ("shadcn", "radix", "uses"),
    ("vitest", "bun", "runs_on"),
    
    # Component dependencies
    ("comp-student", "comp-ui", "uses"),
    ("comp-admin", "comp-ui", "uses"),
    ("comp-auth", "comp-ui", "uses"),
    ("comp-parent", "comp-ui", "uses"),
    ("comp-onboarding", "comp-ui", "uses"),
    ("comp-student", "comp-shared", "uses"),
    ("comp-parent", "comp-shared", "uses"),
    ("comp-admin", "comp-shared", "uses"),
    
    # AI service dependencies
    ("ai-tutor", "model-knowledge", "reads"),
    ("ai-tutor", "model-concept", "reads"),
    ("ai-evaluator", "model-question", "reads"),
    ("ai-rag", "model-doc-embedding", "reads"),
    ("ai-curriculum", "model-subject", "creates"),
    ("ai-challenge", "model-challenge", "creates"),
    ("ai-material", "model-material", "creates"),
    ("ai-questions", "model-question", "creates"),
    ("ai-extract", "model-document", "creates"),
]

for source, target, label in edge_defs:
    edges.append({"source": source, "target": target, "label": label})

# Build extraction JSON
extraction = {
    "nodes": nodes,
    "edges": edges,
    "hyperedges": [],
    "input_tokens": 0,
    "output_tokens": 0,
}

Path('graphify-out/.graphify_extract.json').write_text(json.dumps(extraction, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"Manual extraction: {len(nodes)} nodes, {len(edges)} edges")
