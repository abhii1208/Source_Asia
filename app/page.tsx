import HeroSection from "@/components/home/HeroSection";
import JourneyWorkflow from "@/components/home/JourneyWorkflow";
import PopularRoutes from "@/components/home/PopularRoutes";
import WhyFlyAhead from "@/components/home/WhyFlyAhead";

export default function HomePage() {
  return (
    <div className="max-w-[1600px] mx-auto px-gutter pt-8 pb-12">
      <HomeComposition />
    </div>
  );
}

function HomeComposition() {
  return (
    <>
      <HeroSection />
      <PopularRoutes />
      <WhyFlyAhead />
      <JourneyWorkflow />
    </>
  );
}
