# Design review rubric — Template Studio

A combined rubric for reviewing this app's UI/UX: Impeccable's generic
critique machinery (Nielsen's 10, cognitive load, personas, mechanical
detector) as the **foundation layer**, plus 5 dimensions specific to
this product's actual architecture as an **overlay layer**. See the
reasoning behind the split in this repo's design-review history if you
want the full argument — this doc is the operational version.

## 1. Mode declaration — state this before scoring anything

Paste this verbatim at the start of any review. It exists to stop a
generic design review from penalizing this app for being deliberately
plain — Impeccable's default posture ("go all out, dream big") is
tuned for consumer/brand work, not a 3-person internal tool.

> This is an **Operate**-mode internal tool, not a consumer or
> marketing product. Two personas: **Owner** (in-house designer —
> low-frequency, high-complexity setup work: Figma import, field
> mapping, canvas editing) and **Editor** (social media manager /
> event planner — high-frequency, low-complexity task: fill 2-4
> fields, export). Team size: ~3 people. Visual restraint (plain
> palette, system font, no imagery) is a deliberate choice, confirmed
> with the product owner — do not score it down as "visually inert"
> without first checking whether a specific instance of it actually
> hurts one of the two personas' tasks.

## 2. Foundation layer — run as-is, don't modify

Everything `$impeccable critique` already does: dual-isolated-agent
methodology, Nielsen's 10 heuristics (0-4 each), the 8-item cognitive
load checklist, 2-3 relevant personas from Alex/Jordan/Sam/Riley/Casey,
the mechanical detector (contrast, overused-font, line-length, etc.),
and the design-specificity verdict. This machinery is more rigorous
than an improvised pass — it catches things a single reviewer misses
(the WCAG contrast bug in this app was caught by the detector, not by
eyeballing hex codes).

## 3. Overlay layer — the 5 dimensions with no Impeccable equivalent

Score these inside the same isolated Assessment A that scores Nielsen's
10 — they need someone who has read the source, not a second detached
pass. Each one exists because of something *this app's architecture*
specifically does, not general best practice.

| # | Dimension | What a pass looks like | Why it has no generic equivalent |
|---|---|---|---|
| 1 | **WYSIWYG trust** | The fill/edit canvas and the exported file render through the literal same Fabric canvas + `toDataURL()` call — not two implementations that can drift. | Only exists because this app's whole value prop depends on preview == export. |
| 2 | **Guardrail precision** | An Editor is structurally incapable of moving/resizing/restyling anything (`selectable:false`/`evented:false`, enforced at the API layer via role check, not just hidden in the UI), and every field that should be editable is exposed via `isEditable`. | Generic to "role-gating," specific here because the gate is a canvas object property, not a route. |
| 3 | **Silent-failure elimination** | Every place the app can fail quietly (background image load, font load, PDF export, a field overflowing its box) surfaces something visible instead of only `console.error`. | Tied to this app's specific failure history — every one of these has actually happened and been fixed once already. |
| 4 | **Authoring leverage** | An Owner maps a template's fields once; every size variant and every future event reuses that mapping without re-touching Figma or redoing the map per size. | Specific to the one-Owner-many-variants model — doesn't generalize to apps without a "author once, reuse many" structure. |
| 5 | **Proportionality** | Craft is spent on the two screens people actually live in (canvas editor, fill page), not evenly smeared across every admin screen — and restraint is never scored as a deficiency without checking dimension-by-dimension whether it costs either persona something real. | This is the one that actively corrects Impeccable's own default bias (see Section 1). No maximalist review methodology self-limits this way. |

## 4. Dimensions that collapse into the foundation layer — don't double-score

| This app's old dimension | Where it already lives | What to do |
|---|---|---|
| Zero-training onboarding | Nielsen #10 (Help & Documentation) | Drop as separate — score under #10 |
| State legibility | Nielsen #1 (Visibility of System Status) | Drop as separate — score under #1 |
| Visual craft parity | Nielsen #8 (Aesthetic/Minimalist) + detector's contrast/font/line-length findings | Drop as separate — let the detector's findings feed #8 directly, don't eyeball it |

## 5. Severity and output

Tag every finding from both layers P0-P3 (Impeccable's existing scale:
P0 blocking, P1 major, P2 minor, P3 polish) and merge into **one**
prioritized list — never report the two layers as separate documents.

## 6. Trend tracking

Impeccable's own `critique-storage` already persists the Nielsen /40
score per run under `.impeccable/critique/` (local, gitignored — see
`.gitignore`). That storage has no field for the 5 overlay dimensions.
Log those here manually after each full review:

| Date | Nielsen /40 | Overlay dimensions passing (/5) | Notes |
|---|---|---|---|
| 2026-09-13 (run 2) | 27/40 | 4/5 — Silent-failure elimination not yet isolated as its own tracked line; background-image case fixed, but `loadGoogleFont`'s missing failure handling was already present and unflagged at this point. Corrected below once this doc's 5-dimension list existed to check against. | Mobile header regression found and fixed; Card/Button extracted; canvas logic deduped |
| 2026-09-13 (run 3) | 29/40 | 4/5 — WYSIWYG trust, Guardrail precision, Authoring leverage: pass. Proportionality: partial (dead space in the canvas editor container, not yet fixed). **Silent-failure elimination: fail** — `loadGoogleFont` in `src/lib/google-fonts.ts` still has no `onerror`/`onload`; a failed font request degrades silently with no retry path. This is the same gap as run 2, now correctly named against this doc's rubric instead of missed. | Ran with 7 realistic templates (not 1) to properly evaluate the nav-structure question — recommended against a persistent left-sidebar template list; the real fix is thumbnails on template cards (still open, P2). Grid layout at 7 items found to leave an orphaned card + dead space (3+3+1 at both 1440 and 768). |
| 2026-09-13 (run 4) | 30/40 | 3 pass / 2 partial — WYSIWYG trust, Guardrail precision, Authoring leverage: pass (guardrail 401 live-verified via direct API call as Editor). **Silent-failure elimination: now partial, not fail** — the font/background banners from run 3's P0 fix work end-to-end (live-verified under a real network failure), but a new instance of the same bug class was found on the template detail page (`src/app/app/templates/[id]/page.tsx`): a raw, un-proxied `<img>` with no `onError` handling. **Proportionality: still partial** — canvas editor dead space from run 3 is fixed, but the detail-page blank preview and a template-thumbnail clip-id collision (P1, new this run) are correctness bugs on a lower-traffic screen, not restraint. | Ran the P0-P3 fixes from run 3 (silent font-load failure, canvas dead space, template thumbnails, bulk archive/unarchive) through dual-agent critique again. Net +1 on Nielsen (P0 count dropped to 0), but the thumbnail fix from run 3 is not robust: `TemplatePreview`'s SVG `clipPath` ids aren't namespaced per template, so 5 of 6 seeded templates render fine only because they share identical field geometry — the 6th renders visibly corrupted (independently corroborated by both sub-agents). Detector also flagged `nested-cards` and desktop-only `line-length` findings (real, not false positives) plus one likely-false-positive `overused-font` hit on Arial, which both assessments agreed to discount as miscalibrated for a deliberately plain internal tool. |

## How to run this

Impeccable's own binary reads a fixed set of files (`PRODUCT.md`,
`DESIGN.md`, a surface brief) — it has no config hook for a custom
rubric like this one, so folding in the overlay layer isn't fully
automatic. In practice:

1. **Persona generation is automatic.** `critique.md`'s persona step
   already reads an AGENTS.md `## Design Context` section if present
   — see the one added to this repo's `AGENTS.md`, which points back
   here.
2. **The overlay dimensions are not automatic.** When asking Claude (or
   anyone) to run a design review on this app, say so explicitly:
   *"Run `$impeccable critique` on \[target], and also score it against
   the 5 overlay dimensions in `docs/design-review.md`."* That sentence
   is what gets the 5 dimensions folded into Assessment A's brief —
   without it, you'll only get the generic Nielsen-based review.
3. **After the run**, take the combined P0-P3 list, decide scope same
   as any critique (all issues / top N / a specific category), and fix.
4. **Log the result** in the trend table above once both layers are
   scored, so a later pass can tell whether a redesign improved generic
   craft, product-specific trust, or regressed one while fixing the
   other.
