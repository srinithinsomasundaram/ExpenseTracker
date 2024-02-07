  import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
  import { app } from '../Firebase'; // Import your Firebase configuration
  import "../Signup.css";


  const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Use the useNavigate hook to get the navigation function

    const handleSignup = async () => {
      try {
        const auth = getAuth(app); // Pass the app instance to getAuth
        const response = await createUserWithEmailAndPassword(auth, email, password);

        // After successful signup, navigate to the home page
        navigate('/home');
      } catch (error) {
        alert('Error creating user:', error.message);
      }
    };

    return (
      <div className="signup-container">
        <h2 className="signup-heading">Signup</h2>
        <label className="signup-label">Email: </label>
        <input type="text" className="signup-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <label className="signup-label">Password: </label>
        <input type="password" className="signup-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button className="signup-button" onClick={handleSignup}>Signup</button>
        <p className="signup-text">
          Already have an account? <Link to="/" className="signup-link">Login</Link>
        </p>
      </div>
    );
  };

  export default Signup;
