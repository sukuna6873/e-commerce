import { NavLink, Outlet } from "react-router-dom";
import { useStore } from "../../store/StoreContext";
import { AlertIcon, BoxIcon, DashboardIcon, PackageIcon } from "../../components/Icons";
import { Button } from "../../components/Primitives";

const LINKS = [
  { to: "/admin", label: "Dashboard", Icon: DashboardIcon, end: true },
  { to: "/admin/products", label: "Products", Icon: BoxIcon, end: false },
  { to: "/admin/inventory", label: "Inventory", Icon: PackageIcon, end: false },
  { to: "/admin/orders", label: "Orders", Icon: PackageIcon, end: false },
];

export function AdminLayout() {
  const { user, resetEverything, notify } = useStore();

  return (
    <div className="shell py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-ink"
            style={{ background: `hsl(${user?.avatarHue ?? 24} 70% 62%)` }}
            aria-hidden
          >
            {user?.name.charAt(0)}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-fg">Admin</h1>
            <p className="text-sm text-fg-3">{user?.name} · operations</p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            resetEverything();
            notify("Demo data reset to the original catalog", "info");
          }}
        >
          Reset demo data
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
        <nav aria-label="Admin sections">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map(({ to, label, Icon, end }) => (
              <li key={to} className="shrink-0 lg:shrink">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-surface-3 text-fg"
                        : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                    }`
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden rounded-xl border border-line bg-surface-2 p-4 lg:block">
            <p className="flex items-center gap-2 text-xs font-semibold text-fg-2">
              <AlertIcon size={14} className="text-warning" />
              Demonstration data
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-3">
              Inventory edits and order status changes persist to this browser’s localStorage.
              Reset to restore the seeded catalog.
            </p>
          </div>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}