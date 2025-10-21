import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTouchOptimization } from '@/hooks/platform/use-touch-optimization';

interface TouchButtonProps extends ButtonProps {
  touchSize?: 'sm' | 'md' | 'lg';
  label: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  touchSize = 'md',
  className = '',
  label,
  children,
  ...props
}) => {
  const { getTouchClass, getAriaProps } = useTouchOptimization();

  return (
    <Button
      className={getTouchClass(className)}
      {...getAriaProps(label)}
      {...props}
    >
      {children}
    </Button>
  );
};
