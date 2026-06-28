import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans select-none">
        {/* LEFT COLUMN: Desktop Only (40% width) */}
        <div className="hidden md:flex md:w-[40%] bg-card flex-col items-center justify-center h-full p-8 border-r border-border">
          {/* Panda placeholder box (matches the carousel/illustration area) */}
          <div className="w-[200px] h-[200px] bg-muted border border-border rounded-2xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden mb-8">
            <div className="h-20 w-20 bg-muted/80 rounded-full skeleton-shimmer" />
            <div className="h-4 w-32 bg-muted/80 rounded-md mt-6 skeleton-shimmer" />
          </div>
          <div className="h-6 w-48 bg-muted rounded-md mb-2 skeleton-shimmer" />
          <div className="h-4 w-64 bg-muted rounded-md skeleton-shimmer" />
        </div>

        {/* RIGHT COLUMN: Auth Form (60% width) */}
        <div className="w-full md:w-[60%] h-full flex flex-col items-center justify-center p-6 md:p-12 relative">
          
          {/* Theme Toggle Skeleton (Top Right) */}
          <div className="absolute top-6 right-6">
            <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer" />
          </div>

          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {/* Logo placeholder */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-6 w-24 rounded-md bg-muted skeleton-shimmer" />
            </div>

            {/* Toggle switcher pill placeholder */}
            <div className="h-10 w-full max-w-[240px] rounded-full bg-muted skeleton-shimmer mb-4" />

            {/* Inputs placeholders */}
            <div className="w-full space-y-5">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-muted skeleton-shimmer" />
                <div className="h-11 w-full rounded-xl bg-muted skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-muted skeleton-shimmer" />
                <div className="h-11 w-full rounded-xl bg-muted skeleton-shimmer" />
              </div>
            </div>

            {/* Button placeholder */}
            <div className="h-12 w-full rounded-full bg-muted skeleton-shimmer mt-2" />
            
            {/* Footer link placeholder */}
            <div className="h-4 w-32 rounded bg-muted skeleton-shimmer mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
