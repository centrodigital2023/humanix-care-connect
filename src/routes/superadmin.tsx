import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/superadmin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }],
  }),
  component: SuperadminLayout,
});

function SuperadminLayout() {
  return <Outlet />;
}
