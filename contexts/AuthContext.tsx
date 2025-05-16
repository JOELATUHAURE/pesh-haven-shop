import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';
import { Profile } from '@/types/supabase';

interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isWholesale: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAdmin: false,
  isWholesale: false,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAdmin = user?.user_type === 'admin';
  const isWholesale = user?.user_type === 'wholesale';

  const refreshUser = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await getUserProfile(session.user.id);
      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        getUserProfile(session.user.id)
          .then(({ data, error }) => {
            if (error) throw error;
            setUser(data);
          })
          .catch((error) => {
            console.error('Error fetching user profile:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const { data } = await getUserProfile(session.user.id);
          setUser(data || null);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isLoading,
    isAdmin,
    isWholesale,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};