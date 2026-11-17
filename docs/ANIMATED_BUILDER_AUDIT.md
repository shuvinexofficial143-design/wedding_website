# Animated Wedding Builder — baseline audit

Base: c9018c45c742f751e6ca38623404eb1c9fca4310, feature/advanced-card-studio.
New work: feature/animated-wedding-builder. Main and the parallel Studio branch must not be modified.

Existing dynamic templates already contain immutable documents, revision guards, purchased version pinning, paid-only editable values, guest publication snapshots and token-scoped visible-asset access. Reuse these models. Existing manual website fulfillment remains manual. Cashfree stays sandbox-only.

The previous local checkout was stale at 1efeb8f and contained unfinished catalog edits. They are retained in that worktree, not applied over the newer completed implementation. This isolated worktree uses the latest remote source.

Animation data is an optional version-1 timeline inside the existing template document. Only validated numeric keyframes, allowlisted easing and UUID layer targets are accepted. No HTML, JavaScript, arbitrary CSS or selector injection. Existing documents have no timeline and render unchanged. New animation documents use the existing layered renderer, purchase snapshot and asset gate. No new database or hosted migration is needed for this addition.

Timeline tracks use absolute start times and bounded durations for sequential/parallel scheduling. Web Animations are canceled on unmount and media preference changes. Reduced motion leaves readable static artwork. Frame transforms use individual CSS translate/rotate/scale so the saved layer rotation is preserved. Rendering waits for font layout readiness. Browser controls and guest integration require explicit browser checks.

Remaining work: six original motion compositions; admin timeline controls; purchased animated guest sharing eligibility; four website templates and structured event editor; event RSVP privacy/CSV; full regression and visual QA; preview deployment verification. Hosted schema changes require explicit target approval and are not part of this milestone.
