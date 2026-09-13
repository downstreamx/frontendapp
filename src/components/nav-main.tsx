import { Link, useLocation } from 'react-router-dom'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import type { NavItem } from '@/types'
import { isMenuBranchActive, isMenuPathActive } from '@/utils/menu-path'

function NavSubLink({
  item,
  pathname,
  className,
  iconClassName,
}: {
  item: NavItem
  pathname: string
  className?: string
  iconClassName?: string
}) {
  const active = isMenuPathActive(pathname, item.href)
  if (!item.href) {
    return (
      <SidebarMenuSubButton isActive={false} className={className} aria-disabled>
        {item.icon && <item.icon className={iconClassName ?? 'h-4 w-4'} />}
        <span>{item.title}</span>
      </SidebarMenuSubButton>
    )
  }
  return (
    <SidebarMenuSubButton asChild isActive={active} className={className}>
      <Link to={item.href}>
        {item.icon && <item.icon className={iconClassName ?? 'h-4 w-4'} />}
        <span>{item.title}</span>
      </Link>
    </SidebarMenuSubButton>
  )
}

function NavSubTree({ items, pathname, depth = 0 }: { items: NavItem[]; pathname: string; depth?: number }) {
  return (
    <>
      {items.map((subItem) => {
        const subItemActive = isMenuPathActive(pathname, subItem.href)
        const hasActiveSubChild = subItem.children ? isMenuBranchActive(pathname, subItem.children) : false
        const subItemShouldBeActive = subItemActive || hasActiveSubChild

        if (subItem.children && subItem.children.length > 0) {
          return (
            <SidebarMenuSubItem key={subItem.title}>
              <Collapsible asChild defaultOpen={subItemShouldBeActive} className="group/subcollapsible">
                <div>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuSubButton isActive={subItemShouldBeActive}>
                      {subItem.icon && <subItem.icon className="h-4 w-4" />}
                      <span>{subItem.title}</span>
                      <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/subcollapsible:rotate-180" />
                    </SidebarMenuSubButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {subItem.children.map((subSubItem) => (
                        <SidebarMenuSubItem key={subSubItem.title}>
                          <NavSubLink
                            item={subSubItem}
                            pathname={pathname}
                            className="text-sm"
                            iconClassName="h-4 w-4"
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </SidebarMenuSubItem>
          )
        }

        return (
          <SidebarMenuSubItem key={subItem.title}>
            <NavSubLink item={subItem} pathname={pathname} />
          </SidebarMenuSubItem>
        )
      })}
    </>
  )
}

export function NavMain({ items = [], searchQuery = '' }: { items: NavItem[]; searchQuery?: string }) {
  const { pathname } = useLocation()

  const filterItems = (navItems: NavItem[], query: string): NavItem[] => {
    if (!query) return navItems
    return navItems.reduce<NavItem[]>((acc, item) => {
      const matchesTitle = item.title.toLowerCase().includes(query.toLowerCase())
      const filteredChildren = item.children ? filterItems(item.children, query) : []
      if (matchesTitle || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
        })
      }
      return acc
    }, [])
  }

  const filteredItems = filterItems(items, searchQuery)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const isActive = isMenuPathActive(pathname, item.href)
          const hasActiveChild = item.children ? isMenuBranchActive(pathname, item.children) : false
          const shouldBeActive = isActive || hasActiveChild

          if (item.children && item.children.length > 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <Collapsible
                  asChild
                  defaultOpen={shouldBeActive}
                  className="group/collapsible group-data-[collapsible=icon]:hidden"
                >
                  <div>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={shouldBeActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <NavSubTree items={item.children} pathname={pathname} />
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                <div className="hidden group-data-[collapsible=icon]:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={shouldBeActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-48">
                      {item.children.map((subItem) => {
                        if (subItem.children && subItem.children.length > 0) {
                          return (
                            <DropdownMenu key={subItem.title}>
                              <DropdownMenuTrigger asChild>
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                  <span>{subItem.title}</span>
                                  <ChevronDown className="ml-auto h-3 w-3" />
                                </DropdownMenuItem>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start" className="w-44">
                                {subItem.children.map((subSubItem) => (
                                  <DropdownMenuItem key={subSubItem.title} asChild disabled={!subSubItem.href}>
                                    {subSubItem.href ? (
                                      <Link to={subSubItem.href} className="flex items-center gap-2">
                                        {subSubItem.icon && <subSubItem.icon className="h-4 w-4" />}
                                        <span className="text-sm">{subSubItem.title}</span>
                                      </Link>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">{subSubItem.title}</span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                        return (
                          <DropdownMenuItem key={subItem.title} asChild disabled={!subItem.href}>
                            {subItem.href ? (
                              <Link to={subItem.href} className="flex items-center gap-2">
                                {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                <span>{subItem.title}</span>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{subItem.title}</span>
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuItem>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={shouldBeActive} tooltip={item.title}>
                <Link to={item.href!}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
