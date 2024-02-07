// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      {/* Left side: Expense Tracker */}
      <div className="left-section">
        <Link to="/home">Expense Tracker</Link>
      </div>

      {/* Right side: User Profile */}
      <div className="right-section">
        <Link to="/profile">User Profile</Link>
      </div>
    </div>
  );
};

export default Navbar;
