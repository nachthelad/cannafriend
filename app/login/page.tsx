import { redirect } from "next/navigation";

export default function LoginPage() {
  // Route is deprecated in favor of modal on home
  redirect("/?auth=1");
}
