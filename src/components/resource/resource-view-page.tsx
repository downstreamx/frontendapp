import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { api } from '@/lib/api'

type Props = {
  title: string
  apiEndpoint: string
  id: string
  editPath?: string
  indexPath: string
}

export function ResourceViewPage({ title, apiEndpoint, id, editPath, indexPath }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resource', apiEndpoint, id],
    queryFn: async () => {
      const { data: res } = await api.get(`${apiEndpoint}/${id}`)
      return res.data ?? res
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        <div className="flex gap-2">
          {editPath && (
            <Button asChild size="sm" variant="outline">
              <Link to={editPath}>Edit</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to={indexPath}>Back</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && <PageContentLoader className="min-h-[12rem]" />}
        {error && <p className="text-sm text-destructive">Failed to load record.</p>}
        {data && (
          <pre className="max-h-96 overflow-auto rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/70 p-3 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
