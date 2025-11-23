import CompressorPage from './pages/CompressorPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '图片压缩',
    path: '/',
    element: <CompressorPage />
  }
];

export default routes;