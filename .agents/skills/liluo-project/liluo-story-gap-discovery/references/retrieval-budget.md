# Retrieval budget

Project default: target, up to two parents, direct children, up to three relevant siblings, necessary character/gameplay summaries and original files. Never read a whole world by default.

External modes:

- `off`: no external knowledge; preferred when project evidence is sufficient.
- `light`: default when external inspiration is useful; at most 5 abstract cards, 5 source summaries and 3 short source passages. Deduplicate sources; run a second query only if the first is insufficient.
- `deep`: requires an explicit reason such as user request, world-scale analysis, a new theme pattern, or failed light retrieval. Still cap output at 12 candidates and avoid bulk source reading.

External material answers a specific gap question; it never replaces project analysis or canon.
