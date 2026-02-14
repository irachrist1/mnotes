import { redirect } from "next/navigation";

export default function ActionsPage() {
  redirect("/dashboard/data?tab=tasks");
}

