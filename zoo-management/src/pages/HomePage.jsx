import { HeroSection } from "../components/HeroSection";
import { CustomerHighlights } from "../components/CustomerHighlights";
import { OperationalDashboard } from "../components/OperationalDashboard";
import { ZooMap } from "../components/ZooMap";
import LoadingWithIcon from "../components/ui/LoadingWithIcon";
import { useData } from "../data/DataContext";

export function HomePage() {
  const { animals, items, concessionItems } = useData();

  // Consider the home page loading while core datasets are still empty
  const isHomeLoading =
    !animals ||
    animals.length === 0 ||
    !items ||
    items.length === 0 ||
    !concessionItems ||
    concessionItems.length === 0;

  return (
    <div>
      {/* Small centered overlay to match Admin Portal tab loading */}
      {isHomeLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <LoadingWithIcon text="Loading..." size={56} />
          </div>
        </div>
      )}

      <HeroSection />
      <CustomerHighlights />
      <OperationalDashboard />

      {/* Reduced spacer between Today's Activities and Weather section */}
      <div className="py-6 bg-white" />

      {/* Weather Conditions Section removed from public home page; hero banner shows weather alerts */}
      <section id="our-map" className="py-16 bg-gray-50">
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
