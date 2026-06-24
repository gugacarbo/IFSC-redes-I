import { Text } from "ink";

interface ListItem {
  label: string;
  isSelected?: boolean;
}

interface ListProps {
  items: ListItem[];
  getItemKey?: (item: ListItem, index: number) => string;
}

export function List({ items, getItemKey }: ListProps) {
  return (
    <>
      {items.map((item, index) => (
        <Text key={getItemKey?.(item, index) ?? index} color={item.isSelected ? "green" : undefined}>
          {item.isSelected ? "> " : "  "}{item.label}
        </Text>
      ))}
    </>
  );
}
