# Card types

- `expression`: descriptive dimensions, tone, viewpoint and abstract rhythm.
- `visual-structure`: silhouette, focal point, prop/space relations and camera direction.
- `scene-pattern`: environment, atmosphere, scene elements, story function and adaptable worlds.
- `fictional-state`: narrative action limits, visual feedback and event/gameplay/CG function; never real instructions.
- `trope`: opening, progression, state change, reversal, transition, repeated clichés and variant points.
- `term`: definition, aliases, common boundary and distinctions for a recurring fictional-domain expression; terminology is descriptive, not a real-world instruction.
- `plot-pattern`: prerequisites, progression, control/state changes, reversals and reusable outcomes for upgrading story causality.

Every card uses `candidate` or explicitly reviewed `reviewed`, `directQuoteIncluded: false`, and one or more complete `sourceRefs`. Prefer cross-source abstraction.

Deterministic candidates are configured in `external-knowledge/card-rules.json`. Each rule declares evidence groups and `minimumSources`; a card is omitted when the indexed corpus cannot satisfy them.
