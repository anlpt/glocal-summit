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

/** Organization logo. Falls back to a monogram badge when no image exists. */
export default function Logo({ org, src, size = 40 }: LogoProps) {
  const path = src ?? logoForOrg(org);
  const label = org || 'Organization';
  if (path) {
    return (
      <img
        className="org-logo"
        src={path}
        alt={label}
        width={size}
        height={size}
        loading="lazy"
        title={label}
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
