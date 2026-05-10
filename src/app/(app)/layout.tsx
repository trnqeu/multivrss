import Sidebar from '@/components/Sidebar';
import SidebarContainer from '@/components/SidebarContainer';
import MobileShell from '@/components/MobileShell';
import { MobileSidebarProvider } from '@/components/MobileSidebarContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <MobileSidebarProvider>
            <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
                <SidebarContainer>
                    <Sidebar />
                </SidebarContainer>
                <MobileShell>
                    {children}
                </MobileShell>
            </div>
        </MobileSidebarProvider>
    );
}
