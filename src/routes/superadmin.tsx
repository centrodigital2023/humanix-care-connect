import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminLayout,
});

function SuperadminLayout() {
  return <Outlet />;
}
