// UserAuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../Firebase';

const UserAuthContext = createContext();

export const UserAuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return <UserAuthContext.Provider value={{ user }}>{children}</UserAuthContext.Provider>;
};

export const useUserAuth = () => useContext(UserAuthContext);
