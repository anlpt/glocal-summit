// Fetch org logos into public/logos/ and emit src/data/logos.ts (org -> path).
// Best-effort: obscure orgs may be skipped; fix them in the CMS.
// Run: npm run logos
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedParticipants } from '../src/data/seed.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public/logos');
mkdirSync(outDir, { recursive: true });

// Cleaned-org-string -> domain. Add/adjust as needed.
const DOMAINS = {
  'UNDP Asia and the Pacific': 'undp.org',
  'Hue Institute for Development Studies': 'hueids.vn',
  'School of Architecture and Planning University of Auckland': 'auckland.ac.nz',
  'UN-Habitat': 'unhabitat.org',
  'Lee Kuan Yew Centre for Innovative Cities, SUTD': 'sutd.edu.sg',
  'University of Trieste': 'units.it',
  'Hasselt University': 'uhasselt.be',
  'OMGEVING': 'omgeving.be',
  'Center for Anticipatory Urban Strategies,Ulsan National Institute of Science and Technology Department of Civil, Urban, Earth, and Environmental Engineering':
    'unist.ac.kr',
  'Korea Institute of Civil Engineering and Building Technology': 'kict.re.kr',
  'Korea Institute of Civil Engineering and Building Technology (KICT)': 'kict.re.kr',
  'Thammasat University': 'tu.ac.th',
  'Maha Sarakham University': 'msu.ac.th',
  'National Taiwan Ocean University': 'ntou.edu.tw',
  'National United University, Taiwan': 'nuu.edu.tw',
  'Kwangwoon University Opticmix': 'kw.ac.kr',
  'Immersive Content Display Center, Deparment of Content Convergence, Kwangwoon University': 'kw.ac.kr',
  'Department of Computer Engineering, Sejong University': 'sejong.ac.kr',
  'Handong Global University': 'handong.edu',
  'College of Design, North Carolina State University': 'ncsu.edu',
  'North Carolina State University': 'ncsu.edu',
  'Leipzig University': 'uni-leipzig.de',
  'University of Zurich Leipzig University': 'uzh.ch',
  'Department for Tourism and Transport, University of Applied Sciences, Worms': 'hs-worms.de',
  'Faculty of Xinya College, Tsinghua University': 'tsinghua.edu.cn',
  'Universiti Sains Malaysia': 'usm.my',
  'Universiti Teknologi Malaysia (UTM)': 'utm.my',
  'University of Economics Ho Chi Minh City': 'ueh.edu.vn',
  'UEH': 'ueh.edu.vn',
  'University of Saint Joseph': 'usj.edu.mo',
  'Consulate General of the Republic of Indonesia': 'kemlu.go.id',
  'ISC Innovation and Technology Incubation Center': 'ueh.edu.vn',
  'Binh My Commune, Ho Chi Minh City': 'hochiminhcity.gov.vn',
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Accept only real raster/icon images (reject HTML error pages, empty blobs).
function isImage(buf) {
  if (buf.length < 100) return false;
  const b = buf;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const gif = b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46;
  const ico = b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00;
  const bmp = b[0] === 0x42 && b[1] === 0x4d;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
  return png || jpg || gif || ico || bmp || webp;
}

async function download(url, dest) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (logo-fetch)' },
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!isImage(buf)) return false; // reject HTML/blank
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

// Try several logo/favicon sources in quality order until one lands.
async function fetchLogo(domain, dest) {
  const sources = [
    `https://logo.clearbit.com/${domain}?size=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://icons.duckduckgo.com/ip3/www.${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://${domain}/favicon.ico`,
    `https://www.${domain}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
  for (const url of sources) {
    if (await download(url, dest)) return true;
  }
  return false;
}

const orgs = [...new Set(seedParticipants.map((p) => p.org).filter(Boolean))];
const map = {}; // org -> /logos/xxx.png
let hits = 0;

for (const org of orgs) {
  const domain = DOMAINS[org];
  if (!domain) { map[org] = null; continue; }
  const file = `${slug(org)}.png`;
  const dest = resolve(outDir, file);
  const rel = `/logos/${file}`;
  // Re-fetch missing files only; keep ones already downloaded.
  if (existsSync(dest)) { map[org] = rel; hits++; continue; }

  const ok = await fetchLogo(domain, dest);
  if (ok) { map[org] = rel; hits++; console.log('  ✓', org, '→', domain); }
  else { map[org] = null; console.log('  ✗', org, '(', domain, ')'); }
}

const ts = `// AUTO-GENERATED by scripts/fetch-logos.mjs.
// org string -> local logo path (null = none yet; set via CMS).
const LOGO_MAP: Record<string, string | null> = ${JSON.stringify(map, null, 2)};

export function logoForOrg(org: string | null | undefined): string | null {
  if (!org) return null;
  return LOGO_MAP[org.replace(/\\s+/g, ' ').trim()] ?? null;
}
`;
writeFileSync(resolve(root, 'src/data/logos.ts'), ts);
console.log(`\nLogos: ${hits}/${orgs.length} orgs matched.`);
