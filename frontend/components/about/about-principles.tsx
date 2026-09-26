const PRINCIPLES = [
  {
    title: "Transparency",
    desc: "Clear upfront hourly pricing, verified spot amenities, and zero hidden checkout fees.",
  },
  {
    title: "Control",
    desc: "Parking providers decide when, how, and which vehicle types are authorized to park.",
  },
  {
    title: "Fairness",
    desc: "Automated 15-minute traffic grace periods and prompt dispute refunds for unexpected events.",
  },
  {
    title: "Accountability",
    desc: "Complete digital audit trails for every check-in, departure, and verified gate scan.",
  },
];

export function AboutPrinciples() {
  return (
    <section className="py-20 bg-muted/20 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full font-heading">
            Our Core Values
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-heading">
            Simple principles. Better parking decisions.
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The foundation of trust between drivers, parking providers, and security teams across Dhaka.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <div
              key={principle.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between urban-card-shadow"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground font-heading">
                  {principle.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {principle.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
