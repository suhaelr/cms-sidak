import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const iconSizes: Record<IconSize, string> = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

type Variant = 'brand' | 'primary';

const gradientVariants: Record<Variant, string> = {
  brand: 'bg-gradient-to-br from-[#001F3F]/10 to-[#2E7D32]/10',
  primary: 'bg-gradient-to-br from-primary/10 to-secondary/10',
};

interface ArticleCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: IconSize;
  variant?: Variant;
  hoverScale?: boolean;
}

const ArticleCoverImage = ({
  src,
  alt,
  className,
  iconSize = 'lg',
  variant = 'brand',
  hoverScale = false,
}: ArticleCoverImageProps) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center',
          gradientVariants[variant],
          className,
        )}
      >
        <Newspaper className={cn(iconSizes[iconSize], 'text-muted-foreground/40')} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'w-full h-full object-cover',
        hoverScale && 'group-hover:scale-105 transition-transform duration-300',
        className,
      )}
      onError={() => setBroken(true)}
    />
  );
};

export default ArticleCoverImage;
