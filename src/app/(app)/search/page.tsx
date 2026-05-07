import SearchBar from "@/components/SearchBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function SearchPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    return (
        <main className="flex-1 overflow-y-auto scroll-smooth bg-background">
            <header className="p-8 md:p-12 border-b-2 border-foreground sticky top-0 z-10 bg-background">
                <h1 className="tracking-[0.2em] text-terracotta font-bold">
                    SEARCH
                </h1>
                <p className="mt-1 text-foreground text-[11px] font-bold uppercase tracking-widest">
                    LIVE FILTER // TYPE TO BEGIN
                </p>
            </header>
            <SearchBar />
        </main>
    );
}
