import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    laptop?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, laptop: 3, desktop: 4 },
  gap = 'md',
  className = '' 
}: ResponsiveGridProps) => {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-12',
    xl: 'gap-8 sm:gap-12 lg:gap-16'
  };

  const getGridCols = () => {
    const { mobile = 1, tablet = 2, laptop = 3, desktop = 4 } = cols;
    
    let classes = `grid-cols-${mobile}`;
    if (tablet) classes += ` sm:grid-cols-${tablet}`;
    if (laptop) classes += ` lg:grid-cols-${laptop}`;
    if (desktop) classes += ` xl:grid-cols-${desktop}`;
    
    return classes;
  };

  return (
    <div className={`grid ${getGridCols()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;