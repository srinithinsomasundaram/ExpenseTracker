import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import "../Login.css";


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // If the authentication is successful, you can access the UID from userCredential.user.uid
      const uid = userCredential.user.uid;

      // Now, you can store the UID or use it as needed in your application.
      // For example, you might want to store it in the user's profile or in a global state.

      // Navigate to the home page
      navigate('/home');
    } catch (error) {
      console.error('Error logging in:', error.message);
      alert('Error logging in: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <h2 className='login-head'>Login</h2>
      <label className="login-label">Email: </label>
      <input type="text" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <br />
      <label className="login-label">Password: </label>
      <input type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br />
      <button className="login-button" onClick={handleLogin}>Login</button>
      <p className="signup-text">
        Don't have an account? <Link to="/signup" className="login-link">Signup</Link>
      </p>
    </div>
  );
};

export default Login;
