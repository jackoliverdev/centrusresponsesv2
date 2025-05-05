import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
  isThisWeek,
} from "date-fns";
import {
  FunctionComponent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import debounce from "lodash/debounce";

type Props = {
  date: string;
  containerRef?: RefObject<HTMLDivElement>;
  messageCount: number;
};

export const ChatsCurrentDate: FunctionComponent<Props> = ({
  date,
  containerRef,
  messageCount,
}) => {
  const stickyRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const displayDate = useMemo(() => {
    const messageDate = new Date(date);
    const daysAgo = differenceInDays(new Date(), messageDate);
    let formattedDate = format(messageDate, "EEE, d MMM");

    if (isToday(messageDate)) {
      formattedDate = "Today";
    } else if (isYesterday(messageDate)) {
      formattedDate = "Yesterday";
    } else if (isThisWeek(messageDate) && daysAgo < 7) {
      formattedDate = format(messageDate, "EEEE");
    }

    return formattedDate;
  }, [date]);

  useEffect(() => {
    const parent = containerRef?.current;
    const sticky = stickyRef?.current;

    if (!parent || !sticky || messageCount < 3) return;

    const observeParentEl = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(entry.isIntersecting && entry.intersectionRatio === 1);
      },
      { threshold: [1], root: parent },
    );

    observeParentEl.observe(sticky);

    const debounceReset = debounce(() => {
      setIsScrolling(false);
    }, 1000);

    const handleScroll = () => {
      setIsScrolling(true);
      debounceReset();
    };

    parent.scrollTo({
      top: parent.scrollHeight,
      behavior: "instant",
    });

    debounce(() => {
      parent.addEventListener("scroll", handleScroll);
    }, 100)();

    return () => {
      observeParentEl.disconnect();
      parent.removeEventListener("scroll", handleScroll);
      debounceReset.cancel();
    };
  }, [containerRef, displayDate, messageCount]);

  // Only render if there are at least 3 messages
  if (messageCount < 3) return null;

  return (
    <div
      ref={stickyRef}
      className={twMerge(
        "sticky inset-x-0 -top-px pt-4 flex justify-center z-[100] transition-all duration-150 pointer-events-none",
        isSticky || isScrolling ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="bg-gray-400/90 px-2 py-0.5 rounded-full text-white shadow-md font-medium"
        style={{ fontSize: "12px" }}
      >
        {displayDate}
      </div>
    </div>
  );
};
