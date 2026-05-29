import Sidebar from '@/components/Sidebar';
import SidebarContainer from '@/components/SidebarContainer';
import MobileShell from '@/components/MobileShell';
import { MobileSidebarProvider } from '@/components/MobileSidebarContext';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AutoSync from '@/components/AutoSync';

export default async function UserLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ username: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { username } = await params;
    if (session.user.username !== username) {
        redirect(`/u/${session.user.username}`);
    }

    return (
        <MobileSidebarProvider>
            <AutoSync />
            <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
                <SidebarContainer>
                    <Sidebar username={session.user.username} />
                </SidebarContainer>
                <MobileShell>
                    {children}
                </MobileShell>
            </div>
        </MobileSidebarProvider>
    );
}
