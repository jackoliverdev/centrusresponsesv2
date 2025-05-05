import { Loader } from '@/components/ui/loader';
import { useInterval } from '@/hooks/useInterval';
import { FunctionComponent, useState } from 'react';
import { twMerge } from 'tailwind-merge';

const messages = [
  'Understanding your query',
  'Searching your companies information',
  'Piecing together information',
  'Generating response',
];
export type ChatMessageLoaderProps = {
  className?: string;
};

export const ChatMessageLoader: FunctionComponent<
  ChatMessageLoaderProps
> = ({ className }) => {
  const [index, setIndex] = useState(0);

  useInterval(() => {
    setIndex((i) => Math.min(i + 1, messages.length - 1));
  }, 2500);

  return (
    <div
      className={twMerge(
        'bg-blue-100 p-3 rounded-lg w-fit flex items-center gap-2',
        'mr-auto bg-white border',
        className,
      )}
      data-id="temp-chat-loader"
    >
      <Loader className="size-4" />
      <div>{messages[index]}...</div>
    </div>
  );
};
