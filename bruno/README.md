# Campus Lost & Found — Bruno API Collection

## Setup

1. Open the Bruno app.
2. **Open Collection** → select this `bruno/` folder.
3. In the top-right environment dropdown, select **Local**.
4. Make sure the backend is running: `npm run dev` (port 5050) from the project root.

## Golden-path sequence

Each folder has a `folder.bru` with a `seq` (Reports=1, Claims=2,
Notifications=3, Audit Log=4, Reference Data=5), so running the whole
collection headlessly follows this same order automatically:

```bash
npx @usebruno/cli run --env Local -r
```

To walk it by hand in the desktop app, click each request in order (hit Send) —
later requests auto-fill their IDs from earlier responses via
`script:post-response`, so you don't need to copy/paste anything:

1. **Reports → 2. Create Lost Report (Student)**
2. **Reports → 3. Create Found Report (Staff)**
3. **Reports → 4. Get Matches for Lost Report** — confirms the pair scores as a match
4. **Reports → 5. Confirm Match (Student)**
5. **Claims → 2. Submit Claim (Student)**
6. **Claims → 5. Student Tries to Decide (expect 403)** — proves role-gating
7. **Claims → 6. Staff Approve Claim**
8. **Claims → 7. Confirm Handover (Staff)**
9. **Notifications → 1. List Notifications (Student)** — see the approval + handover notifications
10. **Audit Log → 1. Get Audit Logs (Admin)** — see every step logged
11. **Audit Log → 2. Staff Tries to View (expect 403)** — proves admin-only gating

Alternate branches (run instead of step 7 to see a different path):
- **Claims → 8. Staff Reject Claim** — reports revert to OPEN
- **Claims → 9. Staff Request More Info** — claim goes to INFO_REQUESTED

## Folders

| Folder | Covers |
|---|---|
| `Reports/` | FR1 Item Reporting, FR2 Item Matching (create, list, match, confirm/dismiss) |
| `Claims/` | FR3 Ownership Verification, FR4 Claim Management (submit, decide, handover) |
| `Notifications/` | In-app notifications on match/claim/handover events |
| `Audit Log/` | FR5 Audit Logging (admin-only) |
| `Reference Data/` | Categories, users, health check |

## Environment variables (`environments/Local.bru`)

Pre-filled with the seeded demo users/category. `lostReportId`, `foundReportId`,
`claimId`, and `claimCode` start empty and get populated automatically as you
run the golden-path sequence above.

If you re-seed the database (`npm run prisma:seed`), the demo user/category
IDs are stable across seed runs (upserted by fixed email/name), so you
shouldn't need to update this file.
