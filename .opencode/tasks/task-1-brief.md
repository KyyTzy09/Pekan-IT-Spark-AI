# Task 1: Install 3D Dependencies

**Files:**
- Modify: `package.json` (via `bun add`)

**Steps:**

- [ ] **Step 1: Install packages**

```bash
bun add three @react-three/fiber @react-three/drei
bun add -d @types/three
```

- [ ] **Step 2: Verify installation**

```bash
bun run typecheck
```

Expected: PASS (no errors from new packages)

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add three, @react-three/fiber, @react-three/drei"
```

## Global Constraints

- No streak in tree metrics (per user decision)
- Buddy type (bunga/kaktus/bonsai/beringin) affects canopy color only (not tree shape)
- StudyBuddyWidget component deleted entirely; profile page gets a link card instead
- `@react-three/fiber` Canvas must use `dynamic` import with `ssr: false` (it crashes on server render)
- No `.glb` or external 3D assets — pure procedural geometry
