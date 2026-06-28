import { BookOpen, FolderGit2 } from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';

import { NavUser } from '@/components/nav-user';
import {
    Sidebar,

    SidebarFooter,
    SidebarHeader,
    SidebarMenu,

    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';



const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>



            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
