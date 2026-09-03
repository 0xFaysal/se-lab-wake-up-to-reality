import { use } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParkingDetailsView } from "@/components/parking/parking-details-view";
import { MOCK_PARKING_SPOTS } from "@/lib/data/mock-parking";

interface ParkingDetailsPageProps {
  params: Promise<{
    spotId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ParkingDetailsPageProps): Promise<Metadata> {
  const { spotId } = await params;
  const spot =
    MOCK_PARKING_SPOTS.find(
      (s) =>
        s.id === spotId ||
        s.id === decodeURIComponent(spotId) ||
        spotId === "gulshan-residential-parking"
    ) || MOCK_PARKING_SPOTS[0];

  return {
    title: `${spot.propertyName} | ParkEase BD`,
    description: `Verified hourly parking in ${spot.area} at ৳${spot.hourlyRate}/hr. 24/7 security, covered parking, and digital access pass.`,
  };
}

export default function ParkingDetailsPage({
  params,
}: ParkingDetailsPageProps) {
  const resolvedParams = use(params);
  const spotId = resolvedParams.spotId;

  // Find spot or fallback to the primary Gulshan Residential Parking spot
  const spot =
    MOCK_PARKING_SPOTS.find(
      (s) =>
        s.id === spotId ||
        s.id === decodeURIComponent(spotId) ||
        spotId.toLowerCase().includes("gulshan")
    ) || MOCK_PARKING_SPOTS[0];

  return <ParkingDetailsView spot={spot} />;
}
