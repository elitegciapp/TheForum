# Step 10 — Execution Plan (VS Code)

Goal: predictable setup, clean structure, controlled rollout, zero guesswork, minimal refactoring later.

## Core principles
- Build foundations before features
- One system at a time
- No premature optimization
- No UI polish until logic is stable
- No backend lock-in until behavior is proven
- Every system must run in mock mode first

## Phase-by-phase checklist (non-negotiable)

### Phase 1 — Project foundation
- [ ] Expo + TypeScript project boots
- [ ] Expo Router installed and working
- [ ] Route groups exist and navigation works:
  - `app/(auth)`
  - `app/(onboarding)`
  - `app/(app)`
  - `app/admin`
- [ ] App launches with no session → goes to welcome
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase1: foundation + routing`

### Phase 2 — Authentication (Step 6)
- [ ] Access-code entry screen implemented
- [ ] Session model (local persistence) implemented
- [ ] Route guards enforced for protected/admin routes
- [ ] Hardcoded test access codes exist (mock-only)
- [ ] Session persistence verified (close/reopen app)
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase2: access-code auth + guards`

### Phase 3 — Governance core (Step 3)
- [ ] Trust score model implemented
- [ ] Visibility controls implemented
- [ ] Capability gating implemented
- [ ] Internal logging implemented
- [ ] No UI exposes internal governance
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase3: governance core`

### Phase 4 — Rank badges (Step 4)
- [ ] Rank is derived-only (never stored)
- [ ] Rank displayed next to username (limited surfaces)
- [ ] Rank never affects permissions
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase4: derived rank`

### Phase 5 — Rooms (Step 5)
- [ ] General room seeded by default
- [ ] Rooms list works
- [ ] Room request flow works
- [ ] Admin approval works
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase5: rooms`

### Phase 6 — Content (Step 7)
- [ ] Posts (threads) implemented
- [ ] Comments (replies) implemented
- [ ] Slow mode enforced (quiet)
- [ ] Save signal implemented (private)
- [ ] Locked threads readable but not replyable
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase6: content`

### Phase 7 — Feed & moderation (Step 8)
- [ ] Feed ranking algorithm implemented (invisible)
- [ ] Shadow filtering applied before ranking
- [ ] Room-scoped moderation tools implemented
- [ ] Moderator logging exists (admin-visible only)
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase7: ranking + moderation`

### Phase 8 — Compliance (Step 9)
- [ ] Policy screens available in-app (read-only)
- [ ] Required disclosures included
- [ ] App Store review notes documented
- [ ] Typecheck: `npm run typecheck`
- [ ] Commit: `phase8: compliance`

## Mock mode requirements
- No backend dependency
- AsyncStorage is allowed
- Deterministic behavior where applicable
- Interfaces remain stable for later backend swap

## Environment variables (placeholders only)
- `APP_ENV`
- `ENABLE_MOCK_MODE`
- `ENABLE_SCREENSHOT_ENFORCEMENT`

No secrets stored locally.

## Testing checkpoints (end of every phase)
- App launches
- No crashes
- Navigation works
- Guards behave correctly

If a phase breaks the app: revert → fix → re-commit.

## Git discipline
- Commit after every phase
- Don’t stack multiple systems in one commit
- Use descriptive messages
- Tag major milestones

## When to stop and refactor
Stop if:
- business rules leak into UI screens
- enforcement checks are duplicated across screens
- mock/prod behavior diverges

Refactor target:
- move logic into `lib/*` behind stable interfaces
- re-run `npm run typecheck`
- only then commit
