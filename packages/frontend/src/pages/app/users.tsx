import { NextPage } from "next";
import { AppLayout } from "@/layouts/app/AppLayout";
import { UsersLayout } from "@/layouts/app/UsersLayout";
import { AddEmployeeButton } from "@/components/app/AddEmployee/AddEmployeeButton";

const AppUsersPage: NextPage = () => {
  return (
    <AppLayout
      currentItemId="users"
      subtitle="Manage user access and permissions"
      action={<AddEmployeeButton />}
    >
      <div className="container">
        <UsersLayout />
      </div>
    </AppLayout>
  );
};

export default AppUsersPage;
