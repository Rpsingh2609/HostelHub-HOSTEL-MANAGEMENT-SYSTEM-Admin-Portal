import React, { useEffect, useState } from "react";
import { auth, realtimeDB } from "./firebase";
import { ref, get, push, set, update } from "firebase/database";
import { signOut } from "firebase/auth";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllStudents, setShowAllStudents] = useState(true);
  const [showAllComplaints, setShowAllComplaints] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHostels, setShowHostels] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaintsPerStudent, setComplaintsPerStudent] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    message: "",
    date: new Date().toISOString().split('T')[0],
    hostels: "All Hostels"
  });
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [availableFloors, setAvailableFloors] = useState([]);
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [newHostelForm, setNewHostelForm] = useState({
    name: "",
    floors: 5, // Default number of floors
    roomsPerFloor: 32 // Default rooms per floor
  });
  const [expandedStudents, setExpandedStudents] = useState({});

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
        // Reset other section states
        setShowAllStudents(true);
        setShowAllComplaints(false);
        setShowNotifications(false);
        setShowHostels(false);
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
        const complaintsCount = {};
        
        // Process all complaints from all students
        Object.entries(complaintsData).forEach(([userId, userComplaints]) => {
          let count = 0;
          
          // Validate object type first
          if (typeof userComplaints !== 'object' || userComplaints === null) {
            return; // Skip invalid data
          }
          
          Object.entries(userComplaints).forEach(([complaintId, complaintData]) => {
            // Skip the 'desc' object with character data pattern
            if (complaintId === 'desc' && complaintData.undefined && complaintData.undefined.complaintId === 'desc') {
              return;
            }
            
            // Check if complaintData is a valid complaint object
            if (typeof complaintData === 'object' && complaintData !== null) {
              // Handle direct complaint objects (no nested level)
              if (complaintData.desc !== undefined && complaintData.topic !== undefined) {
                allComplaintsArray.push({
                  userId,
                  complaintId,
                  nestedId: null,
                  ...complaintData
                });
                count++;
              } 
              // Handle nested complaint objects
              else {
                // Filter out non-complaint nested objects
                Object.entries(complaintData).forEach(([nestedId, nestedData]) => {
                  // Verify this is actually a complaint object with required fields
                  if (
                    typeof nestedData === 'object' && 
                    nestedData !== null &&
                    (nestedData.desc !== undefined || nestedData.topic !== undefined)
                  ) {
                    allComplaintsArray.push({
                      userId,
                      complaintId,
                      nestedId,
                      ...nestedData
                    });
                    count++;
                  }
                });
              }
            }
          });
          
          // Only add non-zero counts
          if (count > 0) {
            complaintsCount[userId] = count;
          }
        });
        
        setAllComplaints(allComplaintsArray);
        setComplaintsPerStudent(complaintsCount);
        // Reset other section states
        setShowAllStudents(false);
        setShowAllComplaints(true);
        setShowNotifications(false);
        setShowHostels(false);
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

  // Function to fetch all notifications
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const notificationsRef = ref(realtimeDB, 'Notification');
      const snapshot = await get(notificationsRef);
      
      if (snapshot.exists()) {
        const notificationsData = snapshot.val();
        const notificationsArray = Object.entries(notificationsData).map(([id, data]) => ({
          id,
          ...data
        }));
        notificationsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(notificationsArray);
        // Reset other section states
        setShowAllStudents(false);
        setShowAllComplaints(false);
        setShowNotifications(true);
        setShowHostels(false);
      } else {
        setError("No notifications found.");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Error fetching notifications.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle notification creation
  const handleCreateNotification = async () => {
    try {
      setLoading(true);
      const notificationsRef = ref(realtimeDB, 'Notification');
      const newNotificationRef = push(notificationsRef);
      
      const notificationData = {
        ...notificationForm,
        id: newNotificationRef.key
      };

      await set(newNotificationRef, notificationData);
      setShowNotificationModal(false);
      setNotificationForm({
        message: "",
        date: new Date().toISOString().split('T')[0],
        hostels: "All Hostels"
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      setError("Error creating notification.");
    } finally {
      setLoading(false);
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

  // Get student name by ID
  const getStudentById = (id) => {
    const student = allStudents.find(student => student.id === id);
    return student || { name: "Unknown Student", email: "N/A", number: "N/A" };
  };

  // Function to fetch all hostels
  const fetchAllHostels = async () => {
    try {
      setLoading(true);
      const hostelsRef = ref(realtimeDB, 'Hostel');
      const snapshot = await get(hostelsRef);
      
      if (snapshot.exists()) {
        const hostelsData = snapshot.val();
        const hostelsArray = Object.entries(hostelsData).map(([name, data]) => ({
          name,
          ...data
        }));
        setHostels(hostelsArray);
        // Reset other section states
        setShowAllStudents(false);
        setShowAllComplaints(false);
        setShowNotifications(false);
        setShowHostels(true);
      } else {
        setError("No hostels found.");
        setHostels([]);
      }
    } catch (error) {
      console.error("Error fetching hostels:", error);
      setError("Error fetching hostels data.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle hostel selection
  const handleHostelSelect = (hostelName) => {
    setSelectedHostel(hostelName);
    setSelectedFloor('');
    const hostel = hostels.find(h => h.name === hostelName);
    if (hostel) {
      setAvailableFloors(hostel.floors);
    } else {
      setAvailableFloors([]);
    }
  };

  // Function to handle new hostel creation
  const handleCreateHostel = async () => {
    try {
      setLoading(true);
      const hostelsRef = ref(realtimeDB, 'Hostel');
      
      // Create floors array with rooms
      const floors = Array.from({ length: newHostelForm.floors }, (_, floorIndex) => {
        const startRoomNo = floorIndex === 0 ? 1 : floorIndex * 100 + 1;
        const rooms = Array.from({ length: newHostelForm.roomsPerFloor }, (_, roomIndex) => ({
          roomNo: startRoomNo + roomIndex,
          occupied: false,
          sid: `S${String(startRoomNo + roomIndex).padStart(3, '0')}`
        }));
        return { room: rooms };
      });

      // Create hostel data structure
      const hostelData = {
        name: newHostelForm.name,
        floors: floors
      };

      // Add new hostel to database
      const newHostelRef = push(hostelsRef);
      await set(newHostelRef, hostelData);

      // Reset form and close modal
      setNewHostelForm({
        name: "",
        floors: 5,
        roomsPerFloor: 32
      });
      setShowHostelModal(false);

      // Refresh hostel list
      fetchAllHostels();
    } catch (error) {
      console.error("Error creating hostel:", error);
      setError("Error creating new hostel.");
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle complaint resolution status
  const toggleComplaintStatus = async (userId, complaintId, nestedId, currentStatus) => {
    try {
      setLoading(true);
      const updates = {};
      
      // Handle both nested and non-nested complaint structure
      if (nestedId) {
        // For nested complaint structure
        updates[`Complain/${userId}/${complaintId}/${nestedId}/resolved`] = !currentStatus;
      } else {
        // For direct complaint structure (no nested level)
        updates[`Complain/${userId}/${complaintId}/resolved`] = !currentStatus;
      }
      
      await update(ref(realtimeDB), updates);
      // Refresh complaints after update
      fetchAllComplaints();
    } catch (error) {
      console.error("Error toggling complaint status:", error);
      setError("Error updating complaint status.");
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle student's complaints visibility
  const toggleStudentComplaints = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#ffffff",
        zIndex: 9999
      }}>
        <div className="spinner-border text-primary" style={{width: "3rem", height: "3rem"}} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100vw",
      maxWidth: "100vw",
      margin: 0,
      padding: 0,
      backgroundColor: "#e6f2ff", /* Light blue background */
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: "auto"
    }}>
      {/* Fixed Header with Logout */}
      <header className="navbar navbar-expand-lg navbar-dark shadow" style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: "15px 0",
        backgroundColor: "#1a365d", /* Dark blue header */
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fs-3" style={{ fontWeight: "600" }}>
            <i className="bi bi-building-fill me-2"></i>
            HOSTEL-HUB
          </span>
          <button className="btn btn-outline-light" onClick={handleLogout} style={{ borderRadius: "6px" }}>
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </header>
      
      {/* Content Area */}
      <main style={{flex: 1, padding: "20px"}}>
        {/* Navigation Controls */}
        <div className="card shadow mb-4" style={{ borderRadius: "8px", overflow: "hidden", border: "none" }}>
          <div className="card-body d-flex justify-content-center gap-4 py-3" style={{ backgroundColor: "#fff" }}>
            <button 
              className={`btn btn-lg ${showAllStudents ? 'btn-primary' : 'btn-outline-primary'}`} 
              onClick={fetchAllStudents}
              style={{ 
                borderRadius: "8px", 
                boxShadow: showAllStudents ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
                backgroundColor: showAllStudents ? "#2c5282" : "transparent",
                borderColor: "#2c5282"
              }}
            >
              <i className="bi bi-people-fill me-2"></i>All Students
            </button>
            <button 
              className={`btn btn-lg ${showAllComplaints ? 'btn-primary' : 'btn-outline-primary'}`} 
              onClick={fetchAllComplaints}
              style={{ 
                borderRadius: "8px", 
                boxShadow: showAllComplaints ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
                backgroundColor: showAllComplaints ? "#2c5282" : "transparent",
                borderColor: "#2c5282"
              }}
            >
              <i className="bi bi-exclamation-circle-fill me-2"></i>All Complaints
            </button>
            <button 
              className={`btn btn-lg ${showNotifications ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={fetchAllNotifications}
              style={{ 
                borderRadius: "8px", 
                boxShadow: showNotifications ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
                backgroundColor: showNotifications ? "#2c5282" : "transparent",
                borderColor: "#2c5282"
              }}
            >
              <i className="bi bi-bell-fill me-2"></i>Notifications
            </button>
            <button 
              className={`btn btn-lg ${showHostels ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={fetchAllHostels}
              style={{ 
                borderRadius: "8px", 
                boxShadow: showHostels ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
                backgroundColor: showHostels ? "#2c5282" : "transparent",
                borderColor: "#2c5282"
              }}
            >
              <i className="bi bi-building-fill me-2"></i>Hostels
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="alert alert-warning mb-4" style={{ borderRadius: "8px" }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}
        
        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: "8px", overflow: "hidden" }}>
                <div className="modal-header" style={{ backgroundColor: "#1a365d", color: "white" }}>
                  <h5 className="modal-title">Create New Notification</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowNotificationModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                      placeholder="Enter notification message"
                      style={{ borderRadius: "6px" }}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={notificationForm.date}
                      onChange={(e) => setNotificationForm({...notificationForm, date: e.target.value})}
                      style={{ borderRadius: "6px" }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hostel</label>
                    <select 
                      className="form-select"
                      value={notificationForm.hostels}
                      onChange={(e) => setNotificationForm({...notificationForm, hostels: e.target.value})}
                      style={{ borderRadius: "6px" }}
                    >
                      <option value="All Hostels">All Hostels</option>
                      <option value="Boys Hostel">Boys Hostel</option>
                      <option value="Girls Hostel">Girls Hostel</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNotificationModal(false)} style={{ borderRadius: "6px" }}>Cancel</button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCreateNotification}
                    disabled={!notificationForm.message.trim()}
                    style={{ borderRadius: "6px", backgroundColor: "#2c5282", borderColor: "#2c5282" }}
                  >
                    Create Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <div className="mt-3">
          {showAllStudents && (
            <div className="card shadow" style={{ borderRadius: "8px", overflow: "hidden", border: "none" }}>
              <div className="card-header py-3" style={{ backgroundColor: "#1a365d", color: "white" }}>
                <h4 className="mb-0 ps-3"><i className="bi bi-people-fill me-2"></i>All Students</h4>
              </div>
              <div className="card-body p-0">
                {allStudents.length > 0 ? (
                  <div className="table-responsive" style={{minHeight: "60vh"}}>
                    <table className="table table-hover table-striped mb-0" style={{width: "100%"}}>
                      <thead style={{ backgroundColor: "#2c5282", color: "white" }}>
                        <tr>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Name</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Email</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Phone</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Department</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Degree</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Year</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Gender</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Hostel</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Room</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Parent Name</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Parent Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.map(student => (
                          <tr key={student.id}>
                            <td style={{padding: "15px 20px", fontSize: "15px", fontWeight: "500"}}>{student.name || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.email || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.number || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.department || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.degree || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.year || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.gender || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.hostelName || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.roomNo || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.parentName || "Not provided"}</td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>{student.parentNumber || "Not provided"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info m-4 fs-4">
                    <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                    No student records found. Please add students to the database.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {showAllComplaints && (
            <div className="card shadow" style={{ borderRadius: "8px", overflow: "hidden", border: "none" }}>
              <div className="card-header py-3" style={{ backgroundColor: "#1a365d", color: "white" }}>
                <h4 className="mb-0 ps-3"><i className="bi bi-exclamation-circle-fill me-2"></i>All Complaints</h4>
              </div>
              <div className="card-body p-0">
                {allComplaints.length > 0 ? (
                  <div className="table-responsive" style={{minHeight: "60vh"}}>
                  {Object.entries(complaintsPerStudent).map(([studentId, complaintCount]) => {
                    const student = getStudentById(studentId);
                    const studentComplaints = allComplaints.filter(complaint => complaint.userId === studentId);
                    const isExpanded = expandedStudents[studentId];

                    return (
                      <div key={studentId} className="border-bottom">
                        {/* Student Header */}
                        <div 
                          className="p-3 d-flex justify-content-between align-items-center cursor-pointer"
                          style={{ 
                            cursor: 'pointer', 
                            backgroundColor: isExpanded ? "#e6f2ff" : "#f8fafc" 
                          }}
                          onClick={() => toggleStudentComplaints(studentId)}
                        >
                          <div>
                            <h5 className="mb-0">
                              <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-2`}></i>
                              {student.name}
                            </h5>
                            <small className="text-muted">
                              {student.email} | {student.number} | {student.department || 'N/A'}
                            </small>
                          </div>
                          <span className="badge px-3 py-2 fs-5" style={{ backgroundColor: "#2c5282", color: "white" }}>
                            {complaintCount} {complaintCount === 1 ? 'Complaint' : 'Complaints'}
                          </span>
                        </div>

                        {/* Student's Complaints */}
                        {isExpanded && (
                          <div className="p-3">
                            <table className="table table-hover table-striped mb-0">
                            <thead style={{ backgroundColor: "#2c5282", color: "white" }}>
                              <tr>
                                <th style={{padding: "15px 20px", fontSize: "16px"}}>Topic</th>
                                <th style={{padding: "15px 20px", fontSize: "16px"}}>Description</th>
                                <th style={{padding: "15px 20px", fontSize: "16px"}}>Status</th>
                                <th style={{padding: "15px 20px", fontSize: "16px"}}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentComplaints.map(complaint => (
                                <tr key={complaint.nestedId ? `${complaint.complaintId}-${complaint.nestedId}` : complaint.complaintId}>
                                  <td style={{padding: "15px 20px", fontSize: "15px"}}>{complaint.topic || "No topic"}</td>
                                  <td style={{padding: "15px 20px", fontSize: "15px"}}>{complaint.desc || "No description"}</td>
                                  <td style={{padding: "15px 20px", fontSize: "15px"}}>
                                    <span className="badge px-3 py-2 fs-5" style={{
                                      backgroundColor: complaint.resolved ? '#4299e1' : '#f6ad55',
                                      color: 'white'
                                    }}>
                                      {complaint.resolved ? 'Resolved' : 'Pending'}
                                    </span>
                                  </td>
                                  <td style={{padding: "15px 20px", fontSize: "15px"}}>
                                    <button 
                                      className="btn btn-sm"
                                      style={{
                                        backgroundColor: complaint.resolved ? '#f6ad55' : '#4299e1',
                                        color: 'white',
                                        borderRadius: "6px"
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleComplaintStatus(complaint.userId, complaint.complaintId, complaint.nestedId, complaint.resolved);
                                      }}
                                    >
                                      {complaint.resolved ? 'Mark as Pending' : 'Mark as Resolved'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <div className="alert alert-info m-4 fs-4" style={{ borderRadius: "8px" }}>
                    <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                    No complaints found in the system.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {showNotifications && (
            <div className="card shadow" style={{ borderRadius: "8px", overflow: "hidden", border: "none" }}>
              <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1a365d", color: "white" }}>
                <h4 className="mb-0 ps-3">
                  <i className="bi bi-bell-fill me-2"></i>All Notifications
                </h4>
                <button 
                  className="btn btn-light me-3"
                  onClick={() => setShowNotificationModal(true)}
                  style={{ borderRadius: "6px" }}
                >
                  <i className="bi bi-plus-circle-fill me-2"></i>Create New Notification
                </button>
              </div>
              <div className="card-body p-0">
                {notifications.length > 0 ? (
                  <div className="table-responsive" style={{minHeight: "60vh"}}>
                    <table className="table table-hover table-striped mb-0" style={{width: "100%"}}>
                      <thead style={{ backgroundColor: "#2c5282", color: "white" }}>
                        <tr>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Date</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Hostel</th>
                          <th style={{padding: "15px 20px", fontSize: "16px"}}>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map(notification => (
                          <tr key={notification.id}>
                            <td style={{padding: "15px 20px", fontSize: "15px", fontWeight: "500"}}>
                              {new Date(notification.date).toLocaleDateString()}
                            </td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>
                              <span className="badge bg-info px-3 py-2">
                                {notification.hostels}
                              </span>
                            </td>
                            <td style={{padding: "15px 20px", fontSize: "15px"}}>
                              {notification.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info m-4 fs-4">
                    <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                    No notifications found in the system.
                    <button 
                      className="btn btn-primary ms-3"
                      onClick={() => setShowNotificationModal(true)}
                    >
                      <i className="bi bi-plus-circle-fill me-2"></i>Create First Notification
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hostels Section */}
          {showHostels && (
            <div className="card shadow" style={{ borderRadius: "8px", overflow: "hidden", border: "none" }}>
              <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1a365d", color: "white" }}>
                <h4 className="mb-0 ps-3">
                  <i className="bi bi-building-fill me-2"></i>Hostel Details
                </h4>
                <button 
                  className="btn btn-light me-3"
                  onClick={() => setShowHostelModal(true)}
                  style={{ borderRadius: "6px" }}
                >
                  <i className="bi bi-plus-circle-fill me-2"></i>Create New Hostel
                </button>
              </div>
              <div className="card-body p-0">
                {hostels.length > 0 ? (
                  <>
                    {/* Filters */}
                    <div className="p-3 border-bottom" style={{ backgroundColor: "#f8fafc" }}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Select Hostel</label>
                          <select 
                            className="form-select form-select-lg"
                            value={selectedHostel}
                            onChange={(e) => handleHostelSelect(e.target.value)}
                            style={{ borderRadius: "6px", border: "1px solid #e2e8f0" }}
                          >
                            <option value="">All Hostels</option>
                            {hostels.map(hostel => (
                              <option key={hostel.name} value={hostel.name}>
                                {hostel.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Select Floor</label>
                          <select 
                            className="form-select form-select-lg"
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                            disabled={!selectedHostel}
                            style={{ borderRadius: "6px", border: "1px solid #e2e8f0" }}
                          >
                            <option value="">All Floors</option>
                            {availableFloors.map((_, index) => (
                              <option key={index} value={index}>
                                Floor {index}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Hostel Display */}
                    {hostels
                      .filter(hostel => !selectedHostel || hostel.name === selectedHostel)
                      .map(hostel => (
                        <div key={hostel.name} className="mb-4">
                          <div className="p-3 border-bottom" style={{ backgroundColor: "#e6f2ff" }}>
                            <h5 className="mb-0" style={{ color: "#2c5282" }}>
                              <i className="bi bi-building me-2"></i>{hostel.name}
                            </h5>
                          </div>
                          <div className="p-3">
                            {hostel.floors
                              .filter((_, index) => !selectedFloor || index.toString() === selectedFloor)
                              .map((floor, floorIndex) => (
                                <div key={floorIndex} className="mb-4">
                                  <h6 className="mb-3" style={{ color: "#2c5282" }}>
                                    <i className="bi bi-layers me-2"></i>Floor {floorIndex}
                                  </h6>
                                  <div className="table-responsive">
                                    <table className="table table-hover table-bordered">
                                      <thead style={{ backgroundColor: "#2c5282", color: "white" }}>
                                        <tr>
                                          <th style={{padding: "12px 15px", fontSize: "15px"}}>Room No.</th>
                                          <th style={{padding: "12px 15px", fontSize: "15px"}}>Status</th>
                                          <th style={{padding: "12px 15px", fontSize: "15px"}}>Student ID</th>
                                          <th style={{padding: "12px 15px", fontSize: "15px"}}>Student Details</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {floor.room.map((room, roomIndex) => {
                                          const student = getStudentById(room.sid);
                                          return (
                                            <tr key={roomIndex}>
                                              <td style={{padding: "12px 15px"}}>{room.roomNo}</td>
                                              <td style={{padding: "12px 15px"}}>
                                                <span className="badge px-3 py-2" style={{
                                                  backgroundColor: room.occupied ? '#4299e1' : '#a0aec0',
                                                  color: 'white'
                                                }}>
                                                  {room.occupied ? 'Occupied' : 'Vacant'}
                                                </span>
                                              </td>
                                              <td style={{padding: "12px 15px"}}>
                                                {room.occupied ? (
                                                  <span style={{ color: "#2c5282", fontWeight: "500" }}>{room.sid}</span>
                                                ) : (
                                                  <span className="text-muted">-</span>
                                                )}
                                              </td>
                                              <td style={{padding: "12px 15px"}}>
                                                {room.occupied ? (
                                                  <div>
                                                    <div><strong>Name:</strong> {student.name}</div>
                                                    <div><strong>Department:</strong> {student.department || 'N/A'}</div>
                                                    <div><strong>Year:</strong> {student.year || 'N/A'}</div>
                                                  </div>
                                                ) : (
                                                  <span className="text-muted">-</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <div className="alert alert-info m-4 fs-4" style={{ borderRadius: "8px" }}>
                    <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                    No hostel information found in the system.
                    <button 
                      className="btn btn-primary ms-3"
                      onClick={() => setShowHostelModal(true)}
                      style={{ backgroundColor: "#2c5282", borderColor: "#2c5282", borderRadius: "6px" }}
                    >
                      <i className="bi bi-plus-circle-fill me-2"></i>Create First Hostel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Hostel Modal */}
      {showHostelModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "8px", overflow: "hidden" }}>
              <div className="modal-header" style={{ backgroundColor: "#1a365d", color: "white" }}>
                <h5 className="modal-title">Create New Hostel</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowHostelModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Hostel Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newHostelForm.name}
                    onChange={(e) => setNewHostelForm({...newHostelForm, name: e.target.value})}
                    placeholder="Enter hostel name"
                    style={{ borderRadius: "6px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Number of Floors</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newHostelForm.floors}
                    onChange={(e) => setNewHostelForm({...newHostelForm, floors: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                    style={{ borderRadius: "6px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Rooms per Floor</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newHostelForm.roomsPerFloor}
                    onChange={(e) => setNewHostelForm({...newHostelForm, roomsPerFloor: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                    style={{ borderRadius: "6px" }}
                  />
                </div>
                <div className="alert alert-info" style={{ borderRadius: "6px" }}>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  This will create a hostel with {newHostelForm.floors} floors and {newHostelForm.roomsPerFloor} rooms per floor.
                  Total rooms: {newHostelForm.floors * newHostelForm.roomsPerFloor}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowHostelModal(false)} style={{ borderRadius: "6px" }}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleCreateHostel}
                  disabled={!newHostelForm.name.trim()}
                  style={{ borderRadius: "6px", backgroundColor: "#2c5282", borderColor: "#2c5282" }}
                >
                  Create Hostel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 