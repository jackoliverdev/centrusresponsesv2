import { FunctionComponent } from 'react';

export type TextDocumentProps = object;

export const TextDocument: FunctionComponent<TextDocumentProps> = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_126_13177)">
        <rect width="24" height="24" rx="3" fill="white" fillOpacity="0.01" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 0H21C21.7956 0 22.5587 0.31607 23.1213 0.87868C23.6839 1.44129 24 2.20435 24 3V21C24 21.7956 23.6839 22.5587 23.1213 23.1213C22.5587 23.6839 21.7956 24 21 24H3C2.20435 24 1.44129 23.6839 0.87868 23.1213C0.31607 22.5587 0 21.7956 0 21L0 3C0 2.20435 0.31607 1.44129 0.87868 0.87868C1.44129 0.31607 2.20435 0 3 0V0ZM4 18C4 18.556 4.446 19 4.995 19H13.005C13.545 19 14 18.552 14 18C14 17.444 13.554 17 13.005 17H4.995C4.455 17 4 17.448 4 18ZM4 14C4 14.556 4.448 15 5 15H19C19.555 15 20 14.552 20 14C20 13.444 19.552 13 19 13H5C4.445 13 4 13.448 4 14ZM4 10C4 10.556 4.448 11 5 11H19C19.555 11 20 10.552 20 10C20 9.444 19.552 9 19 9H5C4.445 9 4 9.448 4 10ZM4 6C4 6.556 4.448 7 5 7H19C19.555 7 20 6.552 20 6C20 5.444 19.552 5 19 5H5C4.445 5 4 5.448 4 6Z"
          fill="#2684FF"
        />
      </g>
      <defs>
        <clipPath id="clip0_126_13177">
          <rect width="24" height="24" rx="3" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
