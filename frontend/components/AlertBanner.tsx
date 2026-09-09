import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type AlertBannerProps = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning";
  className?: string;
};

const toneStyles = {
  info: {
    icon: Info,
    className: "border-primary/20 bg-primary/10 text-text",
  },
  success: {
    icon: CheckCircle2,
    className: "border-success/20 bg-success/10 text-text",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning/20 bg-warning/10 text-text",
  },
};

export function AlertBanner({
  title,
  message,
  tone = "info",
  className,
}: AlertBannerProps) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "glass-surface flex items-start gap-4 rounded-2xl p-4 shadow-glass",
        style.className,
        className,
      )}
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-base font-semibold">{title}</p>
        <p className="text-sm leading-6 text-text/72">{message}</p>
      </div>
    </div>
  );
}
