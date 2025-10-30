import { Switch, Route, Redirect } from "wouter";
import { queryClient, verifyAuthState } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PresetList from "@/pages/preset-list";
import PresetDetail from "@/pages/preset-detail";
import PresetCreate from "@/pages/preset-create";
import Login from "@/pages/login";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import SettingsPage from "@/pages/settings";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

function App() {
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      console.log("Checking auth state...");
      try {
        return await verifyAuthState();
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  
  useEffect(() => {
    console.log("User authentication state:", user);
  }, [user]);
  
  useEffect(() => {
    const verifyUserAuth = async () => {
      try {
        await verifyAuthState();
        refetchUser();
      } catch (error) {
        console.error("Failed to verify authentication:", error);
      }
    };
    
    verifyUserAuth();
    
    const handleFocus = () => {
      console.log("Window focused, verifying auth state...");
      verifyUserAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-grow">
        <div className="pb-16 md:pb-0 pt-16 md:pt-0">
          <Switch>
            <Route path="/">
              {(params) => (user ? <PresetList /> : <Login />)}
            </Route>
            <Route path="/create" component={PresetCreate} />
            <Route path="/presets/:id" component={PresetDetail} />
            <Route path="/login" component={Login} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default AppWrapper;
