# Kennedy Laser Works — local copy and UX review

This directory is an offline review workspace. It does not participate in the production website or its build.

## Final implementation record

`implementation-decisions.json` is the byte-for-byte copy of the owner's latest export, `klw-copy-review-decisions-2026-10-18 (10).json` (SHA-256 `49D0286468128D222BE33A489E4C1FF60890B4184431974F104C3996BDCB858C`). It supersedes the earlier export for implementation. The earlier review files below remain a historical snapshot of the proofreading stage. See `implementation-report.md` for the applied decisions and validation.

## Review

Open `review.html` in a browser. It works locally without a server. The default **Needs Review** filter hides completed decisions and shows the 25 custom alternatives awaiting final approval plus two unchanged undecided items. **Custom / Awaiting Approval** shows only those 25 alternatives. Use **Show All Items**, **Approved**, or **Rejected** to revisit completed decisions. The progress bar counts all unfinished items, regardless of the current page, search, or status filter.

The authoritative October 18 owner export, `klw-copy-review-decisions-2026-10-18 (9).json`, is preserved byte-for-byte in `owner-decisions-source.json`. On first opening this revision, the app starts with all 118 decisions from that file: 87 approved, two rejected, 27 custom (25 awaiting final approval), and two undecided. This revision has a new local-storage key, so the previous review session cannot override the newer export. `preserved-decisions.json` is an importable copy that adds the proofread alternatives and two functional plans without changing the owner's original entries or approval status. Importing the authoritative export returns the view to **Needs Review**.

Choose **Approve Codex Suggestion**, **Reject — Keep Original**, or **Use My Own Wording / Modification**. Custom entries remain visible until the proofread wording or proposed plan receives separate final approval. Editing your original custom entry clears that final approval and its existing proofread version or plan, so Codex can review the new wording. **Clear decision** reverses a choice. The page-wide approval control applies only to undecided items on the selected page.

Export decisions JSON after reviewing. Exports include **every item**, even those hidden by a filter, with stable IDs, original custom text, notes, and final-approval status. The browser also attempts local storage, but a downloaded export is the reliable backup.

## Files and safeguards

- `review.html` — standalone review interface with embedded audit data.
- `audit-data.json` — proposals, source references, fingerprints, and initial decision snapshot.
- `owner-decisions-source.json` — untouched authoritative owner export (9).
- `preserved-decisions.json` — complete importable decisions for this revision.
- `phase2-proofreads.json` — 23 text proofreads, two functional implementation plans, and verification notes.
- `phase2-approval-review.md` — all 25 pending custom entries with original and proposed versions side by side in sequence.
- `audit-summary.md` — findings and factual questions.
- `review.template.html` and `build-audit.mjs` — sources that generate the app and audit files. Run `node audit/website-copy-review/build-audit.mjs` from the repository root after a new site audit.

The import control verifies audit schema, base commit, stable IDs, and source fingerprints. It rejects missing earlier decisions, duplicates, and incompatible files. Review text is displayed as text rather than executed as HTML. No choice in this tool updates the website; implementation requires separate approval.
