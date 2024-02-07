import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Navbar from './pagecomp/Navabar';

const Home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If the user is authenticated, set the user state with the user object
        setUser(user);
      }
    });

    // Cleanup function to unsubscribe from the auth state changes when the component unmounts.
    return () => unsubscribe();
  }, []);

  return (
    <div>
   
    </div>
  );
};

export default Home;
