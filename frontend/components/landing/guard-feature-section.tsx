import { ShieldCheck, QrCode, Car, UserCheck } from "lucide-react";

export function GuardFeatureSection() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Mobile Guard Verification Mockup */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-sm rounded-3xl border-2 border-foreground/10 bg-card p-4 shadow-xl">
              <div className="rounded-2xl bg-muted/30 p-5 border border-border space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground font-heading">
                      Gate Guard Portal
                    </span>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary font-mono">
                    Gate B3
                  </span>
                </div>

                {/* Verification Card */}
                <div className="space-y-3">
                  <div className="rounded-xl bg-card p-4 border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vehicle Reg:</span>
                      <strong className="text-foreground font-mono">DHK-METRO-GA 25-1049</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Driver:</span>
                      <strong className="text-foreground font-medium">Tanvir Ahmed</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entry OTP:</span>
                      <strong className="text-primary font-mono font-black text-sm">7492</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-emerald-700 font-bold">Verified & Paid</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-primary py-3 text-center text-xs font-bold text-white shadow-xs">
                    ✓ Confirm Vehicle Check-In
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text & Information */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
                For Security Guards
              </span>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading leading-tight">
                Simple verification for parking guards.
              </h2>

              <p className="text-base text-muted-foreground leading-relaxed">
                Guards access only their assigned residential properties. Vehicle plate
                matching and purpose-bound single-use QR/OTP credentials ensure fast,
                error-free gate management.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs sm:text-sm urban-card-shadow">
                <QrCode className="size-5 text-primary shrink-0 mt-0.5" />
                <span>Instant 1-tap QR scan or 4-digit OTP entry</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs sm:text-sm urban-card-shadow">
                <Car className="size-5 text-primary shrink-0 mt-0.5" />
                <span>Plate number & vehicle model confirmation</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs sm:text-sm urban-card-shadow">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <span>15-minute traffic buffer overstay tracking</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs sm:text-sm urban-card-shadow">
                <UserCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <span>Masked driver personal contact for privacy</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1 italic">
              * Note: Guard accounts are assigned directly by property owners or platform administrators.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
