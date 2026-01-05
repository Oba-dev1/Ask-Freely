// src/Components/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

/**
 * Protected route for super admin access
 * Requires user to be authenticated AND have super admin privileges
 */
function AdminProtectedRoute({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Show loading state while checking auth and admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  // User is authenticated and has admin access
  return children;
}

export default AdminProtectedRoute;
