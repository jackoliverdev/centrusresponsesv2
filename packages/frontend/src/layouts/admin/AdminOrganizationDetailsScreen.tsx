import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search, Edit } from "lucide-react";

type UserRole = "Admin" | "Editor" | "Viewer";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

type Organization = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  users: User[];
};

// Mock data for the organization
const organizationData: Organization = {
  id: 1,
  name: "Acme Corp",
  description: "A fictional company in the software industry",
  createdAt: "2023-01-15",
  users: [
    { id: 1, name: "John Doe", email: "john@acme.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@acme.com", role: "Editor" },
    { id: 3, name: "Bob Johnson", email: "bob@acme.com", role: "Viewer" },
  ],
};

import { FunctionComponent, PropsWithChildren } from "react";
import { ADMIN_ROUTES } from "@/routing/routes";
import Link from "next/link";

type Props = {};

export const AdminOrganizationDetailsScreen: FunctionComponent<
  PropsWithChildren<Props>
> = ({ children }) => {
  const [organization, setOrganization] =
    useState<Organization>(organizationData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenDialog = (user: User | null = null) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      id: editingUser ? editingUser.id : organization.users.length + 1,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as UserRole,
    };
    console.log("User data:", userData);
    // Here you would typically send the data to your backend
    // and update the organization state
    if (editingUser) {
      setOrganization((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === userData.id ? userData : user,
        ),
      }));
    } else {
      setOrganization((prev) => ({
        ...prev,
        users: [...prev.users, userData],
      }));
    }
    handleCloseDialog();
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Organization Details</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2">
            {organization.description}
          </p>
          <p className="text-sm text-muted-foreground">
            Created on: {organization.createdAt}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" placeholder="Search users..." />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organization.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={ADMIN_ROUTES.getPath("adminUser", { id: user.id })}
                  >
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Edit the user details below."
                : "Enter the details for the new user. Click save when you're done."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingUser?.name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  defaultValue={editingUser?.email}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  name="role"
                  defaultValue={editingUser?.role || "Viewer"}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
