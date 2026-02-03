# Engineering Manager Workflow

## Role: Engineering Manager (Shadow)
**Objective:** Coordinate sub-agents to complete Strava Postcard app deployment

---

## Workflow

### 1. Task Planning
- Break down remaining work into discrete tasks
- Create tasks in Kanban board (Backlog column)
- Assign priority (low/medium/high)
- Group by Epics for organization

### 2. Agent Management
- Spawn sub-agents using `sessions_spawn`
- Assign one task per agent
- Monitor progress
- Review completed work

### 3. Kanban Board Management
- **Backlog** → Tasks waiting to be assigned
- **In Progress** → Agent actively working
- **Review** → Agent completed, needs my review
- **Done** → Approved and merged

### 4. Quality Control
- Review code changes via PR
- Test functionality
- Merge to main when approved
- Move task to Done

---

## Strava Postcard App - Remaining Work

### Epic 1: Strava Brand Compliance
- [x] Download official assets (manual - Vanessa)
- [ ] Verify assets display correctly
- [ ] Test on mobile/desktop

### Epic 2: Legal & Policy
- [ ] Create Privacy Policy page
- [ ] Create Terms of Service page
- [ ] Add "Delete My Data" endpoint (GDPR)
- [ ] Link policies in footer

### Epic 3: Token Management
- [ ] Implement token refresh logic
- [ ] Handle expired tokens gracefully
- [ ] Store refresh tokens securely
- [ ] Auto-refresh on 401 errors

### Epic 4: Production Hardening
- [ ] Add rate limiting
- [ ] Implement proper error handling
- [ ] Add input validation
- [ ] Set up Sentry error tracking
- [ ] Configure production CORS

### Epic 5: Database & Persistence
- [ ] Design database schema (users, postcards, tokens)
- [ ] Set up PostgreSQL/MongoDB
- [ ] Implement save/load endpoints
- [ ] Add user accounts

### Epic 6: Deployment
- [ ] Deploy backend (Railway/Render)
- [ ] Deploy frontend (Vercel)
- [ ] Configure environment variables
- [ ] Set up domain
- [ ] Update Strava OAuth callback
- [ ] Create production webhook subscription

### Epic 7: UI/UX Polish
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add skeleton screens
- [ ] Mobile optimization
- [ ] SEO meta tags

### Epic 8: Analytics & Monitoring
- [ ] Set up analytics (Plausible/GA)
- [ ] Configure uptime monitoring
- [ ] Add performance tracking

---

## Agent Spawn Template

```bash
sessions_spawn \
  task="[Task description]" \
  label="agent-[task-name]" \
  model="sonnet" \
  cleanup="keep"
```

---

## Communication Protocol

### To Sub-Agents:
- Clear task description
- Acceptance criteria
- Files to modify
- Branch naming convention
- PR requirements

### From Sub-Agents:
- Progress updates
- Questions/blockers
- PR link when done
- Test results

---

## Current Status

**Board Setup:** ⏳ Pending
- Need DATABASE_URL for Kanban board
- Need auth passcode

**Agents Spawned:** 0
**Tasks in Progress:** 0
**Tasks Completed:** 0

---

## Next Steps

1. ✅ Clone kanban repo
2. ⏳ Get DATABASE_URL from Vanessa
3. ⏳ Get admin passcode
4. ⏳ Start kanban dev server
5. ⏳ Create Epics
6. ⏳ Create initial tasks
7. ⏳ Spawn first agent
