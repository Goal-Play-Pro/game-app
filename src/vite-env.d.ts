/// <reference types="vite/client" />

// Definición de variables de entorno para Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Definición completa de la interfaz Ethereum para MetaMask
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
  isSafePal?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

interface SafePalProvider extends EthereumProvider {
  isSafePal?: boolean;
}

// Extend Window interface para ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
    safePal?: SafePalProvider;
  }
  
  // Añadir soporte para globalThis
  var globalThis: typeof globalThis & {
    importMeta?: {
      env: ImportMetaEnv;
    };
  };
}

export {};
