import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground mb-6 decoration-none"
        >
          <ArrowLeft size={16} /> Back to Trips
        </Link>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Trip Details: {id}
        </h1>
        <p className="mt-4 text-muted-foreground text-sm">
          This is a placeholder page for the trip with ID: <span className="font-semibold">{id}</span>.
        </p>
      </main>
    </div>
  );
}
