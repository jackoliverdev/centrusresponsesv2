import { Tag, TagProps } from "antd";
import { PresetColors } from "antd/lib/theme/internal";
import { FunctionComponent } from "react";
import { twMerge } from "tailwind-merge";
import { TagItemData } from 'common';

export type DataAccessTagProps = TagProps & {
  children?: string;
  tag?: Omit<TagItemData, "id">;
};

const hashFunction = (value: string = "") => {
  let hash = 0,
    i,
    chr;
  if (value.length === 0) return hash;
  for (i = 0; i < value.length; i++) {
    chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
};
export const DataAccessTag: FunctionComponent<DataAccessTagProps> = ({
  children,
  tag,
  className,
  ...props
}) => {
  const color = PresetColors[hashFunction(children) % PresetColors.length];
  return tag ? (
    <Tag
      bordered={false}
      className={twMerge("text-base inline-flex items-center py-0 leading-tight h-7 min-h-0 max-h-7 px-2", className)}
      color={tag.backgroundColor}
      style={{
        color: tag.textColor,
        backgroundColor: tag.backgroundColor,
        fontSize: "inherit",
        lineHeight: 1.2,
        height: '28px',
        minHeight: '0',
        maxHeight: '28px',
        paddingTop: 0,
        paddingBottom: 0,
        display: 'inline-flex',
        alignItems: 'center',
      }}
      {...props}
    >
      {tag.name}
    </Tag>
  ) : (
    <Tag
      bordered={false}
      className={twMerge("text-base inline-flex items-center py-0 leading-tight h-auto", className)}
      color={color}
      style={{
        fontSize: "inherit",
        lineHeight: 1,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
};
