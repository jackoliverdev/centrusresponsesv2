import { FunctionComponent, useState } from "react";
import { PlusOutlined } from "@ant-design/icons/lib";
import { Button } from "@/components/ui/button";
import { AddEmployee } from ".";

type Props = {};

export const AddEmployeeButton: FunctionComponent<Props> = ({}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="gap-x-2 pl-3"
        onClick={() => setIsOpen(true)}
      >
        <PlusOutlined className="w-4 h-auto" />
        Add new employee
      </Button>

      <AddEmployee isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
