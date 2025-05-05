import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Upload,
  Modal,
  Input,
  Form as AntForm,
  Switch,
  App,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons/lib';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { USER_ROLES } from 'common';
import { EmployeeFormSchema, employeeFormSchema } from '@/utils/form-schema';
import { UserWithRole } from '@/types';
import { useFileURL } from '@/hooks/useFileURL';
import { useUpdateUser } from '@/hooks/admin/useUpdateUser';
import { Avatar } from '@/components/ui/avatar';
import { DataAccessTagsSection } from '../DataAccessTagsSection';
import { TeamMembersSection } from '../TeamMembersSection';
import { useTeamMembers } from '@/hooks/admin/useTeamMembers';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { useAuthContext } from '@/context/AuthContext';

type Props = {
  employee: UserWithRole;
  onClose: () => void;
  onSuccess?: () => void;
};

export const EditEmployeeModal: FunctionComponent<Props> = ({
  employee,
  onClose,
  onSuccess,
}) => {
  const { notification } = App.useApp();
  const { data: teamMembersData = [] } = useTeamMembers(employee.id);
  const { data: users = [] } = useOrganizationUsers();
  const { user, refresh } = useAuthContext();
  const [newImage, setNewImage] = useState<File>();
  const newImageURL = useFileURL(newImage);
  const [tags, setTags] = useState(employee.tags);
  const [isAdmin, setIsAdmin] = useState(employee.role === USER_ROLES.admin);
  const [isTeamleader, setIsTeamleader] = useState(employee.is_teamleader);
  const [teamMembers, setTeamMembers] = useState(teamMembersData);
  const form = useForm<EmployeeFormSchema>({
    resolver: zodResolver(employeeFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.profile?.position ?? '',
      phone: employee.phone ?? '',
      email: employee?.email,
      address: employee.profile?.address ?? '',
      image: employee?.image,
    },
  });

  useEffect(() => {
    setTeamMembers(teamMembersData);
  }, [teamMembersData]);

  const { control, handleSubmit } = form;

  const { mutate: updateUser, isLoading } = useUpdateUser();

  const addTeamMember = useCallback(
    (userId: number) => {
      const newTeamMember = users.find((e) => e.id === userId);
      if (!newTeamMember) return;
      setTeamMembers((prev) => [...prev, newTeamMember]);
    },
    [users],
  );
  const removeTeamMember = useCallback((userId: number) => {
    setTeamMembers((prev) => prev.filter((e) => e.id !== userId));
  }, []);

  const onFormSubmit = async (data: EmployeeFormSchema) => {
    updateUser(
      {
        id: employee.id,
        data: {
          ...data,
          tags,
          isAdmin,
          is_teamleader: isTeamleader,
          teamMemberIds: teamMembers.map(({ id }) => id),
        },
        image: newImage,
      },
      {
        onSuccess: () => {
          notification.success({
            message: 'Success',
            description: 'Employee updated!',
          });
          onSuccess?.();
          onClose();
          // refresh current user if self update
          if (employee.id === user?.id) {
            refresh();
          }
        },
        onError: (e) => {
          notification.error({
            message: 'Error',
            description:
              e instanceof Error ? e.message : 'An unexpected error occurred',
          });
        },
      },
    );
  };

  return (
    <Modal
      open
      centered
      width={450}
      footer={null}
      title={<h2 className="text-3xl font-bold">Edit employee</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:!p-1"
      styles={{
        header: {
          padding: '24px 20px 24px',
        },
      }}
      onCancel={onClose}
    >
      <div className="custom-scroll w-full max-h-[min(80vh,944px)]">
        <Form {...form}>
          <AntForm
            layout="vertical"
            className="px-5 pb-10"
            disabled={isLoading}
            onFinish={handleSubmit(onFormSubmit)}
          >
            {employee && (
              <>
                <div className="space-y-5 mb-6">
                  <h4 className="text-base font-bold">General information</h4>
                  <FormField
                    control={control}
                    name="image"
                    render={({ field }) => (
                      <AntForm.Item name={field.name}>
                        <FormItem>
                          <FormControl>
                            <div className="w-full flex items-center gap-x-4">
                              <Avatar
                                size={64}
                                src={newImageURL || field.value}
                                className="shrink-0"
                              />
                              <div className="flex gap-x-2 items-center">
                                <Upload
                                  beforeUpload={(file) => {
                                    setNewImage(file);
                                    return false;
                                  }}
                                  accept=".png,.jpeg,.jpg"
                                >
                                  <Button
                                    variant="outlined"
                                    className="px-6 py-3"
                                    htmlType="button"
                                  >
                                    Upload new
                                  </Button>
                                </Upload>
                                {field.value && (
                                  <Button
                                    variant="outlined"
                                    className="border-error text-error px-4 py-2 hover:bg-error/5"
                                    onClick={() => field.onChange('')}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />
                  <FormField
                    control={control}
                    name="firstName"
                    defaultValue={employee?.firstName ?? ''}
                    render={({ field }) => (
                      <AntForm.Item
                        name={field.name}
                        label="First name"
                        className="mb-0"
                      >
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="First name"
                              className="h-12 rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />
                  <FormField
                    control={control}
                    name="lastName"
                    defaultValue={employee?.lastName ?? ''}
                    render={({ field }) => (
                      <AntForm.Item
                        name={field.name}
                        label="Last name"
                        className="mb-0"
                      >
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Last name"
                              className="h-12 rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />
                  <FormField
                    control={control}
                    name="position"
                    render={({ field }) => (
                      <AntForm.Item
                        name={field.name}
                        label="Position"
                        className="mb-0"
                      >
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Position"
                              className="h-12 rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />
                </div>

                <div className="space-y-5 mb-6">
                  <h4 className="text-base font-bold">Contact information</h4>
                  <FormField
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <AntForm.Item
                        name={field.name}
                        label="Phone"
                        className="mb-0"
                      >
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Phone"
                              className="h-12 rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />
                  <FormField
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <AntForm.Item
                        name={field.name}
                        label="Address"
                        className="mb-0"
                      >
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Address"
                              className="h-12 rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </AntForm.Item>
                    )}
                  />

                  <DataAccessTagsSection value={tags} onChange={setTags} />

                  <div>
                    <h4 className="text-base font-bold mb-3">
                      Employee information
                    </h4>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-x-2">
                        <Switch
                          checked={isAdmin}
                          onChange={(v) => setIsAdmin(v)}
                          disabled={employee.id === user?.id}
                        />
                        <span>Admin</span>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <Switch
                          checked={isTeamleader}
                          onChange={(value) => setIsTeamleader(value)}
                        />
                        <span>Team leader</span>
                      </div>
                    </div>
                  </div>
                  {isTeamleader && (
                    <>
                      <div className="mb-6">
                        <TeamMembersSection
                          onAdd={addTeamMember}
                          onRemove={removeTeamMember}
                          teamMembers={teamMembers}
                          excludeUserId={employee?.id}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="w-fit ml-auto space-x-4">
                  <Button
                    htmlType="button"
                    variant="outlined"
                    onClick={() => onClose()}
                    disabled={isLoading}
                  >
                    Discard Changes
                  </Button>
                  <Button type="primary" htmlType="submit" loading={isLoading}>
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </AntForm>
        </Form>
      </div>
    </Modal>
  );
};
