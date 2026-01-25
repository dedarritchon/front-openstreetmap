import Front from '@frontapp/plugin-sdk';
import type { WebViewContext } from '@frontapp/plugin-sdk/dist/webViewSdkTypes';
import { type ReactNode, useEffect, useState } from 'react';

import { FrontContext } from './FrontContext';

export function FrontContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<WebViewContext>();

  useEffect(() => {
    const sub = Front.contextUpdates.subscribe((context) => {
      setContext(context);
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <FrontContext.Provider value={context}>{children}</FrontContext.Provider>
  );
}
