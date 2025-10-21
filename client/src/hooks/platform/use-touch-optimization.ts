import { usePlatform } from './use-platform';

export const useTouchOptimization = () => {
  const { isTouch, platform } = usePlatform();
  
  const getTouchClass = (baseClass: string = '') => {
    return isTouch ? `${baseClass} min-h-[44px] min-w-[44px] active:scale-95` : baseClass;
  };

  const getAriaProps = (label: string) => ({
    'aria-label': label,
    role: 'button' as const,
  });

  return { isTouch, platform, getTouchClass, getAriaProps };
};
