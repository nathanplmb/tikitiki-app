import React, { Suspense, lazy } from 'react';

// three.js is ~600 kB: load the 3D viewer only when a user actually opens the 3D view.
const Viewer = lazy(() => import('./Cocktail3DViewer').then((m) => ({ default: m.Cocktail3DViewer })));

export const Cocktail3DViewer: React.FC<React.ComponentProps<typeof Viewer>> = (props) => (
  <Suspense fallback={<div className="w-full h-full min-h-[200px] animate-pulse rounded-2xl bg-white/5" />}>
    <Viewer {...props} />
  </Suspense>
);
