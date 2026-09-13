# Frontend hardening (Pass 4–7)

## Shared types & SPA bridge

- `PaginationMeta` is exported from `@/types` and `@/types/common` (alias of `PaginatedListMeta`).
- `helpers.ts` no longer calls Inertia `usePage()`; it uses `getPagePropsBridge()` / `resolvePageProps()`.
- `AppContext` exposes `settings` (company brand map) for print/report pages.

## List UI contracts

- `ModuleListCard` accepts `onPageChange` as a top-level prop or inside `pagination`.
- `DataTable` accepts legacy `sortField` (alias for `sortKey`).
- `SearchAndFilter` optional `showFilters` / `onToggleFilters` (defaults off).
- `useListToolbar()` includes `clearSearch()`.
- `ConfirmationDialog` accepts `description` as alias for `message`; `onConfirm` may use legacy `&& mutate()` patterns.

## Forms

- `createZodResolver()` in `@/lib/form/zod-resolver` for Zod 4 + react-hook-form (see `TransferFormPage`).
- `CrudFormDialog` select options accept `{ id, label }` (`LookupOption`) or `{ value, label }`.

## Routes & auth

- Removed stub `features/auth/login.tsx`; auth uses `features/auth/pages/LoginPage.tsx`.
- `commercial.tsx` drops unused `CommercialDocument*` imports (dedicated sales/purchase pages are wired).

## Pass 4 (SPA auth, cache, validation)

- React Query keys: `['domain', 'resource', ...params]` via `@/lib/query-keys` (auth, sales, purchase, bridging, commercial, account payments).
- Protected routes wait for `GET /auth/me` before rendering the authenticated shell; expired tokens redirect to login.
- Removed unimplemented `/verify-email` and `/confirm-password` guest routes (no API backing yet).
- Zod + `createZodResolver` on sales order editor, truck load create dialog, and assign-truck-load dialog (`features/bridging/schemas.ts`).

## Pass 7

- `LookupOption` accepts `{ id }` or `{ value }` plus `lookupOptionValue()` helper.
- Restored `components/simple-multi-select.tsx` and `components/MediaPicker.tsx` shims for repeater/CRUD.
- `CommercialInvoiceEditorPage` uses `createZodResolver` + typed create-meta query.
- `select.tsx` searchable filter types `child.props` safely.

## Pass 8 (navigation & operational reports)

- `company-menu.ts` split into **Depots** (list, add, receiving/loading/delivery schedules, depot reps) and **Distribution** (transits, confirmations, shortages, etc.).
- Operational menu items use domain permissions (`view-loading-schedules`, `manage-truck-movements`, …) instead of `manage-users`.
- `OperationalReportPage` uses explicit report response casts; operational reports catalog merges from `GET /reports`.
- Company landing: `/dashboard` overview; client landing: `/portal`.

## Typecheck status

Run `npm run typecheck`. Error count reduced (156 → ~130); remaining issues are mostly page-level (landing newsletter, HRM salary, calendar/`react-day-picker` if not installed). Fix incrementally per module.
