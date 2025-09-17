import { ReactNode } from 'react';

interface ResponsiveTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'white' | 'gray' | 'green' | 'blue' | 'gradient';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const ResponsiveText = ({
  children,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'white',
  align = 'left',
  className = ''
}: ResponsiveTextProps) => {
  const sizeClasses = {
    xs: 'text-responsive-xs',
    sm: 'text-responsive-sm',
    base: 'text-responsive-base',
    lg: 'text-responsive-lg',
    xl: 'text-responsive-xl',
    '2xl': 'text-responsive-2xl',
    '3xl': 'text-responsive-3xl',
    '4xl': 'text-responsive-4xl',
    '5xl': 'text-responsive-5xl'
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colorClasses = {
    white: 'text-white',
    gray: 'text-gray-300',
    green: 'text-football-green',
    blue: 'text-football-blue',
    gradient: 'gradient-text'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <Component 
      className={`
        ${sizeClasses[size]} 
        ${weightClasses[weight]} 
        ${colorClasses[color]} 
        ${alignClasses[align]}
        leading-responsive
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

export default ResponsiveText;