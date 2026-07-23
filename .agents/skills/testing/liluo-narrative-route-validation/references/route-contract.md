# 路线合同

Route fixture uses a stable `routeId`, one `entry`, optional `formalEntries`, and unique nodes. Each node may have `requires`, `terminal`, and ordered `transitions`; each transition has a real `to`, optional `requires`, and `set`. Simulation is deterministic and bounded. A successful run must reach a terminal through a formal entry while preserving state across an isolated snapshot.

Static validation is conservative: a structurally reachable route may still be unavailable under runtime conditions; a file or debug entrance is not a formal entrance. Browser evidence and save migration are separate validation layers.
