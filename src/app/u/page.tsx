import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function URedirect() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  redirect(`/u/${session.user.username}`);
}
