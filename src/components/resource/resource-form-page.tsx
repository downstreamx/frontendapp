import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResourceMutation } from '@/hooks/use-resource-mutation'

type Field = { name: string; label: string; type?: string }

type Props<T extends z.ZodType> = {
  title: string
  listKey: string
  apiEndpoint: string
  indexPath: string
  schema: T
  defaultValues: z.infer<T>
  fields: Field[]
  id?: string
}

export function ResourceFormPage<T extends z.ZodType>({
  title,
  listKey,
  apiEndpoint,
  indexPath,
  schema,
  defaultValues,
  fields,
  id,
}: Props<T>) {
  const navigate = useNavigate()
  const { create, update } = useResourceMutation(listKey, apiEndpoint)
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (id) {
      await update.mutateAsync({ id, body: values })
    } else {
      await create.mutateAsync(values)
    }
    navigate(indexPath)
  })

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormSection variant="highlight" className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type ?? 'text'}
                  {...form.register(field.name as keyof z.infer<T> & string)}
                />
              </div>
            ))}
          </FormSection>
          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending || update.isPending}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(indexPath)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
