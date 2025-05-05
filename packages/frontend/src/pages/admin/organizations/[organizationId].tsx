import { NextPage } from "next";
import { AdminDashboardScreen } from "@/layouts/admin/AdminDashboardScreen";
import { AdminOrganizationDetailsScreen } from "@/layouts/admin/AdminOrganizationDetailsScreen";

const AdminOrganizationPage: NextPage = () => {
  return (
    <AdminDashboardScreen>
      <AdminOrganizationDetailsScreen />
    </AdminDashboardScreen>
  );
};

export default AdminOrganizationPage;
