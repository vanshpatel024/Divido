import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans select-none">
        {/* LEFT COLUMN: Desktop Only (40% width) */}
        <div className="hidden md:flex md:w-[40%] bg-[#F5F0E8] flex-col items-center justify-center h-full p-8 border-r border-[#EFECE6]">
          {/* Panda placeholder box (160x190px) */}
          <div className="w-[160px] h-[190px] bg-white border border-dashed border-[#D4CFC8] rounded-2xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden mb-4">
            <div className="h-16 w-16 bg-[#EFECE6] rounded-full skeleton-shimmer" />
            <div className="h-3.5 w-24 bg-[#EFECE6] rounded-md mt-4 skeleton-shimmer" />
          </div>
          <div className="h-4 w-40 bg-[#EFECE6] rounded-md mt-2 skeleton-shimmer" />
        </div>

        {/* RIGHT COLUMN: Auth Form (60% width) */}
        <div className="w-full md:w-[60%] h-full flex flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {/* Logo placeholder */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-[#EFECE6] skeleton-shimmer" />
              <div className="h-6 w-20 rounded-md bg-[#EFECE6] skeleton-shimmer" />
            </div>

            {/* Toggle switcher pill placeholder */}
            <div className="h-9 w-full max-w-[240px] rounded-full bg-[#EFECE6] skeleton-shimmer mb-2" />

            {/* Inputs placeholders */}
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-[#EFECE6] skeleton-shimmer" />
                <div className="h-10 w-full rounded-xl bg-[#EFECE6] skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-[#EFECE6] skeleton-shimmer" />
                <div className="h-10 w-full rounded-xl bg-[#EFECE6] skeleton-shimmer" />
              </div>
            </div>

            {/* Button placeholder */}
            <div className="h-12 w-full rounded-full bg-[#EFECE6] skeleton-shimmer mt-4" />
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
