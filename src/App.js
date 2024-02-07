// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Components/Login';
import Signup from './Components/Signup';
import Home from './Components/ExpenseTracker';
import { UserAuthContextProvider } from './Components/UserAuthContext';

// Simple authentication check
const isAuthenticated = () => {
  // Implement your authentication logic here
  // For demonstration purposes, always return true
  return true;
};

const ProtectedRoute = ({ element, path }) => {
  return isAuthenticated() ? (
    element
  ) : (
    <Navigate to="/" replace state={{ from: path }} />
  );
};

const App = () => {
  return (
    
    <Router>
      <div>
      <UserAuthContextProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/home"
            element={<ProtectedRoute element={<Home />} path="/home" />}
          />
        </Routes>
        </UserAuthContextProvider>
      </div>
    </Router>
  );
};

export default App;
