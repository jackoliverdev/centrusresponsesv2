import React, { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { getUserLabel } from '@/utils/user';
import { Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ALL_USER_ROLES, ROLE_LABELS, USER_ROLES } from 'common';
import { EditEmployeeModal } from '@/components/app/EditEmployee';
import { Loader } from '@/components/ui/loader';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';

export const UsersView = () => {
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const {
    isLoading,
    data: users = [],
    refetch,
  } = useOrganizationUsers();
  const activeEditUser = users.find((u) => u.id === editUserId);

  if (isLoading) return <Loader className="mx-auto" />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {users.map((user) => {
          const isAdmin = user.role === ALL_USER_ROLES[2];
          return (
            <div key={user.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
              <Avatar src={user.image} size={40} />
              <div className="flex-1 min-w-0 ml-3">
                <div className="font-medium truncate">{getUserLabel(user)}</div>
                <div className="text-sm text-neutral-500 truncate">{user.profile?.position}</div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge
                  variant={isAdmin ? 'default' : 'secondary'}
                  className="text-xs whitespace-nowrap"
                >
                  {user.role === USER_ROLES.owner ? 'Super-Admin' : ROLE_LABELS[user.role]}
                </Badge>
                <button 
                  onClick={() => setEditUserId(user.id)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeEditUser && (
        <EditEmployeeModal
          employee={activeEditUser}
          onClose={() => setEditUserId(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};