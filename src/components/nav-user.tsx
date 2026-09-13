'use client'

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/components/theme-provider'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { useLogoutMutation } from '@/features/auth/hooks'
import { paths } from '@/lib/paths'
import { route } from '@/lib/route'

type NavUserRecord = {
  id: number
  name: string
  email: string
  lang?: string
  avatar?: string | null
}

function NavUserMenuContent({
  user,
  megaMenu = false,
  showThemeOptions = false,
}: {
  user: NavUserRecord
  megaMenu?: boolean
  showThemeOptions?: boolean
}) {
  const { setTheme } = useTheme()
  const { t } = useTranslation()
  const logout = useLogoutMutation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate(paths.login)
  }

  return (
    <>
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to={route('profile.edit')}>
            <BadgeCheck className="mr-2 h-4 w-4" />
            {t('Edit Profile')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      {showThemeOptions ? (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              {t('Light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              {t('Dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              {t('System')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      ) : null}
      <DropdownMenuItem onClick={() => void handleLogout()}>
        <LogOut className="mr-2 h-4 w-4" />
        {megaMenu ? t('Logout') : t('Log out')}
      </DropdownMenuItem>
    </>
  )
}

function NavUserHeader({
  user,
  megaMenu = false,
}: {
  user: NavUserRecord
  megaMenu?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 items-center gap-2 rounded-md px-3">
          <UserAvatar avatar={user.avatar} name={user.name} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <NavUserMenuContent user={user} megaMenu={megaMenu} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavUserSidebar({ user }: { user: NavUserRecord }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar avatar={user.avatar} name={user.name} size="sm" rounded="md" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <NavUserMenuContent user={user} showThemeOptions />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function NavUser({
  user: userProp,
  inHeader = false,
  megaMenu = false,
}: {
  user?: NavUserRecord
  inHeader?: boolean
  megaMenu?: boolean
}) {
  const { auth } = useAppContext()
  const user = userProp ?? auth.user

  if (!user) {
    return null
  }

  if (inHeader) {
    return <NavUserHeader user={user} megaMenu={megaMenu} />
  }

  return <NavUserSidebar user={user} />
}
