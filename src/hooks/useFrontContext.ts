import { useContext } from 'react';

import { FrontContext } from '../context/FrontContext';

export const useFrontContext = () => {
  const context = useContext(FrontContext);
  return context;
};
