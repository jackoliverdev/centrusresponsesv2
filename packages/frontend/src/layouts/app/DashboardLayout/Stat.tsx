import { FunctionComponent, ReactNode, SVGProps } from "react";
import { Card } from "antd";

export type StatProps = {
  label: string;
  value: ReactNode;
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  loading: boolean;
};

export const Stat: FunctionComponent<StatProps> = ({
  label,
  value,
  loading,
  icon: Icon,
}) => {
  return (
    <Card className="p-3 sm:p-6" classNames={{ body: "!p-0" }} loading={loading}>
      <div className="flex gap-2 sm:gap-4">
        <div className="flex justify-center items-center rounded-full bg-secondary/10 size-8 md:size-12">
          <Icon className="size-4 md:size-6 text-primary/70" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-primary text-lg md:text-3xl font-bold truncate">
            {value}
          </div>
          <div className="text-neutral-600 text-xs md:text-base">{label}</div>
        </div>
      </div>
    </Card>
  );
};
