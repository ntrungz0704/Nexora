import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { bindQueryClientToAuthEvents, handleCrossTabAuthStorageEvent } from '../lib/authQueryCache';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [sessionEpoch, setSessionEpoch] = useState(0);

  useEffect(() => {
    const unbindAuthEvents = bindQueryClientToAuthEvents(queryClient);

    const onStorage = (event: StorageEvent) => {
      if (handleCrossTabAuthStorageEvent(event, queryClient)) {
        setSessionEpoch((prev) => prev + 1);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      unbindAuthEvents();
      window.removeEventListener('storage', onStorage);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Fragment key={sessionEpoch}>{children}</Fragment>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
