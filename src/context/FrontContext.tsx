import type { WebViewContext } from '@frontapp/plugin-sdk/dist/webViewSdkTypes';
import { createContext } from 'react';

export const FrontContext = createContext<WebViewContext | undefined>(
  undefined
);
