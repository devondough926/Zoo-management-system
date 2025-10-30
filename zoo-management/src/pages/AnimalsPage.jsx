import { useState, useMemo, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Stethoscope, Salad, Trees } from "lucide-react";
import { animalsAPI, enclosuresAPI } from "../services/customerAPI";
import { getAnimalImage } from "../utils/imageMapping";
import { useOptimizedFetch } from "../hooks/useOptimizedFetch";
import { AnimalCard } from "../components/AnimalCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";
import { preloadImages } from "../utils/imagePreloader";

export function AnimalsPage() {
  const [selectedHabitat, setSelectedHabitat] = useState("All Animals");
  const heroImage = useHeroImage("animals");

  // Optimized data fetching with caching
  const {
    data: animalsData,
    loading: animalsLoading,
    error: animalsError,
  } = useOptimizedFetch(
    "animals",
    () => animalsAPI.getAll(),
    { cacheTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  const {
    data: enclosuresData,
    loading: enclosuresLoading,
    error: enclosuresError,
  } = useOptimizedFetch("enclosures", () => enclosuresAPI.getAll(), {
    cacheTime: 5 * 60 * 1000,
  });

  // Ensure we always have arrays (handle null/undefined from cache)
  const animals = animalsData || [];
  const enclosures = enclosuresData || [];

  const loading = animalsLoading || enclosuresLoading;
  const error = animalsError || enclosuresError;

  // Memoize habitats list - only recalculate when enclosures change
  const habitats = useMemo(() => {
    return ["All Animals", ...enclosures.map((enc) => enc.Enclosure_Name)];
  }, [enclosures]);

  // Memoize displayed animals - only recalculate when animals, selectedHabitat changes
  const displayedAnimals = useMemo(() => {
    const filteredAnimals =
      selectedHabitat === "All Animals"
        ? animals
        : animals.filter((animal) => animal.Enclosure_Name === selectedHabitat);

    return filteredAnimals.map((animal) => ({
      name: animal.Animal_Name,
      species: animal.Species,
      gender:
        animal.Gender === "M"
          ? "Male"
          : animal.Gender === "F"
          ? "Female"
          : "Unknown",
      habitat: animal.Enclosure_Name || "Unknown",
      imageUrl: getAnimalImage(animal),
    }));
  }, [animals, selectedHabitat]);

  // Preload animal images for better performance
  useEffect(() => {
    if (displayedAnimals.length > 0) {
      const imageUrls = displayedAnimals
        .map((animal) => animal.imageUrl)
        .filter((url) => url);

      if (imageUrls.length > 0) {
        // Preload first 12 images with high priority (above fold + first scroll)
        const priorityImages = imageUrls.slice(0, 12);
        const laterImages = imageUrls.slice(12);

        // Use high priority for visible images
        preloadImages(priorityImages, "high");

        // Preload remaining images very quickly with normal priority
        if (laterImages.length > 0) {
          setTimeout(() => preloadImages(laterImages, "low"), 100);
        }
      }
    }
  }, [displayedAnimals]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Zoo Animals"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom right, rgba(20, 83, 45, 0.55), rgba(6, 78, 59, 0.55))",
            }}
          />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl mb-4 drop-shadow-lg">
            Our Animals
          </h1>
          <p className="text-xl text-green-100 max-w-2xl drop-shadow-md">
            Meet the amazing residents of WildWood Zoo! We care for{" "}
            {animals.length} animals across {enclosures.length} unique habitats.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Loading animals...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-600 font-semibold mb-2">Connection Error</p>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      ) : animals.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-yellow-600 font-semibold mb-2">
              No Data Available
            </p>
            <p className="text-yellow-700">Unable to load animals data.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Habitat Filter */}
          <section className="py-8 bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {habitats.map((habitat) => (
                  <Button
                    key={habitat}
                    onClick={() => setSelectedHabitat(habitat)}
                    variant={
                      selectedHabitat === habitat ? "default" : "outline"
                    }
                    className={`cursor-pointer ${
                      selectedHabitat === habitat
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-green-600 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {habitat}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Animals Grid */}
          <section className="py-16">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl mb-8 text-center">
                {selectedHabitat === "All Animals"
                  ? `All Animals (${displayedAnimals.length})`
                  : `${selectedHabitat} (${displayedAnimals.length})`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedAnimals.map((animal, index) => (
                  <AnimalCard key={`${animal.name}-${index}`} animal={animal} />
                ))}
              </div>
            </div>
          </section>

          {/* Info Section */}
          <section className="py-16 bg-green-50">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl mb-4">Animal Care at WildWood Zoo</h2>
                <p className="text-gray-600 mb-8">
                  Our dedicated team of veterinarians and zookeepers provides
                  world-class care for all our animals. Each habitat is
                  carefully designed to mimic natural environments and promote
                  animal wellbeing.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg">
                    <div className="flex justify-center text-green-600 mb-2">
                      <Stethoscope size={32} />
                    </div>
                    <p className="font-medium">Expert Veterinary Care</p>
                    <p className="text-sm text-gray-600">
                      24/7 medical monitoring
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg">
                    <div className="flex justify-center text-green-600 mb-2">
                      <Salad size={32} />
                    </div>
                    <p className="font-medium">Specialized Diets</p>
                    <p className="text-sm text-gray-600">
                      Nutrition tailored to each species
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg">
                    <div className="flex justify-center text-green-600 mb-2">
                      <Trees size={32} />
                    </div>
                    <p className="font-medium">Enrichment Programs</p>
                    <p className="text-sm text-gray-600">
                      Daily activities and stimulation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
