# Graph Report - .  (2026-06-20)

## Corpus Check
- 330 files · ~207,517 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 107 nodes · 140 edges · 23 communities (9 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Challenge System|Challenge System]]
- [[_COMMUNITY_Authentication & Session|Authentication & Session]]
- [[_COMMUNITY_Document Processing|Document Processing]]
- [[_COMMUNITY_Gamification|Gamification]]
- [[_COMMUNITY_Authentication & Session|Authentication & Session]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_Admin Panel|Admin Panel]]
- [[_COMMUNITY_Admin Panel|Admin Panel]]
- [[_COMMUNITY_Material Library|Material Library]]
- [[_COMMUNITY_Database Models|Database Models]]
- [[_COMMUNITY_Database Models|Database Models]]
- [[_COMMUNITY_Server Actions|Server Actions]]
- [[_COMMUNITY_Parent Dashboard|Parent Dashboard]]
- [[_COMMUNITY_Server Actions|Server Actions]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Gamification|Gamification]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Database Models|Database Models]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Practice & Quiz|Practice & Quiz]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Document Processing|Document Processing]]

## God Nodes (most connected - your core abstractions)

## Surprising Connections (you probably didn't know these)
- `Spark AI Platform` ----> `Activity Tracking`  [EXTRACTED]
   →   _Bridges community 5 → community 3_
- `Spark AI Platform` ----> `Admin Panel`  [EXTRACTED]
   →   _Bridges community 5 → community 7_
- `Spark AI Platform` ----> `Authentication System`  [EXTRACTED]
   →   _Bridges community 5 → community 1_
- `Spark AI Platform` ----> `Daily Challenge System`  [EXTRACTED]
   →   _Bridges community 5 → community 0_
- `Spark AI Platform` ----> `AI Tutor Chat (Socratic)`  [EXTRACTED]
   →   _Bridges community 5 → community 4_

## Import Cycles
- None detected.

## Communities (23 total, 14 thin omitted)

### Community 0 - "Challenge System"
Cohesion: 0.19
Nodes (16): Challenge Actions, Practice Actions, Weekly Challenge Actions, Adaptive Difficulty Engine, AI Challenge Generator, AI Answer Evaluator, AI Question Generator, Daily Challenge System (+8 more)

### Community 1 - "Authentication & Session"
Cohesion: 0.16
Nodes (14): Auth Actions, Authentication System, Auth.js v5, Biome Linter, Bun Runtime, Auth Components, User Model, Next.js 16 (+6 more)

### Community 2 - "Document Processing"
Cohesion: 0.22
Nodes (11): Document Actions, AI Document Extractor, AI RAG Service, Document Upload & Processing, Vector Embeddings, Mammoth (DOCX), DocumentEmbedding Model, Document Model (+3 more)

### Community 3 - "Gamification"
Cohesion: 0.22
Nodes (9): Activity Actions, Gamification Actions, Activity Tracking, Gamification System, Badge Model, Streak Model, XpTransaction Model, Streak System (+1 more)

### Community 4 - "Authentication & Session"
Cohesion: 0.25
Nodes (9): Chat Actions, AI Tutor (Socratic), AI Tutor Chat (Socratic), ChatSession Model, Concept Model, Topic Model, OpenAI API, Topic & Concept Graph (+1 more)

### Community 5 - "Onboarding Flow"
Cohesion: 0.22
Nodes (9): Dashboard Actions, Onboarding Actions, Landing Page Components, Onboarding Components, Student Dashboard, Onboarding Wizard, React 19, Spark AI Platform (+1 more)

### Community 6 - "Admin Panel"
Cohesion: 0.28
Nodes (9): Parent Actions, Admin Components, Parent Components, Shared Components, Student Components, UI Primitives (shadcn), Parent-Child Invite System, ParentStudentLink Model (+1 more)

### Community 7 - "Admin Panel"
Cohesion: 0.29
Nodes (8): Admin Actions, Subject Actions, Admin Panel, AI Curriculum Designer, Curriculum System (3-Lapis), AdminAuditLog Model, Subject Model, Subject Management

### Community 8 - "Material Library"
Cohesion: 0.40
Nodes (6): Material Actions, AI Material Generator, KaTeX Math Rendering, Material Library, Mermaid Diagrams, Material Model

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._