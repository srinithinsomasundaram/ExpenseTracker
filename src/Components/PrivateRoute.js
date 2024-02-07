// PrivateRoute.js
import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const PrivateRoute = ({ element: Element, ...rest }) => {
  const auth = getAuth();

  // Use state to track authentication status
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  // Check authentication status when the component mounts
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <Route
      {...rest}
      element={
        isAuthenticated === null ? (
          // Loading state, you might want to show a loader here
          <div>Loading...</div>
        ) : isAuthenticated ? (
          // Authenticated, render the specified component
          <Element />
        ) : (
          // Not authenticated, redirect to the login page
          <Navigate to="/" replace />
        )
      }
    />
  );
};

export default PrivateRoute;
