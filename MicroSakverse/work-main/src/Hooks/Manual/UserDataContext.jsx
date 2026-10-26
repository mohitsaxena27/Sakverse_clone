import { createContext, useContext } from "react";
import useUserData from "./UserData";

const UserDataContext = createContext(null);

export const UserDataProvider = ({ children }) => {
  const userData = useUserData();
  return (
    <UserDataContext.Provider value={userData}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserDataContext = () => {
  return useContext(UserDataContext);
};
