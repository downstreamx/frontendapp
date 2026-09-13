import { FileText, LayoutGrid, Truck } from 'lucide-react'
import type { NavItem } from '@/types'
import { paths } from '@/lib/paths'

export const getClientPortalMenu = (t: (key: string) => string): NavItem[] => [
  {
    title: t('Portal'),
    icon: LayoutGrid,
    name: 'portal',
    order: 1,
    children: [
      {
        title: t('Dashboard'),
        href: paths.portal.dashboard,
        icon: LayoutGrid,
        order: 1,
      },
      {
        title: t('My invoices'),
        href: paths.portal.invoices,
        icon: FileText,
        order: 2,
      },
      {
        title: t('Distribution report'),
        href: paths.portal.distributionReport,
        icon: Truck,
        order: 3,
      },
    ],
  },
]
