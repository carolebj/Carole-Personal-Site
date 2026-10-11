# Lot 3 — Navigation tokens and plum CTA

## Context and objective

Reconstruct the uncommitted navigation sub-lot from this task's historical diff.
DS-01/03/05 and H15/V02 identify repeated literal colours. Keep exact colours:
`text-on-strong` is cream in light mode, whereas these plum CTAs use white.

## Non-goals

No redesign, copy, URLs, state, animation, CMS writes, Cal/Contact changes,
Footer, D3-A, video, Services/Brief/estimator business logic or performance work.
No commit, push, PR, merge, deployment or deletion. This is not all of Lot 3.

## Principles and workstreams

- Layout: page/text tokens and exact light/dark selection tokens.
- Navbar: exact primary/accent/panel pairs; narrow secondary text/control and
  divider border tokens retain existing navigation nuances.
- Share only plum colour classes in a helper, across the two Navbar contact
  links and three error-view primary controls. Mobile keeps hover disabled.
- Native semantics, geometry, shadows, focus, callbacks and animations stay at
  call sites. Distinctive decorative hardcodes stay outside this batch.

## Acceptance

Fresh baseline versus reconstruction: 1280x800 and 390x844, FR/EN, light/dark;
computed colours and CTA geometry unchanged; menus, keyboard focus, contact
destination and 404 checked; no new overflow or console error. Typecheck,
unit tests, build, security scan and diff check pass. No CMS changes, therefore
no cms:verify. Keep working files in the managed persistent worktree and a
second local recovery bundle outside temporary storage, without making a commit.
