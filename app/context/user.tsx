import { createContext, ReactNode, useContext } from "react";

interface User {
  id: string;
  displayname: string;
  email: string;
  profilepictureurl: string;
  discorduserid: string;
}
const UserContext = createContext<User>(null!);

export default function UserProvider(props: {
  user: User;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={props.user}>
      {props.children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error("UserProvider not found");
  }
  return userContext;
}
