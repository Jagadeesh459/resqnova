type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({
  label = "Loading",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={className} role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-text/70">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
