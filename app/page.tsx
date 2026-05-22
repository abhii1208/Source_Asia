import FeatureGrid from "@/components/home/FeatureGrid";
import HeroSearch from "@/components/home/HeroSearch";
import TrendingRoutes from "@/components/home/TrendingRoutes";

export default function HomePage() {
  return (
    <div className="space-y-0">
      <div className="max-w-[1600px] mx-auto px-gutter pt-8">
        <HomeComposition />
      </div>
    </div>
  );
}

function HomeComposition() {
  return (
    <>
      <HeroSearch />
      <TrendingRoutes />
      <FeatureGrid />
    </>
  );
}
