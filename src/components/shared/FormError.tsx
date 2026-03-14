interface ValidationDetail {
  field: string;
  message: string;
}

interface Props {
  error: string | null;
  details?: ValidationDetail[];
  className?: string;
}

export function FormError({ error, details, className = '' }: Props) {
  if (!error && (!details || details.length === 0)) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg px-4 py-3 ${className}`}>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {details && details.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {details.map((d, i) => (
            <li key={i} className="text-red-500 text-xs">
              {d.field && <span className="font-medium">{d.field}: </span>}
              {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
