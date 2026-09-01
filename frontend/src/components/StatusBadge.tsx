interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className={`badge badge-${value}`}>{value.replace(/_/g, " ")}</span>;
}
