import Sidebar from '@/components/Sidebar';
import SidebarContainer from '@/components/SidebarContainer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
            <SidebarContainer>
                <Sidebar />
            </SidebarContainer>
            {children}
        </div>
    );
}
