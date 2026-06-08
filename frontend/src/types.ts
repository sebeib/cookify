export type User = {
  id: string;
  username: string;
  displayName: string;
  created: string;
  roleId: string;
};

export type LoginResponse = {
  sessionId: string;
  user: User;
};
