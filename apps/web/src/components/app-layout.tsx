import { LogOut, Menu, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import type { User } from '../api/auth';
import { useAuth, useSignedInUser } from '../features/auth/auth-context';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Logo } from './ui/logo';

interface NavItem {
  label: string;
  to: string;
  /** Only the exact path marks it as current, not its subpages. */
  end: boolean;
  providerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Agenda', to: '/dashboard', end: true, providerOnly: true },
  { label: 'Serviços', to: '/dashboard/services', end: false, providerOnly: true },
  { label: 'Horários', to: '/dashboard/availability', end: false, providerOnly: true },
  { label: 'Profissionais', to: '/providers', end: false },
  { label: 'Meus agendamentos', to: '/appointments', end: false },
];

function navItemsFor(role: User['role']) {
  return NAV_ITEMS.filter((item) => !item.providerOnly || role === 'PROVIDER');
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  const base = 'rounded-full px-3 py-1.5 text-sm font-medium transition-colors';
  return isActive
    ? `${base} bg-eucalyptus-50 text-eucalyptus-800`
    : `${base} text-muted hover:text-eucalyptus-800`;
}

export function AppLayout() {
  const { signOut } = useAuth();
  const user = useSignedInUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const items = navItemsFor(user.role);
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/providers" onClick={closeMenu} className="rounded-lg">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Avatar name={user.name} size="sm" />
            <span className="text-sm text-muted">Olá, {user.name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut aria-hidden="true" className="size-4" />
              Sair
            </Button>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
            className="rounded-full p-2 text-eucalyptus-800 hover:bg-eucalyptus-50 md:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-6" />
            ) : (
              <Menu aria-hidden="true" className="size-6" />
            )}
          </button>
        </div>

        {/* Mounted only while open: an always-present copy would duplicate every link and button. */}
        {menuOpen && (
          <div
            id={menuId}
            className="absolute inset-x-0 top-full border-b border-line bg-white px-4 pb-4 shadow-lift md:hidden"
          >
            <nav aria-label="Menu" className="flex flex-col gap-1 pt-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Avatar name={user.name} size="sm" />
                Olá, {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut aria-hidden="true" className="size-4" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
