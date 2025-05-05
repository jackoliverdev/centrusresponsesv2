import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Form as AntForm,
  Input,
  Upload,
  Modal,
  Switch,
  notification,
} from 'antd/lib';
import { PlusOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons/lib';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  createUserFormSchema,
  CreateUserFormSchema,
} from '@/utils/form-schema';
import { useFileURL } from '@/hooks/useFileURL';
import { DataAccessTagsSection } from '../DataAccessTagsSection';
import { TeamMembersSection } from '../TeamMembersSection';
import { TagItemData, UserSchema } from 'common';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { useCreateUser } from '@/hooks/admin/useCreateUser';
import { usePasswordStrength } from '@/hooks/form/usePasswordStrength';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export const AddEmployee: FunctionComponent<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [section, setSection] = useState(0);
  const [image, setImage] = useState<File>();
  const imageUrl = useFileURL(image);
  const [tags, setTags] = useState<TagItemData[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserSchema[]>([]);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const { mutate: createUser, isLoading } = useCreateUser();

  const { data: users = [] } = useOrganizationUsers();

  const form = useForm<CreateUserFormSchema>({
    resolver: zodResolver(createUserFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      password: '',
      is_teamleader: false,
      isAdmin: false,
    },
  });

  const handleImage = useCallback((file: File) => {
    setImage(file);
    return false;
  }, []);

  const handleClose = useCallback(() => {
    form.reset();
    onClose();
  }, [form, onClose]);

  const email = form.watch('email');
  const emailAlreadyTaken = useMemo(() => {
    return users.some(
      (u) => u.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
    );
  }, [users, email]);

  const { control, handleSubmit, trigger } = form;

  const isFirstSection = section === 0;

  const passwordValue = form.watch('password');
  const { strength, strengthLevel, isStrong, updatePassword } = usePasswordStrength(passwordValue || '');

  useEffect(() => {
    if (passwordValue) {
      updatePassword(passwordValue);
    }
  }, [passwordValue, updatePassword]);

  const onFormSubmit = async (data: CreateUserFormSchema) => {
    if (
      users.some(
        (u) => u.email.toLocaleLowerCase() === data.email.toLocaleLowerCase(),
      )
    ) {
      setSection(0);
      return notification.error({ message: 'Email already exists' });
    }

    createUser(
      {
        ...data,
        image,
        tags,
        team_member_ids: teamMembers.map((t) => t.id),
      },
      {
        onError: (error) => {
          notification.info({
            message: 'Error',
            description:
              error instanceof Error ? error.message : 'Something went wrong',
          });
        },
        onSuccess: () => {
          notification.success({
            message: 'Success',
            description: 'Employee created!',
          });
          form.reset();
          setSection(0);
          setTags([]);
          onSuccess?.();
          handleClose();
        },
      },
    );
  };

  return (
    <Modal
      open={isOpen}
      centered
      width={450}
      footer={null}
      title={<h2 className="text-3xl font-bold">Add new employee</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:!p-1"
      styles={{
        header: {
          padding: '24px 20px 24px',
        },
      }}
      onCancel={handleClose}
    >
      <div className="custom-scroll w-full max-h-[min(80vh,944px)]">
        <div className="flex flex-col gap-y-6 px-5 pb-10">
          <div className="flex items-center gap-x-2">
            {new Array(2).fill(null).map((_, index) => (
              <div
                key={index}
                className={classNames(
                  'w-1/2 h-1 rounded-full cursor-pointer',
                  section >= index ? 'bg-primary' : 'bg-primary-light',
                  'transition-colors',
                )}
                onClick={() => setSection(index)}
              />
            ))}
          </div>
          <Form {...form}>
            <AntForm layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
              {isFirstSection ? (
                <>
                  <div className="mb-6 space-y-5">
                    <h3 className="text-base font-bold">General information</h3>
                    <FormField
                      control={control}
                      name="image"
                      render={() => (
                        <AntForm.Item>
                          <FormItem>
                            <FormControl>
                              <Upload
                                listType="picture-card"
                                showUploadList={false}
                                className="w-full flex justify-center items-center h-24"
                                rootClassName="w-full h-auto !grid grid-cols-1 [&>div]:!block [&>div]:!w-full [&>div]:!h-auto [&>div]:!border-none [&>div]:!bg-background"
                                beforeUpload={handleImage}
                                accept=".png,.jpeg,.jpg"
                              >
                                <div className="w-full flex gap-4 items-center">
                                  {imageUrl ? (
                                    <img
                                      className="flex size-14 rounded-full "
                                      src={imageUrl}
                                      alt=""
                                    />
                                  ) : (
                                    <span className="flex w-fit p-6 rounded-full border-2 border-dashed border-input">
                                    <PlusOutlined className="text-base text-primary" />
                                  </span>
                                  )}
                                  <div className="text-left text-base text-grey-medium">
                                    You can upload{' '}
                                    <span className="text-primary">
                                    JPG, JPEG, PNG
                                  </span>{' '}
                                    files with max size of{' '}
                                    <span className="text-primary">5MB</span>
                                  </div>
                                </div>
                              </Upload>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </AntForm.Item>
                      )}
                    />
                    <FormField
                      control={control}
                      name="firstName"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="First Name">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter first name"
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
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Last name">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter last name"
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
                        <AntForm.Item name={field.name} label="Position">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter position"
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
                  <div className="space-y-5">
                    <h3 className="text-base font-bold">Contact information</h3>
                    <FormField
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Phone">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter phone"
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
                      name="email"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Email">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter email"
                                className="h-12 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            {emailAlreadyTaken && (
                              <div className="text-red-500 mt-1">
                                Email already taken
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        </AntForm.Item>
                      )}
                    />
                    <FormField
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Password">
                          <FormItem>
                            <FormControl>
                              <Input.Password
                                placeholder="Enter password"
                                className="h-12 rounded-lg"
                                iconRender={(visible) => 
                                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                                }
                                onFocus={() => setIsPasswordFieldFocused(true)}
                                onBlur={(e) => {
                                  setIsPasswordFieldFocused(false);
                                  field.onBlur();
                                }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  updatePassword(e.target.value);
                                }}
                                value={field.value}
                                name={field.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </AntForm.Item>
                      )}
                    />
                    <FormField
                      control={control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Confirm Password">
                          <FormItem>
                            <FormControl>
                              <Input.Password
                                placeholder="Confirm your password"
                                className="h-12 rounded-lg"
                                iconRender={(visible) => 
                                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                                }
                                onFocus={() => setIsPasswordFieldFocused(true)}
                                onBlur={(e) => {
                                  setIsPasswordFieldFocused(false);
                                  field.onBlur();
                                }}
                                value={field.value}
                                onChange={field.onChange}
                                name={field.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </AntForm.Item>
                      )}
                    />
                    <PasswordStrengthIndicator
                      strength={strength}
                      strengthLevel={strengthLevel}
                      visible={isPasswordFieldFocused}
                    />
                    <FormField
                      control={control}
                      name="address"
                      render={({ field }) => (
                        <AntForm.Item name={field.name} label="Address">
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter address"
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
                </>
              ) : (
                <>
                  <div className="space-y-5 mb-6">
                    <h3 className="text-base font-bold">Contact information</h3>
                    <div className="space-y-2">
                      <FormField
                        control={control}
                        name="isAdmin"
                        render={({ field }) => (
                          <AntForm.Item name={field.name} label="Admin">
                            <FormItem>
                              <FormControl>
                                <Switch {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </AntForm.Item>
                        )}
                      />
                      <FormField
                        control={control}
                        name="is_teamleader"
                        render={({ field }) => (
                          <AntForm.Item name={field.name} label="Team leader">
                            <FormItem>
                              <FormControl>
                                <Switch {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </AntForm.Item>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-5 mb-6">
                    <DataAccessTagsSection value={tags} onChange={setTags} />
                    {!tags && (
                      <div className="text-red-400">A tag is required</div>
                    )}
                  </div>

                  {form.getValues('is_teamleader') && (
                    <div className="space-y-5">
                      <TeamMembersSection
                        teamMembers={teamMembers}
                        onAdd={(id) => {
                          if (teamMembers.find((t) => t.id === id)) return;
                          const user = users.find((u) => u.id === id);
                          if (user) setTeamMembers([...teamMembers, user]);
                        }}
                        onRemove={(id) =>
                          setTeamMembers(teamMembers.filter((t) => t.id !== id))
                        }
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center gap-x-6 mt-6">
                <div>
                  {!isFirstSection && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-primary hover:text-primary"
                      onClick={() => setSection(0)}
                    >
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-x-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 py-3"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  {isFirstSection && (
                    <Button
                      variant="default"
                      className="px-4 py-2"
                      type="button"
                      onClick={async () => {
                        const valid = await trigger();
                        if (!valid || !isStrong) return;
                        setSection(1);
                      }}
                      disabled={emailAlreadyTaken || !isStrong}
                    >
                      Next
                    </Button>
                  )}
                  {!isFirstSection && (
                    <Button
                      type="submit"
                      disabled={isLoading || !tags}
                      className="px-4 py-2"
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </AntForm>
          </Form>
        </div>
      </div>
    </Modal>
  );
};
