import { AdminUserDetailContainer } from "@/features/admin/components/user-detail-container";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return <AdminUserDetailContainer uid={uid} />;
}
