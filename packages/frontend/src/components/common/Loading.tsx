import { FunctionComponent } from "react";
import { Loader2 } from "lucide-react";
import classNames from "classnames";

type Props = {
  className?: string;
  label?: boolean;
};

export const Loading: FunctionComponent<Props> = ({
  className = "",
  label = true,
}) => {
  return (
    <div
      className={classNames(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <Loader2 className="size-12 animate-spin text-primary" />
      {label && (
        <p className="text-xl font-medium animate-pulse text-foreground">
          Loading...
        </p>
      )}
    </div>
  );
};
