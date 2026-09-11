import { LucideIcon } from "lucide-react";

interface SupportTopicCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export function SupportTopicCard({
  title,
  description,
  icon: Icon,
  onClick,
}: SupportTopicCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card p-5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm urban-card-shadow cursor-pointer group flex flex-col justify-between h-full space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 border border-border/80 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon className="size-5" />
        </div>
        <h4 className="text-sm sm:text-base font-bold text-foreground font-heading group-hover:text-primary transition-colors">
          {title}
        </h4>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </button>
  );
}
