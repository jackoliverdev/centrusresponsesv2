import { Button } from "antd";
import {
  FunctionComponent,
  PropsWithRef,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ChevronDownIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  containerRef: RefObject<HTMLDivElement>;
};

const ScrollToBottomButton: FunctionComponent<PropsWithRef<Props>> = ({
  className,
  containerRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const nearBottom = scrollTop + clientHeight < scrollHeight - 100;
      setIsVisible(nearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return (
    <div
      className={twMerge(
        "absolute transition-all duration-200 z-50",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className,
      )}
    >
      <Button
        size="large"
        variant="filled"
        shape="circle"
        className="shadow-md"
        icon={<ChevronDownIcon className="h-5 w-5 text-gray-600" />}
        onClick={scrollToBottom}
      />
    </div>
  );
};

export { ScrollToBottomButton };
