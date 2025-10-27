import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: string[];
  loading: boolean;
  hasRole: (role: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log LOGIN event when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            supabase.from('audit_logs').insert({
              user_id: session.user.id,
              user_email: session.user.email,
              action: 'LOGIN',
              metadata: { 
                event,
                timestamp: new Date().toISOString(),
                ip_address: session.user.user_metadata?.ip_address
              }
            }).then(({ error }) => {
              if (error) console.error('Error logging login:', error);
            });
            
            fetchUserRoles(session.user.id);
          }, 0);
        } else if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        setUserRoles([]);
      } else {
        setUserRoles(data?.map(r => r.role) || []);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  const signOut = async () => {
    // Log logout action before signing out
    if (user) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_email: user.email,
          action: 'LOGOUT',
          metadata: { timestamp: new Date().toISOString() }
        });
      } catch (error) {
        console.error('Error logging logout:', error);
      }
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRoles, loading, hasRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
