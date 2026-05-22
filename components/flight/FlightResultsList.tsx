import EmptyState from "@/components/ui/EmptyState";
import FlightCard from "@/components/flight/FlightCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import type { CabinClass, Flight } from "@/lib/types";

type FlightResultsListProps = {
  loading: boolean;
  flights: Flight[];
  onSelect: (flight: Flight, cabinClass: CabinClass) => void;
};

export default function FlightResultsList({ loading, flights, onSelect }: FlightResultsListProps) {
  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((key) => (
          <LoadingSkeleton key={key} className="h-[220px] w-full" />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <EmptyState
        title="No matching flights"
        description="Try widening your price range or selecting a different cabin or time band."
        actionHref="/search"
        actionLabel="Modify Search"
      />
    );
  }

  return (
    <div className="space-y-5">
      {flights.map((flight, index) => (
        <FlightCard key={flight.id} flight={flight} recommended={index === 0} onSelect={onSelect} />
      ))}
    </div>
  );
}
