import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ListFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  'aria-label'?: string;
};

export function ListFilterSelect({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: ListFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'h-9 min-w-[140px] rounded-md border border-input bg-background px-3 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  count?: number;
  countLabel?: (count: number) => string;
  children?: ReactNode;
  className?: string;
};

const defaultCountLabel = (count: number) => `${count} item`;

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  count,
  countLabel = defaultCountLabel,
  children,
  className,
}: ListToolbarProps) {
  return (
    <div className={cn('filter-bar !mb-0 rounded-b-none border-b-0', className)}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-10 pr-4 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {children}
      {count !== undefined && (
        <div className="ml-auto self-center text-sm text-muted-foreground whitespace-nowrap">
          {countLabel(count)}
        </div>
      )}
    </div>
  );
}
