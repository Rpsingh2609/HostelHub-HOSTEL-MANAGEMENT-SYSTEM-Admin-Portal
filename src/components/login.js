import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in Successfully");
      window.location.href = "/profile";
      toast.success("User logged in Successfully", {
        position: "top-center",
      });
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
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Left side - Image */}
      <div style={{
        flex: '1.25',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff'
      }}>
        <img 
          src="/Hostel.png" 
          alt="Hostel" 
          style={{
            width: 'auto',
            height: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      </div>
      
      {/* Right side - Login Form */}
      <div style={{
        flex: '1',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a365d',
        color: 'white',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
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
              borderBottom: '2px solid #4299e1',
              color: '#4299e1',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Log In
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              color: '#cbd5e0',
              cursor: 'pointer',
            }} onClick={() => window.location.href = '/register'}>
              Sign Up
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  color: 'white'
                }}>
                  Password
                </label>
                <a href="#" style={{ 
                  fontSize: '0.8rem',
                  color: '#4299e1',
                  textDecoration: 'none'
                }}>
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                Log In
              </button>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <SignInwithGoogle/>
            </div>
            
            <p style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              fontSize: '0.9rem',
              color: '#cbd5e0'
            }}>
              New to HOSTEL HUB? <a href="/register" style={{ color: '#4299e1', textDecoration: 'none', fontWeight: 500 }}>Create Account</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;