# Major Upgrade v1 — Frontend notes

Cross-reference for SPA work. Backend source of truth: [`../api.downstreamx/docs/DOWNSTREAM_OPERATIONS.md`](../api.downstreamx/docs/DOWNSTREAM_OPERATIONS.md).

## Menu restructure (Phase 8)

Target groupings from requirements doc:

- **Dashboard Overview** — default company landing (replaces module-only first view)
- **Depots** — list, add, receiving/loading/delivery schedules, depot reps, depot rep access
- **Procurement** — purchases, bridgings, unbridged purchases, receiving schedules, supplier balances
- **Sales** — invoices, undistributed sales, distributions, delivery confirmations, delivery schedules
- **Fleet** — trucks (not trucks), drivers, movements, fuel tickets, truck tracker, provider payments

## Terminology in UI

| Old label | New label |
|-----------|-----------|
| Truck | Truck |
| Truck provider | Truck provider |
| Truck fuel log | Fuel ticket (new screens) |

## Key new pages (by phase)

| Phase | Pages |
|-------|--------|
| 2 | Product price history modal on product detail |
| 5–6 | Provision loading on invoice view; purchase bridging detail; Add New Bridging form |
| 7 | Customer limits & balances |
| 9 | Company dashboard overview |
| 10 | Client portal: my invoices + bridging timeline |

## Paths convention

Add to [`src/lib/paths.ts`](src/lib/paths.ts) when routes are implemented, e.g.:

- `paths.bridging.*`
- `paths.sales.undistributed`
- `paths.purchase.unbridged`
- `paths.fleet.trucks` (rename from `vehicles`)

See [`docs/FRONTEND_HARDENING.md`](FRONTEND_HARDENING.md) for shared component contracts.
