import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type ProductTax = {
  id: number
  tax_name: string
  rate: number | string
}

export type ProductDepotStock = {
  depot_name: string
  quantity: number
}

export type ProductInventoryAggregates = {
  purchased_qty?: number
  sold_qty?: number
  bridged_qty?: number
  distributed_qty?: number
  balance_qty?: number
  inventory_value?: number
}

export type ProductPriceHistory = {
  id: number
  product_id: number
  cost_price: number | string
  selling_price: number | string
  narration?: string | null
  effective_at: string
  created_by?: number | null
  created_at?: string
}

export type ProductItem = {
  id: number
  name: string
  sku?: string
  tax_ids?: number[] | string
  taxes?: ProductTax[]
  sale_price?: number | string
  purchase_price?: number | string
  category_id?: number
  description?: string
  long_description?: string
  unit?: number | string
  quantity?: number
  image?: string
  images?: string[] | string
  type?: string
  is_active?: boolean
  is_system?: boolean
  created_at?: string
  updated_at?: string
  category?: { id: number; name: string }
  unit_relation?: { id: number; name: string; unit_name?: string }
  unitRelation?: { id: number; name: string; unit_name?: string }
  total_quantity?: number
  depot_stocks?: ProductDepotStock[]
} & ProductInventoryAggregates

export type ProductCreateMeta = {
  taxes: Array<{ id: number; tax_name: string; rate: number | string }>
  categories: Array<{ id: number; name: string }>
  units: Array<{ id: number; unit_name: string }>
  depots: Array<{ id: number; name: string }>
}

export async function fetchProductCreateMeta() {
  const { data } = await api.get<ApiSuccess<ProductCreateMeta>>('/product-service/items/create-meta')
  return data.data
}

export async function listProducts(
  params?: Record<string, string>,
): Promise<PaginatedListResult<ProductItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>(`/product-service/items`, { params })
  return extractPaginatedList<ProductItem>(data)
}

/** Flat list for selects/lookups (high page size). */
export async function listProductsAll(params?: Record<string, string>) {
  const { rows } = await listProducts({ per_page: '200', ...params })
  return rows
}

export async function getProduct(id: string | number) {
  const { data } = await api.get<ApiSuccess<ProductItem>>(`/product-service/items/${id}`)
  return data.data
}

export async function createProduct(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<ProductItem>>('/product-service/items', body)
  return data.data
}

export async function updateProduct(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<ProductItem>>(`/product-service/items/${id}`, body)
  return data.data
}

export async function deleteProduct(id: string | number) {
  await api.delete(`/product-service/items/${id}`)
}

export async function listProductPriceHistory(productId: string | number) {
  const { data } = await api.get<ApiSuccess<ProductPriceHistory[]>>(
    `/product-service/items/${productId}/prices`,
  )
  return data.data
}

export async function setProductPrice(
  productId: string | number,
  body: {
    cost_price: number
    selling_price: number
    narration?: string
    effective_at?: string
  },
) {
  const { data } = await api.post<
    ApiSuccess<{ history: ProductPriceHistory; item: Pick<ProductItem, 'id' | 'purchase_price' | 'sale_price'> }>
  >(`/product-service/items/${productId}/prices`, body)
  return data.data
}

export type StockListRow = {
  id: number
  name: string
  sku?: string
  image?: string | null
  total_quantity?: number
}

export type StockListResult = PaginatedListResult<StockListRow> & {
  depots: Array<{ id: number; name: string }>
}

export async function listProductStock(
  params?: Record<string, string>,
): Promise<StockListResult> {
  const { data } = await api.get<
    ApiSuccess<{ stocks: unknown; depots: Array<{ id: number; name: string }> }>
  >('/product-service/stock', { params })
  const payload = data.data
  const paginated = extractPaginatedList<StockListRow>(
    payload && typeof payload === 'object' && 'stocks' in payload
      ? (payload as { stocks: unknown }).stocks
      : payload,
  )
  return {
    ...paginated,
    depots:
      payload && typeof payload === 'object' && 'depots' in payload
        ? (payload as { depots: Array<{ id: number; name: string }> }).depots
        : [],
  }
}

export async function addProductStock(body: {
  product_id: number
  depot_id: number
  quantity: number
}) {
  const { data } = await api.post<ApiSuccess<unknown>>('/product-service/stock', body)
  return data.data
}

export type ReorderLevelStockStatus = 'below_reorder' | 'ok' | 'not_set'

export type ReorderLevelRow = {
  id: number
  name: string
  sku?: string | null
  quantity: number
  reorder_level: number | null
  product_reorder_level?: number | null
  stock_status: ReorderLevelStockStatus
}

export type ReorderLevelsListResult = PaginatedListResult<ReorderLevelRow> & {
  depots: Array<{ id: number; name: string }>
  schemaPending?: boolean
}

export async function listReorderLevels(
  params?: Record<string, string>,
): Promise<ReorderLevelsListResult> {
  const { data } = await api.get<
    ApiSuccess<{
      items: unknown
      depots: Array<{ id: number; name: string }>
      schema_pending?: boolean
    }>
  >('/product-service/reorder-levels', { params })
  const payload = data.data
  const paginated = extractPaginatedList<ReorderLevelRow>(
    payload && typeof payload === 'object' && 'items' in payload ? payload.items : payload,
  )
  return {
    ...paginated,
    depots:
      payload && typeof payload === 'object' && 'depots' in payload ? payload.depots : [],
    schemaPending: Boolean(
      payload && typeof payload === 'object' && 'schema_pending' in payload && payload.schema_pending,
    ),
  }
}

export async function updateReorderLevel(
  productId: number,
  body: { reorder_level: number | null; depot_id?: number },
) {
  const { data } = await api.put<ApiSuccess<ReorderLevelRow>>(
    `/product-service/reorder-levels/${productId}`,
    body,
  )
  return data.data
}

export async function listCategories() {
  const { data } = await api.get<ApiSuccess<{ data: Array<{ id: number; name: string }> }>>(
    '/product-service/categories',
    { params: { per_page: 200 } },
  )
  const payload = data.data
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: Array<{ id: number; name: string }> }).data
  }
  return []
}

export async function listUnits() {
  const { data } = await api.get<ApiSuccess<{ data: Array<{ id: number; unit_name: string }> }>>(
    '/product-service/units',
    { params: { per_page: 200 } },
  )
  const payload = data.data
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: Array<{ id: number; unit_name: string }> }).data
  }
  return []
}

function parseTaxIds(taxIds: ProductItem['tax_ids']): string[] {
  if (!taxIds) return []
  if (Array.isArray(taxIds)) return taxIds.map(String)
  if (typeof taxIds === 'string') {
    try {
      const parsed = JSON.parse(taxIds) as unknown
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

export function parseProductImages(images: ProductItem['images']): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images) as unknown
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

export function productToFormValues(product: ProductItem) {
  return {
    name: product.name,
    sku: product.sku ?? '',
    tax_ids: parseTaxIds(product.tax_ids),
    category_id: product.category_id ?? 0,
    description: product.description ?? '',
    long_description: product.long_description ?? '',
    sale_price: product.sale_price != null ? Number(product.sale_price) : 0,
    purchase_price: product.purchase_price != null ? Number(product.purchase_price) : 0,
    unit: product.unit != null ? Number(product.unit) : 0,
    image: product.image ?? '',
    images: parseProductImages(product.images),
    type: (product.type ?? 'product') as 'product' | 'service' | 'part',
    is_active: product.is_active !== false,
  }
}

export function formValuesToApiPayload(
  values: Record<string, unknown>,
  options?: { includeDepot?: boolean; isUpdate?: boolean },
) {
  const type = (values.type as string) ?? 'product'
  const payload: Record<string, unknown> = {
    name: values.name,
    sku: values.sku,
    tax_ids: (values.tax_ids as string[]).map(Number),
    category_id: values.category_id,
    description: values.description || null,
    long_description: values.long_description || null,
    sale_price: values.sale_price,
    purchase_price: values.purchase_price,
    unit: values.unit,
    type,
    is_active: values.is_active ?? true,
  }

  if (options?.isUpdate) {
    payload.image = (values.image as string) || null
    payload.images = Array.isArray(values.images) ? values.images : []
  } else {
    if (values.image) payload.image = values.image
    if (Array.isArray(values.images) && values.images.length > 0) payload.images = values.images
  }

  if (options?.includeDepot && type !== 'service') {
    if (values.quantity != null && values.quantity !== '') {
      payload.quantity = Number(values.quantity)
    }
    if (values.depot_id) payload.depot_id = Number(values.depot_id)
  }

  return payload
}
