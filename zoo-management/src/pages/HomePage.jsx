import { HeroSection } from "../components/HeroSection";
import { CustomerHighlights } from "../components/CustomerHighlights";
import { OperationalDashboard } from "../components/OperationalDashboard";
import { ZooMap } from "../components/ZooMap";

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <CustomerHighlights />
      <OperationalDashboard />

      {/* Zoo Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Explore Our Zoo</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Navigate through our 4 zones and discover all the amazing habitats
              and attractions
            </p>
          </div>
          <ZooMap />
        </div>
      </section>
    </div>
  );
}
