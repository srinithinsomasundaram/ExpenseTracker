import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, set as setDatabase } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserAuth } from './UserAuthContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';


const Profile = () => {
  const { user } = useUserAuth();
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uid}`);

        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
            setImageURL(data.profileImageURL || null);
            setUserName(data.userName || '');
            setMobileNumber(data.mobileNumber || '');
          } else {
            setUserData(null);
          }
        });
      }
    };

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmailAddress(user.email || ''); // Automatically fetch user email
      }
    });

    fetchUserData();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
  };

  const handleImageUpload = async () => {
    if (profileImage && user) {
      const storage = getStorage();
      const storageRefUser = storageRef(storage, `users/${user.uid}/profileImage/${profileImage.name}`);
      
      await uploadBytes(storageRefUser, profileImage);
      const downloadURL = await getDownloadURL(storageRefUser);

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await setDatabase(userRef, {
        ...userData,
        profileImageURL: downloadURL,
      });

      setImageURL(downloadURL);
      setProfileImage(null);
    }
  };

  const handleSaveChanges = async () => {
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await setDatabase(userRef, {
        ...userData,
        userName,
        mobileNumber,
        emailAddress,
      });
    }
  };

  return (
    <div>
      <div className="profile-container">
        {userData ? (
          <>
            <h2>Welcome, {userName || 'User'}!</h2>
            <p>Email: {emailAddress}</p>
            <p>Mobile Number: {mobileNumber}</p>
            {user && <p>Your UID: {user.uid}</p>}
            {imageURL && <img src={imageURL} alt="Profile" className="profile-image" />}
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button onClick={handleImageUpload}>Upload Profile Image</button>
            <div>
              <label>
                Name:
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
              </label>
            </div>
            <div>
              <label>
                Mobile Number:
                <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
              </label>
            </div>
            <button onClick={handleSaveChanges}>Save Changes</button>
          </>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
