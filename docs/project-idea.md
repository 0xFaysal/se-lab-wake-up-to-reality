# Project Proposal — ParkEase BD

## Problem Statement

Dhaka faces severe traffic congestion, partly because many drivers park vehicles on roads near shopping malls, hospitals, offices, educational institutions, and commercial areas. At the same time, a large number of residential parking spaces remain unused during the daytime because residents take their vehicles to work or other locations. This creates a mismatch between available private parking capacity and high daytime parking demand. A digital platform can connect property owners with drivers, reduce roadside parking, improve the use of existing urban infrastructure, and create an additional income source for property owners.

## Proposed Solution

ParkEase BD will be a location-based shared parking platform that allows residential property owners and building managers to rent out unused parking spaces on an hourly basis. Drivers will be able to search for available parking near their destination, compare rates and facilities, and reserve a time slot before arrival. The system will manage booking conflicts, entry and exit verification, overtime charges, cancellations, and owner earnings. By converting unused private parking spaces into bookable daytime parking, the platform aims to reduce illegal roadside parking and improve parking accessibility in congested areas of Dhaka.

## Target Users

* Residential property owners with unused daytime parking spaces.
* Apartment and building managers responsible for shared parking areas.
* Private-car and motorcycle drivers visiting hospitals, offices, shopping malls, universities, and commercial zones.
* Security guards or parking attendants responsible for verifying vehicle entry and exit.
* Small businesses and organizations that need temporary parking facilities for visitors or employees.

## Who Gets Benefited?

ParkEase BD offers a practical way to turn unused parking spaces into a useful resource while helping reduce one of Dhaka’s major urban problems—traffic congestion caused by roadside parking.

### Key Beneficiaries

* **Property Owners & Managers:** Earn extra income from parking spaces that often stay unused during the day.
* **Vehicle Owners & Drivers:** Get secure, reserved parking near their destination without wasting time searching.
* **Security Guards & Building Personnel:** Handle added responsibility and may justify better pay or incentives.
* **General Public & The Nation:** Benefit from less roadside parking, reduced congestion, and smoother movement in the city.

### Overall Impact

This is more than a parking platform—it is a smart solution to a national urban issue. By improving parking management and reducing illegal roadside parking, ParkEase BD can help make cities more organized, efficient, and livable.

## Core Features (Prioritized)

1. **Time-Slot-Based Parking Listing** — Property owners and building managers will be able to list parking spaces with location, photographs, vehicle-size support, hourly price, operating hours, and available time slots. They can temporarily disable a space or update availability when it is required for personal use.

2. **Nearby Parking Discovery and Reservation** — Drivers will search by current location, destination, area, vehicle type, price, and availability. The system will display nearby parking options on a map and prevent two drivers from booking the same parking space during overlapping time slots.

3. **Secure Entry and Exit Verification** — After a booking is confirmed, the system will generate a temporary QR code or one-time verification code. A security guard or parking attendant will verify the code during entry and exit, ensuring that only the authorized vehicle can use the reserved parking space.

4. **Overstay, Cancellation, and No-Show Management** — The system will calculate additional charges when a vehicle remains beyond the booked period and will notify both the driver and property owner before the reservation expires. Configurable cancellation, grace-period, refund, and no-show rules will help prevent booking misuse and protect future reservations.

5. **Owner Earnings and Platform Settlement** — Property owners will receive a dashboard showing completed bookings, total occupied hours, earnings, penalties, refunds, and platform commission. The system will maintain a transparent transaction ledger and generate weekly or monthly earning summaries.

## Technology Stack

| Layer                       | Technology                                                 | Justification                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                     | Node.js, Express.js, and TypeScript                        | Supports scalable REST API development, real-time booking logic, secure authentication, and efficient handling of multiple user roles.                                                                     |
| Frontend                    | Next.js, React, TypeScript, and Tailwind CSS               | Provides a responsive and user-friendly interface for drivers, property owners, guards, and administrators while supporting fast deployment and reusable components.                                       |
| Database                    | PostgreSQL with Prisma ORM                                 | Relational data is suitable for managing users, parking spaces, vehicles, time slots, bookings, payments, and conflict-free transactions. Prisma provides type-safe database access and migration support. |
| Maps and Location           | OpenStreetMap with Leaflet                                 | Provides map visualization, location selection, and nearby parking discovery without depending on an expensive commercial map service.                                                                     |
| Real-Time Updates           | Socket.IO                                                  | Allows booking status, entry confirmation, slot availability, and overtime notifications to update instantly.                                                                                              |
| Authentication and Security | JWT, refresh tokens, bcrypt, and role-based access control | Protects user accounts and ensures that drivers, owners, guards, and administrators can access only their permitted operations.                                                                            |
| Payment Simulation          | Internal wallet and transaction ledger                     | Allows the team to demonstrate booking payments, refunds, owner earnings, commissions, and penalties without integrating a paid financial service during the semester.                                     |
| Container                   | Docker                                                     | Consistent environments                                                                                                                                                                                    |
| Version Control             | Git + GitHub                                               | CI/CD, Faculty access                                                                                                                                                                                      |


## Out of Scope This Semester

* The project will not integrate directly with real banking, bKash, Nagad, or card-payment gateways; a simulated wallet and payment ledger will be used.
* The system will not use physical parking sensors, automated barriers, license-plate recognition cameras, or other IoT hardware.
* City-wide government traffic-system integration, automated illegal-parking enforcement, and guaranteed parking availability across all areas of Dhaka will not be implemented.

## Similar Products

**ParkHopper** and **JustPark** allow drivers to reserve private or commercial parking spaces in selected international markets. However, ParkEase BD will focus specifically on the daytime use of vacant residential parking in Dhaka, including local operational requirements such as building-manager approval, security-guard verification, hourly residential availability, vehicle-specific capacity, and overstay handling.

Traditional parking-management systems are generally designed for shopping malls, offices, or dedicated parking facilities. ParkEase BD differs by applying a shared-economy model that turns temporarily unused residential parking spaces into a distributed urban parking network.
