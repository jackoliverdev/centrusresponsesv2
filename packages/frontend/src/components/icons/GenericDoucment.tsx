import { FunctionComponent, HTMLProps } from 'react';

export type GenericDocumentProps = HTMLProps<SVGSVGElement>;

export const GenericDocument: FunctionComponent<GenericDocumentProps> = (
  props,
) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_126_13180)">
        <rect width="24" height="24" rx="3" fill="white" fillOpacity="0.01" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 4H8C7.46957 4 6.96086 4.21071 6.58579 4.58579C6.21071 4.96086 6 5.46957 6 6V18C6 18.5304 6.21071 19.0391 6.58579 19.4142C6.96086 19.7893 7.46957 20 8 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V11.005H16V18H8V6H12V8C12 8.53043 12.2107 9.03914 12.5858 9.41421C12.9609 9.78929 13.4696 10 14 10H17.5C17.6326 10 17.7598 9.94732 17.8536 9.85355C17.9473 9.75979 18 9.63261 18 9.5V8.213C18 8.08114 17.9479 7.95462 17.855 7.861L14.61 4.59C14.4239 4.40283 14.2027 4.25434 13.959 4.15308C13.7153 4.05182 13.4539 3.99979 13.19 4H12ZM3 0H21C21.7956 0 22.5587 0.31607 23.1213 0.87868C23.6839 1.44129 24 2.20435 24 3V21C24 21.7956 23.6839 22.5587 23.1213 23.1213C22.5587 23.6839 21.7956 24 21 24H3C2.20435 24 1.44129 23.6839 0.87868 23.1213C0.31607 22.5587 0 21.7956 0 21L0 3C0 2.20435 0.31607 1.44129 0.87868 0.87868C1.44129 0.31607 2.20435 0 3 0V0Z"
          fill="#5E6C84"
        />
      </g>
      <defs>
        <clipPath id="clip0_126_13180">
          <rect width="24" height="24" rx="3" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
