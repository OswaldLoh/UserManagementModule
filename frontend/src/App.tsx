import { useState, useEffect } from 'react';
import axios from 'axios';

// TypeScript definitions for your data
interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  role: { name: string };
}

export default function App() {
  // 1. STATE MANAGEMENT
  const [activeRole, setActiveRole] = useState<string>('Admin'); // Mock Auth State
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 2. DATA FETCHING (Runs every time activeRole changes)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: { 'x-actor-role': activeRole }
        });
        setUsers(response.data);
      } catch (err: any) {
        // Handle the 403 Forbidden error we set up in the backend
        setError(err.response?.data?.error || 'Failed to fetch users');
        setUsers([]); // Clear list on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeRole]); // The dependency array: triggers the effect when activeRole updates

  // 3. UI RENDERING
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>User Access Management</h1>
      
      {/* Mock Authentication Selector */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Simulate Role:</label>
        <select 
          value={activeRole} 
          onChange={(e) => setActiveRole(e.target.value)}
          style={{ padding: '5px' }}
        >
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Viewer">Viewer</option>
          <option value="Hacker">Unauthorized User (Test 403)</option>
        </select>
      </div>

      {/* State Feedback */}
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {/* User Data Table */}
      {!loading && !error && users.length > 0 && (
        <table border={1} cellPadding={10} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#ddd' }}>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td>{user.role.name}</td>
                <td>
                  <span style={{ 
                    color: user.status === 'ACTIVE' ? 'green' : user.status === 'INACTIVE' ? 'red' : 'orange' 
                  }}>
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}