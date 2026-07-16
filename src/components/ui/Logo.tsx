import { useState } from 'react';
import { logoForOrg } from '../../lib/db.ts';
import './logo.css';

interface LogoProps {
  org: string | null | undefined;
  src?: string | null; // explicit override (e.g. participant.org_logo_url)
  size?: number;
}

function initials(org: string): string {
  const words = org.replace(/[(),.]/g, ' ').split(/\s+/).filter(Boolean);
  const skip = new Set(['of', 'and', 'the', 'for', 'de', 'la']);
  const picked = words.filter((w) => !skip.has(w.toLowerCase())).slice(0, 2);
  return (picked.length ? picked : words).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/** Resolve a stored logo path against the app base URL (so it works under
 *  GitHub Pages' /glocal-summit/ subpath). Data/http URLs pass through. */
function resolveSrc(path: string): string {
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Organization logo. Falls back to a monogram badge when no image exists
 *  or the image fails to load. */
export default function Logo({ org, src, size = 40 }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const path = src ?? logoForOrg(org);
  const label = org || 'Organization';

  if (path && !failed) {
    return (
      <img
        className="org-logo"
        src={resolveSrc(path)}
        alt={label}
        width={size}
        height={size}
        loading="lazy"
        title={label}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="org-logo org-logo--badge"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      title={label}
      aria-label={label}
    >
      {org ? initials(org) : '—'}
    </span>
  );
}
