import AdminLayout from "@/components/admin/AdminLayout";
import CommunityFeed from "@/components/community/CommunityFeed";

export default function AdminCommunity() {
  return (
    <AdminLayout>
      <CommunityFeed
        title="Communauté - Administration"
        showFloatingButton={true}
      />
    </AdminLayout>
  );
}
