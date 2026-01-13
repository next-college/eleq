"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface ProductCardProps {
  product: Product;
  index: number;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, index, onQuickView }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Fade-in on scroll animation
  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          delay: (index % 3) * 0.1,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [index]);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "cursor-pointer group rounded-xl overflow-hidden",
        "transition-colors duration-200"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onQuickView(product)}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-muted">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="pt-4 space-y-1">
        <h3 className="font-[var(--font-nunito)] font-semibold text-lg leading-tight line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-medium">
            ${product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
