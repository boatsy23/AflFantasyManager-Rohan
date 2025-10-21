import React from 'react';
import { usePlatform } from '@/hooks/platform/use-platform';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobileClass?: string;
  tabletClass?: string;
  desktopClass?: string;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
  className = '',
}) => {
  const { platform } = usePlatform();

  const platformClass = {
    mobile: mobileClass,
    tablet: tabletClass,
    desktop: desktopClass,
  }[platform];

  return <div className={`${className} ${platformClass}`}>{children}</div>;
};
