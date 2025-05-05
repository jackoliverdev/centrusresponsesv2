import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { FunctionComponent } from 'react';
import { Avatar } from '../ui/avatar';
import { CloseOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { UserSchema } from 'common';
import { getUserLabel } from '@/utils/user';

export type TeamMembersSectionProps = {
  teamMembers: UserSchema[];
  onAdd?: (id: number) => void;
  onRemove?: (id: number) => void;
  excludeUserId?: number;
  readOnly?: boolean;
};

export const TeamMembersSection: FunctionComponent<TeamMembersSectionProps> = ({
  teamMembers,
  onAdd,
  onRemove,
  excludeUserId,
  readOnly,
}) => {
  const { data: users = [] } = useOrganizationUsers();

  return (
    <div>
      <h4 className="text-base font-bold mb-2">Team members</h4>
      <div className="flex flex-wrap gap-x-1 gap-y-2">
        {teamMembers.map((member) => (
          <div
            className="flex items-center border rounded-lg gap-1.5 py-1.5 px-2 w-fit"
            key={member.id}
          >
            <Avatar size={20} />
            <div>{getUserLabel(member)}</div>
            {!readOnly && (
              <button onClick={() => onRemove?.(member.id)}>
                <CloseOutlined />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Select
            options={users
              .filter((u) => u.id !== excludeUserId) // we don't want to add the user to their own team
              .map((u) => ({
                value: u.id,
                label: getUserLabel(u),
              }))}
            onChange={(value) => onAdd?.(value)}
            className="w-36"
            placeholder="Add member"
          />
        )}
      </div>
    </div>
  );
};
