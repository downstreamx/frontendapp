import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { getImagePath } from '@/utils/helpers'

type Props = {
  companyName: string
  companyLogo?: string | null
}

export function PartyCompanyNameCell({ companyName, companyLogo }: Props) {
  const [failed, setFailed] = useState(false)
  const showLogo = Boolean(companyLogo?.trim()) && !failed

  return (
    <div className="flex w-full max-w-[210px] flex-col gap-2">
      <div className="flex max-h-[90px] w-full max-w-[210px] items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {showLogo ? (
          <img
            src={getImagePath(companyLogo!)}
            alt=""
            className="h-auto w-full max-h-[90px] max-w-[210px] object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex min-h-10 w-full max-h-[90px] items-center justify-center py-2">
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>
      <span className="text-sm">{companyName}</span>
    </div>
  )
}
