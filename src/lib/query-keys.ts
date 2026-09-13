/**
 * React Query key convention: `['domain', 'resource', ...params]`.
 * Invalidate with the narrowest matching prefix (e.g. `queryKeys.sales.orders.all()`).
 */

export type ListParams = Record<string, unknown> | undefined

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  sales: {
    all: () => ['sales'] as const,
    orders: {
      all: () => ['sales', 'orders'] as const,
      indexMeta: () => ['sales', 'orders', 'index-meta'] as const,
      createMeta: () => ['sales', 'orders', 'create-meta'] as const,
      list: (params?: ListParams) => ['sales', 'orders', 'list', params] as const,
      detail: (id: string | number) => ['sales', 'orders', id] as const,
    },
    invoices: {
      all: () => ['sales', 'invoices'] as const,
      indexMeta: () => ['sales', 'invoices', 'index-meta'] as const,
      createMeta: () => ['sales', 'invoices', 'create-meta'] as const,
      list: (params?: ListParams) => ['sales', 'invoices', 'list', params] as const,
      detail: (id: string | number) => ['sales', 'invoices', id] as const,
    },
    returns: {
      all: () => ['sales', 'returns'] as const,
      indexMeta: () => ['sales', 'returns', 'index-meta'] as const,
      createMeta: () => ['sales', 'returns', 'create-meta'] as const,
      list: (params?: ListParams) => ['sales', 'returns', 'list', params] as const,
      detail: (id: string | number) => ['sales', 'returns', id] as const,
    },
    undistributed: (params?: ListParams) => ['sales', 'undistributed', params] as const,
    paymentReminderSettings: () => ['sales', 'payment-reminder-settings'] as const,
    commercialLineItemSettings: () => ['sales', 'commercial-line-item-settings'] as const,
  },

  purchase: {
    all: () => ['purchase'] as const,
    invoices: {
      all: () => ['purchase', 'invoices'] as const,
      indexMeta: () => ['purchase', 'invoices', 'index-meta'] as const,
      createMeta: () => ['purchase', 'invoices', 'create-meta'] as const,
      list: (params?: ListParams) => ['purchase', 'invoices', 'list', params] as const,
      detail: (id: string | number) => ['purchase', 'invoices', id] as const,
    },
    returns: {
      all: () => ['purchase', 'returns'] as const,
      indexMeta: () => ['purchase', 'returns', 'index-meta'] as const,
      createMeta: () => ['purchase', 'returns', 'create-meta'] as const,
      list: (params?: ListParams) => ['purchase', 'returns', 'list', params] as const,
      detail: (id: string | number) => ['purchase', 'returns', id] as const,
    },
    unbridged: (params?: ListParams) => ['purchase', 'unbridged', params] as const,
    commercialLineItemSettings: () => ['purchase', 'commercial-line-item-settings'] as const,
  },

  bridging: {
    all: () => ['bridging'] as const,
    truckLoads: {
      all: () => ['bridging', 'truck-loads'] as const,
      list: (params?: ListParams) => ['bridging', 'truck-loads', 'list', params] as const,
      detail: (id: string | number) => ['bridging', 'truck-loads', id] as const,
      byInvoice: (kind: 'purchase' | 'sales', invoiceId: string | number) =>
        ['bridging', 'truck-loads', kind, invoiceId] as const,
    },
    purchaseProgress: (invoiceId: string | number) =>
      ['bridging', 'purchase', 'progress', invoiceId] as const,
    salesProgress: (invoiceId: string | number) =>
      ['bridging', 'sales', 'progress', invoiceId] as const,
    bridgedAvailable: {
      all: () => ['bridging', 'bridged-available'] as const,
      list: (salesInvoiceId: string | number, entitlementId: string) =>
        ['bridging', 'bridged-available', salesInvoiceId, entitlementId] as const,
    },
  },

  commercial: {
    invoice: (kind: 'sales' | 'purchase', id?: string | number) =>
      ['commercial', 'invoices', kind, id] as const,
    invoiceCreateMeta: (kind: 'sales' | 'purchase') =>
      ['commercial', 'invoices', kind, 'create-meta'] as const,
    document: (documentType: string, id?: string | number) =>
      ['commercial', 'documents', documentType, id] as const,
  },

  account: {
    payments: {
      customer: {
        all: () => ['account', 'customer-payments'] as const,
        detail: (id: string | number) => ['account', 'customer-payments', id] as const,
      },
      supplier: {
        all: () => ['account', 'supplier-payments'] as const,
        detail: (id: string | number) => ['account', 'supplier-payments', id] as const,
      },
    },
  },
} as const
