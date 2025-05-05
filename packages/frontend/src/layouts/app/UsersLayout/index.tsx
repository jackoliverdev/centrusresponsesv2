import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { EmployeeDetails } from "@/components/app/EmployeeDetails";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EditEmployeeModal } from "@/components/app/EditEmployee";
import { Loading } from "@/components/common/Loading";
import { DeleteEmployee } from "@/components/app/DeleteEmployee";
import { ROLE_LABELS, USER_ROLES } from "common";
import { UserWithRole } from "@/types";
import { useOrganizationUsers } from "@/hooks/admin/useOrganizationUsers";
import { Avatar } from "@/components/ui/avatar";
import { getUserLabel } from "@/utils/user";
import { App, Button, Dropdown, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { DataAccessTag } from "@/components/app/DataAccessTag";

type Props = object;

export const UsersLayout: FunctionComponent<
  PropsWithChildren<Props>
> = ({}) => {
  const { notification } = App.useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeDetailsId, setEmployeeDetailsId] = useState<number>();
  const [employeeEditId, setEmployeeEditId] = useState<number>();
  const [employeeDeleteId, setEmployeeDeleteId] = useState<number>();

  const {
    isLoading,
    error,
    data: users = [],
    refetch,
  } = useOrganizationUsers();

  const activeEmployee: UserWithRole | undefined = useMemo(
    () => users.find((u) => u.id === employeeDetailsId),
    [users, employeeDetailsId],
  );

  const activeEditEmployee = useMemo(
    () => users.find((u) => u.id === employeeEditId),
    [users, employeeEditId],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u?.profile?.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.id.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [users, searchTerm],
  );

  useEffect(() => {
    error &&
      notification.error({
        message: "Error",
        description: (error as Error).message,
      });
  }, [error, notification]);

  return isLoading ? (
    <Loading className="h-screen" />
  ) : (
    <>
      <div className="bg-background border border-border p-4 md:p-6 rounded-xl overflow-hidden">
        <div className="flex justify-between md:items-center mb-6 flex-col md:flex-row gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Registered users</h1>
          <div className="relative w-full md:w-7/12">
            <Search className="w-5 h-auto absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="rounded-lg pl-10 pr-3 py-3"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto hidden md:block">
          <Table className="min-w-[50rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Employee ID</TableHead>
                <TableHead>Employee name</TableHead>
                <TableHead>User type</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead className="w-[200px] text-right">Messages sent</TableHead>
                <TableHead className="w-[50px]text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((filteredUser) => {
                const userId = filteredUser.id;
                const isAdmin = filteredUser.role === USER_ROLES.admin;

                return (
                  <TableRow
                    key={userId}
                    onClick={() => setEmployeeDetailsId(userId)}
                  >
                    <TableCell className="font-medium">{userId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar
                          src={filteredUser.image}
                          className="mr-2"
                          size={32}
                        />
                        <div>
                          <p className="text-base text-grey-dark max-w-64 truncate">
                            {getUserLabel(filteredUser)}
                          </p>
                          <p className="text-sm text-grey-medium max-w-64 truncate">
                            {filteredUser.profile?.position}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tag
                        color={isAdmin ? "blue" : "success"}
                        className="whitespace-nowrap"
                      >
                        {filteredUser.role == USER_ROLES.owner
                          ? "Super-Admin"
                          : ROLE_LABELS[filteredUser.role]}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      {filteredUser.tags.length == 0 && (
                        <span className="text-neutral-500">No tags</span>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {[...filteredUser.tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag, i) => (
                          <DataAccessTag key={i} className="m-0" tag={tag} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {filteredUser.chat_count}
                    </TableCell>
                    <TableCell>
                      <Dropdown
                        placement="bottomRight"
                        arrow
                        menu={{
                          items: [
                            {
                              label: "Delete",
                              key: "delete",
                              icon: <DeleteOutlined />,
                              danger: true,
                              onClick: ({ domEvent: e }) => {
                                e.stopPropagation();
                                setEmployeeDeleteId(userId);
                              },
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          variant="text"
                          icon={<MoreHorizontal className="h-5 w-5" />}
                          className="p-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden flex flex-col gap-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm border p-4 active:bg-gray-50"
              onClick={() => setEmployeeDetailsId(user.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={user.image} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {getUserLabel(user)}
                  </div>
                  <div className="text-sm text-neutral-500 truncate">
                    {user.profile?.position || "No position"}
                  </div>
                </div>
                <Dropdown
                  placement="bottomRight"
                  arrow
                  menu={{
                    items: [
                      {
                        label: "Delete",
                        key: "delete",
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: ({ domEvent: e }) => {
                          e.stopPropagation();
                          setEmployeeDeleteId(user.id);
                        },
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    variant="text"
                    className="p-0"
                    icon={<MoreHorizontal className="h-5 w-5" />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>

              <div className="mb-2">
                <Tag
                  color={user.role === USER_ROLES.admin ? "blue" : "success"}
                  className="text-xs"
                >
                  {user.role === USER_ROLES.owner
                    ? "Super-Admin"
                    : ROLE_LABELS[user.role]}
                </Tag>
              </div>

              <div className="flex gap-2 flex-wrap mb-2">
                {[...user.tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag, i) => (
                  <DataAccessTag key={i} className="text-xs" tag={tag} />
                ))}
              </div>

              <div className="text-sm text-neutral-500">
                {user.chat_count} chats
              </div>
            </div>
          ))}
        </div>
      </div>

      <EmployeeDetails
        employee={activeEmployee}
        onEdit={() => {
          setEmployeeEditId(activeEmployee?.id);
          setEmployeeDetailsId(undefined);
        }}
        onClose={() => setEmployeeDetailsId(undefined)}
      />
      {activeEditEmployee && (
        <EditEmployeeModal
          employee={activeEditEmployee}
          onClose={() => setEmployeeEditId(undefined)}
          onSuccess={refetch}
        />
      )}
      {employeeDeleteId && (
        <DeleteEmployee
          employeeId={employeeDeleteId}
          onClose={() => setEmployeeDeleteId(undefined)}
          onSuccess={refetch}
        />
      )}
    </>
  );
};
