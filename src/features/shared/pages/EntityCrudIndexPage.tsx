import type { EntityDef } from '@/lib/entity-registry'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'

type Props = EntityDef & {
  createPath?: string
  showPath?: (id: string | number) => string
}

/** Standard T1 index page for manifest-driven entity ports. */
export function EntityCrudIndexPage({ title, apiBase, labelKeys, createPath, showPath }: Props) {
  const listKey = apiBase.replace(/\//g, '-')
  return (
    <ResourceIndexPage
      title={title}
      listKey={listKey}
      apiEndpoint={apiBase}
      labelKeys={labelKeys}
      createPath={createPath}
      showPath={showPath}
    />
  )
}
