import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

const POPULAR_AREAS = [
  {
    name: "Dhanmondi",
    zone: "Road 27, Satmasjid Rd, R/A",
  },
  {
    name: "Gulshan",
    zone: "Circle 1 & 2, Avenue Hubs",
  },
  {
    name: "Banani",
    zone: "Road 11, Kamal Ataturk",
  },
  {
    name: "Uttara",
    zone: "Sector 3, 7, 11 & Jashimuddin",
  },
  {
    name: "Mirpur",
    zone: "Mirpur 10, 11 & Stadium Area",
  },
  {
    name: "Motijheel",
    zone: "Commercial Bank Hubs",
  },
];

export function FeaturedLocationsGrid() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            Explore Coverage
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Parking across Dhaka neighbourhoods.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Residential and commercial neighbourhoods across Dhaka.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_AREAS.map((area) => (
            <Link
              key={area.name}
              href={`/parking?location=${encodeURIComponent(area.name)}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 urban-card-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                    <MapPin className="size-3.5" />
                    <span>{area.name}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-foreground font-heading group-hover:text-primary transition-colors">
                    {area.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {area.zone}
                  </p>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end text-xs">
                <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                  View spots <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
