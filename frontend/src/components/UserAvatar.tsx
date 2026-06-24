import { Avatar } from "@mantine/core";

type UserAvatarProps = {
  displayName: string | null | undefined;
  image: string | null | undefined;
  size?: number;
};

export function UserAvatar({ displayName, image, size = 40 }: UserAvatarProps) {
  const fallback = displayName?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Avatar
      src={image || undefined}
      alt={displayName || "Profilbild"}
      radius="xl"
      size={size}
      color="sage"
      variant="light"
    >
      {fallback}
    </Avatar>
  );
}
