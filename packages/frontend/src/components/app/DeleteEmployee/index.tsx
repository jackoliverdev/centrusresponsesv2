import { FunctionComponent } from 'react';
import { Modal, notification } from 'antd/lib';
import { CloseOutlined } from '@ant-design/icons/lib';
import { Button } from '@/components/ui/button';
import { useDeleteUser } from '@/hooks/admin/useDeleteUser';

type Props = {
  employeeId: number;
  onClose: () => void;
  onSuccess?: () => void;
};

export const DeleteEmployee: FunctionComponent<Props> = ({
  employeeId,
  onClose,
  onSuccess,
}) => {
  const { mutate: deleteUser, isLoading } = useDeleteUser();

  const handleDeleteEmployee = () => {
    deleteUser(
      { id: employeeId },
      {
        onSuccess: () => {
          notification.success({
            message: 'Success',
            description: 'Employee deleted!',
          });
          onSuccess?.();
          onClose();
        },
        onError: (error) => {
          notification.info({
            message: 'Error',
            description:
              error instanceof Error ? error.message : 'Something went wrong',
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
      title={<h2 className="text-3xl font-bold">Delete Employee</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onClose}
    >
      {employeeId && (
        <div className="w-full pt-3">
          <div className="w-full flex flex-col gap-y-6">
            <p className="text-base text-grey-medium">
              Are you sure you want to delete employee? This action cannot be
              undone.
            </p>
            <div className="flex gap-4 justify-between md:justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={handleDeleteEmployee}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
