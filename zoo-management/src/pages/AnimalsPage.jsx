import { useState, useMemo, useEffect } from "react";
import LoadingWithIcon from "../components/ui/LoadingWithIcon";
import { Button } from "../components/ui/button";
import {
  Stethoscope,
  Salad,
  Trees,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { animalsAPI, enclosuresAPI } from "../services/customerAPI";
import { getAnimalImage } from "../utils/imageMapping";
import { AnimalCard } from "../components/AnimalCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";
import { preloadImages } from "../utils/imagePreloader";
import { generatePaginationArray } from "../utils/paginationHelper";
import { PaginationControls } from "../components/PaginationControls";

export function AnimalsPage() {
  const [selectedHabitat, setSelectedHabitat] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [animals, setAnimals] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heroImage = useHeroImage("animals");

  const ITEMS_PER_PAGE = 12; // 4 columns × 3 rows

  // Fetch data without caching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [animalsData, enclosuresData] = await Promise.all([
          animalsAPI.getAll(),
          enclosuresAPI.getAll(),
        ]);
        setAnimals(animalsData || []);
        setEnclosures(enclosuresData || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize habitats list - only recalculate when enclosures change
  const habitats = useMemo(() => {
    return ["All", ...enclosures.map((enc) => enc.Enclosure_Name)];
  }, [enclosures]);

  // Memoize displayed animals - only recalculate when animals, selectedHabitat changes
  const displayedAnimals = useMemo(() => {
    const filteredAnimals =
      selectedHabitat === "All"
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

  // Paginated animals
  const paginatedAnimals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return displayedAnimals.slice(startIndex, endIndex);
  }, [displayedAnimals, currentPage]);

  const totalPages = Math.ceil(displayedAnimals.length / ITEMS_PER_PAGE);

  // Go to a page, preloading that page's images first so the visual switch is smooth
  const goToPage = async (page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const imageUrls = displayedAnimals
      .slice(startIndex, endIndex)
      .map((a) => a.imageUrl)
      .filter(Boolean);

    try {
      // Start preloading but don't wait indefinitely — race with a short timeout
      await Promise.race([
        preloadImages(imageUrls, "high"),
        new Promise((res) => setTimeout(res, 150)),
      ]);
    } catch (e) {
      // ignore preload errors — we'll still switch
    }

    setCurrentPage(page);

    // Smooth scroll to the animals section title (not to top of page)
    try {
      if (typeof window !== "undefined") {
        const start = window.scrollY || window.pageYOffset || 0;
        const targetEl = document.getElementById("animals-section");
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          // small offset so title isn't flush to top (adjust if you have a fixed header)
          const offset = 20;
          const target = Math.round(
            (window.scrollY || window.pageYOffset || 0) + rect.top - offset
          );

          const duration = 600;
          const startTime = performance.now();
          const easeInOutQuad = (t) =>
            t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutQuad(progress);
            const pos = Math.round(start + (target - start) * ease);
            window.scrollTo({ top: pos, left: 0 });
            if (elapsed < duration) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
        }
      }
    } catch (e) {
      // ignore for non-browser environments
    }
  };

  // Reset to page 1 when habitat changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedHabitat]);

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

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <LoadingWithIcon text="Loading animals..." size={48} />
          </div>
        </div>
      )}

      {error ? (
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
          <section className="py-8 bg-white border-b top-0 z-10 shadow-sm">
            <div className="container mx-auto px-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {habitats.map((habitat) => (
                  <Button
                    key={habitat}
                    onClick={() => setSelectedHabitat(habitat)}
                    variant={
                      selectedHabitat === habitat ? "default" : "outline"
                    }
                    className={`cursor-pointer transition-colors duration-150 ${
                      selectedHabitat === habitat
                        ? "!bg-green-200 !text-black hover:!bg-green-300 border-green-200"
                        : "border-green-600 text-black hover:bg-green-50 bg-transparent"
                    }`}
                  >
                    {habitat}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Animals Grid */}
          <section id="animals-section" className="py-16 pb-24">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl mb-8 text-center">
                {selectedHabitat === "All" ? "All Animals" : selectedHabitat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                {paginatedAnimals.map((animal, index) => (
                  <AnimalCard key={`${animal.name}-${index}`} animal={animal} />
                ))}
              </div>

              {/* Pagination Controls */}
              {displayedAnimals.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  paginationArray={generatePaginationArray(
                    currentPage,
                    totalPages
                  )}
                />
              )}
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
