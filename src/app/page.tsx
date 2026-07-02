import { redirect } from "next/navigation";

// The proxy handles language detection for /, this is just a safety fallback.
export default function RootPage() {
  redirect("/en");
}
