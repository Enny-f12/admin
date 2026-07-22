// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
        queryCache: new QueryCache({
          onError: (error, query) => {
            const message = query.meta?.errorMessage as string | null | undefined;
            if (message === null) return;
            toast.error(message ?? 'Something went wrong');
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _v, _c, mutation) => {
            const message = mutation.meta?.errorMessage as string | undefined;
            toast.error(message ?? 'Action failed. Please try again.');
          },
          onSuccess: (_d, _v, _c, mutation) => {
            const message = mutation.meta?.successMessage as string | undefined;
            if (message) toast.success(message);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}