import { useState, useEffect } from 'react';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  laptop: number;
  desktop: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  laptop: 1440,
  desktop: 1920
};

export const useResponsive = (breakpoints: Partial<BreakpointConfig> = {}) => {
  const config = { ...defaultBreakpoints, ...breakpoints };
  
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('laptop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');
      
      // Determine device type
      if (width < config.mobile) {
        setDeviceType('mobile');
      } else if (width < config.tablet) {
        setDeviceType('tablet');
      } else if (width < config.laptop) {
        setDeviceType('laptop');
      } else {
        setDeviceType('desktop');
      }
      
      // Detect touch device
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, [config]);

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isLaptop = deviceType === 'laptop';
  const isDesktop = deviceType === 'desktop';
  const isMobileOrTablet = isMobile || isTablet;
  const isTabletOrLaptop = isTablet || isLaptop;
  const isLaptopOrDesktop = isLaptop || isDesktop;

  return {
    screenSize,
    deviceType,
    orientation,
    isTouchDevice,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isMobileOrTablet,
    isTabletOrLaptop,
    isLaptopOrDesktop,
    breakpoints: config
  };
};

export default useResponsive;