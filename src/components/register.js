import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log(user);
      console.log("came");
      // if (user) {
        // await setDoc(doc(db, "Users", user.uid), {
        //   email: user.email,
        //   firstName: fname,
        //   lastName: lname,
        //   photo:""
        // });
      // }
      console.log("User Registered Successfully!!");
      toast.success("User Registered Successfully!!", {
        position: "top-center",
      });
      window.location.href = "/profile";
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'auto',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#2c5282', /* Medium blue background color */
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '2rem',
        backgroundColor: '#1a365d', /* Dark blue for the registration form */
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          fontWeight: 600,
          color: 'white'
        }}>
          HOSTEL HUB
        </h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            padding: '0.5rem 1rem',
            color: '#cbd5e0',
            cursor: 'pointer',
          }} onClick={() => window.location.href = '/login'}>
            Log In
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            borderBottom: '2px solid #4299e1',
            color: '#4299e1',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Sign Up
          </div>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: 'white'
            }}>
              First name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter first name"
              onChange={(e) => setFname(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #2d4a73',
                backgroundColor: '#2d4a73',
                color: 'white',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="mb-3">
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: 'white'
            }}>
              Last name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter last name"
              onChange={(e) => setLname(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #2d4a73',
                backgroundColor: '#2d4a73',
                color: 'white',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="mb-3">
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: 'white'
            }}>
              Email address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #2d4a73',
                backgroundColor: '#2d4a73',
                color: 'white',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="mb-4">
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: 'white'
            }}>
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #2d4a73',
                backgroundColor: '#2d4a73',
                color: 'white',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="d-grid mt-4">
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: '#4299e1',
                border: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                width: '100%'
              }}
            >
              Create Account
            </button>
          </div>
          
          <p style={{ 
            textAlign: 'center', 
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: '#cbd5e0'
          }}>
            Already have an account? <a href="/login" style={{ color: '#4299e1', textDecoration: 'none', fontWeight: 500 }}>Log In</a>
          </p>
        </form>
      </div>
    </div>
  );
}
export default Register;