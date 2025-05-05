import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type UserSchema = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  firebaseUid: string;
  numberOfOrganizations: number;
  isPlatformAdmin: boolean;
};

type OrganizationMembership = {
  id: number;
  name: string;
  role: string;
};

// Mock data for the user
const user: UserSchema = {
  id: 1,
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  firebaseUid: 'abc123xyz789',
  numberOfOrganizations: 3,
  isPlatformAdmin: true,
};

// Mock data for the user's organization memberships
const organizationMemberships: OrganizationMembership[] = [
  { id: 1, name: 'Acme Corp', role: 'Admin' },
  { id: 2, name: 'Globex Corporation', role: 'Member' },
  { id: 3, name: 'Initech', role: 'Owner' },
];

import { FunctionComponent, PropsWithChildren } from 'react';

type Props = {};

export const AdminUserDetailsScreen: FunctionComponent<
  PropsWithChildren<Props>
> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    // In a real application, this would navigate to an edit form or open a modal
    console.log('Edit user:', user.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/users"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Avatar
                className="h-24 w-24 mr-6"
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.firstName} ${user.lastName}`}
              />
              <div>
                <h1 className="text-4xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-xl">{user.email}</p>
              </div>
            </div>
            <Button onClick={handleEdit} variant="secondary" size="lg">
              <Edit className="mr-2 h-5 w-5" /> Edit User
            </Button>
          </div>
        </div>
      </div>

      {/* User Details Card */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Personal details and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p>{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Firebase UID
              </p>
              <p>{user.firebaseUid}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Organizations
              </p>
              <p>{user.numberOfOrganizations}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Platform Admin
              </p>
              <Badge variant={user.isPlatformAdmin ? 'default' : 'secondary'}>
                {user.isPlatformAdmin ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Memberships Table */}
      <div className="flex-grow bg-muted py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-4">Organization Memberships</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Organization Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationMemberships.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>{org.id}</TableCell>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
