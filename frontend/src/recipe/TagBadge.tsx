import { Badge } from "@mantine/core";
import type { Tag } from "../types";
import { getPastelTagColor } from "./tagColor";

type TagLike = Pick<Tag, "name" | "color">;

type TagBadgeProps = {
  tag: TagLike;
  onClick?: () => void;
};

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  const displayColor = getPastelTagColor(tag.name);

  return (
    <Badge
      radius="xl"
      variant="light"
      className="recipe-tag-badge"
      onClick={(event) => {
        if (!onClick) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      onMouseDown={(event) => {
        if (!onClick) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }
      }}
      styles={{
        root: {
          backgroundColor: displayColor,
          border: `1px solid ${displayColor}`,
          color: "#334047",
          cursor: onClick ? "pointer" : "default",
        },
      }}
    >
      {tag.name}
    </Badge>
  );
}
