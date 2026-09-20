import { redirect } from "next/navigation";
export const metadata = { title: "Your Cookbook" };
export default function CookbookPage() { redirect("/create?view=cookbook"); }
