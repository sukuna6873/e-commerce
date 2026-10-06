import { NavLink, Outlet } from "react-router-dom";
import { useStore } from "../../store/StoreContext";
import { formatDate } from "../../lib/format";
import { HeartIcon, PackageIcon, UserIcon, ReturnIcon } from "../../components/Icons";

const LINKS = [
  { to: "/account", label: "Overview", Icon: UserIcon, end: true },
  { to: "/account/orders", label: "Orders", Icon: PackageIcon, end: false },
  { to: "/account/wishlist", label: "Wishlist", Icon: HeartIcon, end: false },
  { to: "/account/addresses", label: "Addresses", Icon: ReturnIcon, end: false },
];

/** Shared shell for every /account route: sidebar nav plus the routed outlet. */
export function AccountLayout() {
  const { user } = useStore();

  return (
    <div className="shell py-8">
      <div className="mb-8 flex items-center gap-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-ink"
          style={{ background: `hsl(${user?.avatarHue ?? 220} 70% 62%)` }}
          aria-hidden
        >
          {user?.name.charAt(0)}
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Your account</h1>
          <p className="text-sm text-fg-3">
            {user?.name} · joined {user ? formatDate(user.createdAt) : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
        <nav aria-label="Account sections">
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
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}