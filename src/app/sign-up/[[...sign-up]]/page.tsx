import { redirect } from "next/navigation";

// Redirect to sign-in page which handles both sign-in and sign-up flows
export default function SignUpPage() {
  redirect("/sign-in");
}
