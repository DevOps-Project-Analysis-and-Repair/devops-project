import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
  <>
    <Outlet />
  </>
);

const NotFoundComponent = () => (
    <>
        Page not found!
    </>
);

export const Route = createRootRoute({
    component: RootLayout, 
    notFoundComponent: NotFoundComponent
});
