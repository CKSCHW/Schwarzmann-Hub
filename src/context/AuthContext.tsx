
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { SimpleUser, UserGroup } from '@/types';

interface AuthContextType {
  user: User | null;
  fullUser: SimpleUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSurveyManager: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  fullUser: null,
  loading: true,
  isAdmin: false,
  isSurveyManager: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fullUser, setFullUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSurveyManager, setIsSurveyManager] = useState(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const idTokenResult = await user.getIdTokenResult(true);
        const claims = idTokenResult.claims;
        
        const userIsAdmin = claims.role === 'admin';
        const userGroups = (claims.groups as UserGroup[]) || [];
        const userIsSurveyManager = userIsAdmin || userGroups.includes('Projektleiter') || userGroups.includes('Schulungsleiter');
        
        setIsAdmin(userIsAdmin);
        setIsSurveyManager(userIsSurveyManager);

        try {
            const res = await fetch(`/api/user-profile/${user.uid}`);
            const profileData = res.ok ? await res.json() : {};
            
            setFullUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAdmin: userIsAdmin,
                groups: userGroups,
                ...profileData
            });
        } catch (e) {
            console.error("Could not fetch client-side user profile", e);
             setFullUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAdmin: userIsAdmin,
                groups: userGroups,
            });
        }

      } else {
        setUser(null);
        setFullUser(null);
        setIsAdmin(false);
        setIsSurveyManager(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    // Clear the session cookie by making a POST request to an API route
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  const value = { user, fullUser, loading, isAdmin, isSurveyManager, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
