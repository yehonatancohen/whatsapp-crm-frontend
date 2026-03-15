import { type ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  // Selection
  selectedIds?: Set<string | number>;
  onSelect?: (id: string | number) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'לא נמצאו נתונים',
  onRowClick,
  selectedIds,
  onSelect,
  onSelectAll,
  isAllSelected,
}: Props<T>) {
  const isSelectable = !!onSelect;

  return (
    <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-cream-dark/50 border-b border-border">
              {isSelectable && (
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => onSelectAll?.()}
                    className="accent-accent w-4 h-4 rounded border-border"
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (isSelectable ? 1 : 0)} className="px-6 py-10 text-center text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span>טוען נתונים...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (isSelectable ? 1 : 0)} className="px-6 py-10 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-cream/50' : 'hover:bg-cream/20'} ${selectedIds?.has(item.id) ? 'bg-accent-subtle/30' : ''}`}
                >
                  {isSelectable && (
                    <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(item.id)}
                        onChange={() => onSelect?.(item.id)}
                        className="accent-accent w-4 h-4 rounded border-border"
                      />
                    </td>
                  )}
                  {columns.map((col, i) => (
                    <td key={i} className={`px-6 py-4 whitespace-nowrap text-sm text-charcoal ${col.className || ''}`}>
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
