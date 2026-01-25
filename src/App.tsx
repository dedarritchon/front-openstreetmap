import { DefaultStyleProvider } from '@frontapp/ui-kit';
import { createGlobalStyle } from 'styled-components';

import OpenStreetMapApp from './components/OpenStreetMapApp';
import { FrontContextProvider } from './context/FrontContextProvider';

// Global styles to prevent overflow issues in iframe
const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }
  
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  #root {
    height: 100%;
    overflow: hidden;
  }
`;

function App() {
  return (
    <DefaultStyleProvider>
      <GlobalStyle />
      <FrontContextProvider>
        <OpenStreetMapApp />
      </FrontContextProvider>
    </DefaultStyleProvider>
  );
}

export default App;
