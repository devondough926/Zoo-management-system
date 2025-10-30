import { Leaf, TreePine, Flower } from "lucide-react";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ZooLogo } from './ZooLogo';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1700146134714-f53a41be3cba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx6b28lMjB3aWxkbGlmZSUyMHNhZmFyaSUyMGFuaW1hbHN8ZW58MXx8fHwxNzYwNzM1NTYzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="WildWood Zoo Wildlife"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 to-emerald-800/70" />
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-10 text-white opacity-10">
          <TreePine className="h-32 w-32" />
        </div>
        <div className="absolute top-40 right-20 text-white opacity-10">
          <Leaf className="h-24 w-24" />
        </div>
        <div className="absolute bottom-32 left-20 text-white opacity-15">
          <Flower className="h-28 w-28" />
        </div>
        <div className="absolute bottom-20 right-32 text-white opacity-10">
          <Leaf className="h-20 w-20 transform rotate-45" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6">
        <div className="mb-8 flex justify-center">
          <ZooLogo size={80} className="drop-shadow-lg" />
        </div>
        <h1 className="text-5xl md:text-7xl mb-6 drop-shadow-lg">
          Welcome to WildWood Zoo
        </h1>
        <p className="text-2xl md:text-3xl text-green-100 mb-4 drop-shadow-md">
          Where Nature Comes Alive
        </p>
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
          Experience the wonder of wildlife, discover amazing creatures, and create unforgettable memories with your family
        </p>
      </div>
    </section>
  );
}