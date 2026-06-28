import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full font-sans select-none relative">
        <div className="fixed inset-0 backdrop-blur-md bg-background/50 z-[-5] pointer-events-none transition-all duration-500" />
        
        {/* Navbar Skeleton */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-5 w-16 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3">
              <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-4 w-16 rounded bg-muted skeleton-shimmer hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="mx-auto max-w-5xl px-8 py-10 sm:py-14">
          {/* Header Skeleton */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-3">
              <div className="h-10 w-48 bg-muted rounded-xl skeleton-shimmer" />
              <div className="h-4 w-72 bg-muted rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-9 w-28 bg-muted rounded-full skeleton-shimmer" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm border-l-4 relative select-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-36 rounded-md bg-muted skeleton-shimmer" />
                    <div className="h-4 w-24 rounded-md bg-muted skeleton-shimmer" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-muted skeleton-shimmer" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((a) => (
                      <div
                        key={a}
                        className="h-8 w-8 rounded-full border-2 border-background bg-muted skeleton-shimmer"
                      />
                    ))}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="h-3 w-16 rounded bg-muted skeleton-shimmer" />
                    <div className="h-6 w-20 rounded bg-muted mt-1.5 skeleton-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
