import { NavLink } from 'react-router-dom';
import './header.css';

const LINKS = [
  { to: '/', label: 'Select', end: true },
  { to: '/live', label: 'Live', end: false },
  { to: '/admin', label: 'Admin', end: false },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__brand" end>
          <span className="site-header__mark">RTD</span>
          <span className="site-header__title">Glocal Summit</span>
        </NavLink>
        <nav className="site-header__nav" aria-label="Main navigation">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                'site-header__link' + (isActive ? ' is-active' : '')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
