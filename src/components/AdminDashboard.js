import React, { useEffect, useState } from "react";
import { auth, realtimeDB } from "./firebase";
import { ref, get, update } from "firebase/database";
import { signOut } from "firebase/auth";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllStudents, setShowAllStudents] = useState(true);
  const [showAllComplaints, setShowAllComplaints] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged(async (admin) => {
      console.log("Auth state changed:", admin);
      
      if (!admin) {
        console.log("No admin logged in");
        setLoading(false);
        window.location.href = "/login";
        return;
      }
      
      // Fetch all students data by default
      fetchAllStudents();
    });
    
    return () => unsubscribe();
  }, []);

  // Function to fetch all students
  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const studentsRef = ref(realtimeDB, 'Student');
      const snapshot = await get(studentsRef);
      
      if (snapshot.exists()) {
        const studentsData = snapshot.val();
        const studentsArray = Object.entries(studentsData).map(([id, data]) => ({
          id,
          ...data
        }));
        setAllStudents(studentsArray);
        setShowAllStudents(true);
        setShowAllComplaints(false);
      } else {
        setError("No students found in the database.");
        setAllStudents([]);
      }
    } catch (error) {
      console.error("Error fetching all students:", error);
      setError("Error fetching students data.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all complaints
  const fetchAllComplaints = async () => {
    try {
      setLoading(true);
      const complaintsRef = ref(realtimeDB, 'Complain');
      const snapshot = await get(complaintsRef);
      
      if (snapshot.exists()) {
        const complaintsData = snapshot.val();
        const allComplaintsArray = [];
        
        // Process all complaints from all students
        Object.entries(complaintsData).forEach(([userId, userComplaints]) => {
          Object.entries(userComplaints).forEach(([complaintId, complaintData]) => {
            if (typeof complaintData === 'object' && complaintData !== null) {
              Object.entries(complaintData).forEach(([nestedId, nestedData]) => {
                allComplaintsArray.push({
                  userId,
                  complaintId: nestedId,
                  ...nestedData
                });
              });
            }
          });
        });
        
        setAllComplaints(allComplaintsArray);
        setShowAllComplaints(true);
        setShowAllStudents(false);
      } else {
        setError("No complaints found in the database.");
        setAllComplaints([]);
      }
    } catch (error) {
      console.error("Error fetching all complaints:", error);
      setError("Error fetching complaints data.");
    } finally {
      setLoading(false);
    }
  };

  // Function to resolve a complaint
  const resolveComplaint = async (userId, complaintId) => {
    try {
      const complaintRef = ref(realtimeDB, `Complain/${userId}/${complaintId}`);
      await update(complaintRef, {
        resolved: true
      });
      
      // Refresh complaints list
      fetchAllComplaints();
    } catch (error) {
      console.error("Error resolving complaint:", error);
      setError("Error resolving complaint. Please try again.");
    }
  };

  async function handleLogout() {
    try {
      await signOut(auth);
      window.location.href = "/login";
      console.log("Admin logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  }

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <div className="container-fluid mt-4 bg-red-500">
      {/* Header with Logout */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Admin Dashboard</h2>
              <div>
                <button className="btn btn-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body d-flex justify-content-center gap-4">
              <button 
                className={`btn btn-lg ${showAllStudents ? 'btn-primary' : 'btn-outline-primary'}`} 
                onClick={fetchAllStudents}
              >
                <i className="bi bi-people-fill me-2"></i>All Students
              </button>
              <button 
                className={`btn btn-lg ${showAllComplaints ? 'btn-primary' : 'btn-outline-primary'}`} 
                onClick={fetchAllComplaints}
              >
                <i className="bi bi-exclamation-circle-fill me-2"></i>All Complaints
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          </div>
        </div>
      )}
      
      {/* All Students View */}
      {showAllStudents && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">All Students</h3>
              </div>
              <div className="card-body">
                {allStudents.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Department</th>
                          <th>Degree</th>
                          <th>Year</th>
                          <th>Gender</th>
                          <th>Hostel</th>
                          <th>Room</th>
                          <th>Parent Name</th>
                          <th>Parent Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.map(student => (
                          <tr key={student.id}>
                            <td>{student.name || "Not provided"}</td>
                            <td>{student.email || "Not provided"}</td>
                            <td>{student.number || "Not provided"}</td>
                            <td>{student.department || "Not provided"}</td>
                            <td>{student.degree || "Not provided"}</td>
                            <td>{student.year || "Not provided"}</td>
                            <td>{student.gender || "Not provided"}</td>
                            <td>{student.hostelName || "Not provided"}</td>
                            <td>{student.roomNo || "Not provided"}</td>
                            <td>{student.parentName || "Not provided"}</td>
                            <td>{student.parentNumber || "Not provided"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>No student records found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* All Complaints View */}
      {showAllComplaints && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">All Complaints</h3>
              </div>
              <div className="card-body">
                {allComplaints.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Topic</th>
                          <th>Description</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allComplaints.map(complaint => (
                          <tr key={`${complaint.userId}-${complaint.complaintId}`}>
                            <td>{complaint.topic}</td>
                            <td>{complaint.desc}</td>
                            <td>{complaint.name}</td>
                            <td>{complaint.number}</td>
                            <td>
                              <span className={`badge ${complaint.resolved ? 'bg-success' : 'bg-warning'}`}>
                                {complaint.resolved ? 'Resolved' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              {!complaint.resolved && (
                                <button 
                                  className="btn btn-success btn-sm"
                                  onClick={() => resolveComplaint(complaint.userId, complaint.complaintId)}
                                >
                                  <i className="bi bi-check-circle me-1"></i>Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center mb-0">No complaints found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 