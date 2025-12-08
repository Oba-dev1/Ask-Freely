// src/Components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireProfileComplete = true }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Show nothing while loading auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If profile completion is required and not completed, redirect to profile setup
  if (requireProfileComplete && userProfile && !userProfile.profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  // User is authenticated and (if required) has completed profile
  return children;
}

export default ProtectedRoute;
