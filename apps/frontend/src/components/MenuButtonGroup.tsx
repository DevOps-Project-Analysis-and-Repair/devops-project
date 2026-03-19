import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

export interface MenuButtonItem {
  id: string;
  label: number;
};

export interface MenuButtonGroupProps {
  items: ReadonlyArray<MenuButtonItem>;
  onItemClick: (id: string) => void;
}

export function MenuButtonGroup({ items, onItemClick }: Readonly<MenuButtonGroupProps>) {
  return (
    <ButtonGroup variant="outlined">
      {items.map((item) => (
        <Button key={item.id} onClick={() => onItemClick(item.id)}>
          {item.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
