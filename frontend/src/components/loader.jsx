// components/ui/global-spinner.jsx
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function GlobalSpinner({ className, icon: Icon = Loader2, size = 'default' }) {
  const sizeMap = { sm: 'size-5', default: 'size-8', lg: 'size-12' };
  return (
    <div className={cn('flex h-screen w-screen items-center justify-center bg-background', className)}>
      <Icon className={cn('animate-spin text-muted-foreground', sizeMap[size])} />
    </div>
  );
}