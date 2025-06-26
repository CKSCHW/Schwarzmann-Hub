
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { SimpleUser } from '@/types';
import { adminDb } from '@/lib/firebase-admin';

interface AuthContextType {
  user: User | null;
  fullUser: SimpleUser | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  fullUser: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fullUser, setFullUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        const userIsAdmin = idTokenResult.claims.role === 'admin';
        setIsAdmin(userIsAdmin);

        // This is a client-side fetch for the profile data
        // For server components, use `getCurrentUser` from `firebase-admin`
        try {
            const res = await fetch(`/api/user-profile/${user.uid}`);
            if(res.ok) {
                const profileData = await res.json();
                setFullUser({
                    ...fullUser,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    isAdmin: userIsAdmin,
                    groups: (idTokenResult.claims.groups as any[]) || [],
                    ...profileData
                });
            } else {
                 // Fallback if profile doesn't exist yet
                setFullUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    isAdmin: userIsAdmin,
                    groups: (idTokenResult.claims.groups as any[]) || [],
                });
            }
        } catch (e) {
            console.error("Could not fetch client-side user profile", e);
        }

      } else {
        setUser(null);
        setFullUser(null);
        setIsAdmin(false);
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

  const value = { user, fullUser, loading, isAdmin, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// This new API route is needed to fetch profile data on the client
// I will create `/src/app/api/user-profile/[uid]/route.ts`
// The content will be:
/*
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const uid = params.uid;
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json(userDoc.data());
  } catch (error) {
    console.error('API Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
*/
// Also need an API route to log out / clear cookie
// /src/app/api/auth/logout/route.ts
/*
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const options = {
    name: '__session',
    value: '',
    maxAge: -1, // Expire the cookie immediately
  };

  cookies().set(options);
  return NextResponse.json({ status: 'success' }, { status: 200 });
}
*/
