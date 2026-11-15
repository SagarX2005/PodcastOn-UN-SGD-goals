import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onboardingCompleted").then((val) => {
      setOnboardingCompleted(val === "true");
    });
  }, []);

  const formatUser = (supabaseUser) => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || "User",
      profilePic: supabaseUser.user_metadata?.profilePic || null,
      isPremium: supabaseUser.user_metadata?.isPremium || false,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(formatUser(data.session.user));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(formatUser(session.user));
      } else {
        setUser(null); // AppNavigator will show Login automatically
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); // no manual navigation here
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout, loading, onboardingCompleted, setOnboardingCompleted }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
