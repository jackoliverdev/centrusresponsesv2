import { NextPage } from "next";
import { AdminDashboardScreen } from "@/layouts/admin/AdminDashboardScreen";
import { AdminUserDetailsScreen } from "@/layouts/admin/AdminUserDetailsScreen";

const AdminUserPage: NextPage = () => {
  return (
    <AdminDashboardScreen>
      <AdminUserDetailsScreen />
    </AdminDashboardScreen>
  );
};

export default AdminUserPage;
