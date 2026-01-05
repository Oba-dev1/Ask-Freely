// src/hooks/useAdmin.js
import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../config/adminConfig';

/**
 * Hook to check if the current user has super admin access
 * Requires BOTH:
 * 1. Email in the whitelist (adminConfig.js)
 * 2. superAdmin: true flag in the database
 */
export function useAdmin() {
  const { currentUser, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Wait for auth to load
      if (authLoading) return;

      // No user = no admin access
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check 1: Is email in whitelist?
        const emailWhitelisted = isAdminEmail(currentUser.email);
        if (!emailWhitelisted) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check 2: Does user have superAdmin flag in database?
        const userRef = ref(database, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          const hasDatabaseFlag = userData.superAdmin === true;
          setIsAdmin(emailWhitelisted && hasDatabaseFlag);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError(err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [currentUser, authLoading]);

  return { isAdmin, loading, error };
}

export default useAdmin;
