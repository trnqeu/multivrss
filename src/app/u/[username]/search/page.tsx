import SearchBar from "@/components/SearchBar";
import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions";


export default async function SearchPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    const categories = await getCategories();

    return (
        <>
            <PageHeader categories={categories} username={session.user.username} />
            <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
                <SearchBar />
            </main>
        </>
    );
}
