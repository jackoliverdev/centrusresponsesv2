import React, { FunctionComponent, useMemo } from 'react';
import { Modal } from 'antd/lib';
import {
  CloseOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons/lib';
import { Button } from '@/components/ui/button';
import { ALL_USER_ROLES } from 'common';
import { UserWithRole } from '@/types';
import { Avatar } from '../ui/avatar';
import { TeamMembersSection } from './TeamMembersSection';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { getUserLabel } from '@/utils/user';
import { DataAccessTagsSection } from './DataAccessTagsSection';

type Props = {
  employee?: UserWithRole;
  onEdit: () => void;
  onClose: () => void;
};

export const EmployeeDetails: FunctionComponent<Props> = ({
  employee,
  onEdit,
  onClose,
}) => {
  const isVisible = !!employee;
  const isAdmin = employee?.role === ALL_USER_ROLES[2];
  const employeeProfile = employee?.profile;

  const { data: users = [] } = useOrganizationUsers();

  const teamMembers = useMemo(() => {
    return users.filter((u) => u.teamlead_id === employee?.id);
  }, [users, employee?.id]);

  return (
    <Modal
      open={isVisible}
      centered
      width={400}
      footer={null}
      title={<h2 className="text-3xl font-bold">Employee details</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:!p-1 relative"
      styles={{
        header: {
          padding: '24px 20px 24px',
        },
      }}
      onCancel={onClose}
    >
      {employee && (
        <div className="custom-scroll w-full max-h-[min(80vh,944px)]">
          <div className="px-5 pb-10">
            <div className="flex items-center mb-6">
              <Avatar size={64} src={employee.image} className="shrink-0" />
              <div className="ml-4 flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  {getUserLabel(employee)}
                </h3>
                <p className="text-gray-dark truncate">
                  {employeeProfile?.position ?? '-'}
                </p>
              </div>
            </div>

            <h4 className="text-base font-bold mb-3">Contact information</h4>
            <div className="space-y-2 mb-6">
              <div className="flex items-center">
                <PhoneOutlined className="mr-2 text-gray-dark" />{' '}
                <div className="flex-1 min-w-0 truncate">
                  {employee.phone || '-'}
                </div>
              </div>
              <div className="flex items-center">
                <MailOutlined className="mr-2 text-gray-dark" />{' '}
                <div className="flex-1 min-w-0 truncate">{employee.email}</div>
              </div>
              <div className="flex items-center">
                <EnvironmentOutlined className="mr-2 text-gray-dark" />{' '}
                <div className="flex-1 min-w-0 truncate">
                  {employeeProfile?.address || '-'}
                </div>
              </div>
            </div>

            <h4 className="text-base font-bold mb-3">Employee information</h4>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-x-2">
                <span>Admin: {isAdmin ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-x-2">
                <span>Teamleader: {employee.is_teamleader ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <DataAccessTagsSection value={employee.tags} readOnly />

            {employee?.is_teamleader && (
              <>
                <div className="mb-6">
                  <TeamMembersSection teamMembers={teamMembers} readOnly />
                </div>
              </>
            )}

            <div className="w-fit ml-auto">
              <Button onClick={onEdit}>Edit employee</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
