import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
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
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Failed to load record.</p>}
        {data && (
          <pre className="text-xs rounded-md bg-muted p-3 overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
