import {
  Bell,
  CreditCard,
  Headphones,
  Image,
  Landmark,
  LayoutGrid,
  Mail,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  Ticket,
  Users,
} from 'lucide-react'
import type { NavItem } from '@/types'
import { route } from '@/lib/route'

export const getSuperAdminMenu = (t: (key: string) => string): NavItem[] => [
  {
    title: t('Dashboard'),
    href: route('dashboard'),
    icon: LayoutGrid,
    permission: 'manage-dashboard',
    order: 1,
  },
  {
    title: t('Companies'),
    href: route('users.index'),
    icon: Users,
    permission: 'manage-users',
    order: 20,
  },
  {
    title: t('Helpdesk'),
    icon: Headphones,
    permission: 'manage-helpdesk-tickets',
    order: 2750,
    children: [
      {
        title: t('Tickets'),
        href: route('helpdesk-tickets.index'),
        icon: Ticket,
        permission: 'manage-any-helpdesk-tickets',
      },
      {
        title: t('Categories'),
        href: route('helpdesk-categories.index'),
        icon: Tag,
        permission: 'manage-helpdesk-categories',
      },
    ],
  },
  {
    title: t('Subscription'),
    icon: CreditCard,
    permission: 'manage-plans',
    order: 2800,
    children: [
      {
        title: t('Subscription Setting'),
        href: route('plans.index'),
        icon: CreditCard,
        permission: 'manage-plans',
      },
      {
        title: t('Coupons'),
        href: route('coupons.index'),
        icon: Tag,
        permission: 'manage-coupons',
      },
      {
        title: t('Bank Transfer Requests'),
        href: route('bank-transfer.index'),
        icon: Landmark,
        permission: 'manage-bank-transfer-requests',
      },
      {
        title: t('Orders'),
        href: route('orders.index'),
        icon: ShoppingBag,
        permission: 'manage-orders',
      },
    ],
  },
  {
    title: t('Email Temp.'),
    href: route('email-templates.index'),
    icon: Mail,
    permission: 'manage-email-templates',
    order: 2850,
  },
  {
    title: t('Notifi. Temp.'),
    href: route('notification-templates.index'),
    icon: Bell,
    permission: 'manage-notification-templates',
    order: 2900,
  },
  {
    title: t('Media Library'),
    href: route('media-library'),
    icon: Image,
    permission: 'manage-media',
    order: 2950,
  },
  {
    title: t('Add-ons'),
    href: route('add-ons.index'),
    icon: Package,
    permission: 'manage-add-on',
    order: 3000,
  },
  {
    title: t('Settings'),
    href: route('settings.index'),
    icon: Settings,
    permission: 'manage-settings',
    order: 3050,
  },
]
