interface GBPLocation {
  id: string;
  name: string;
  address: string;
}

interface GBPApiAccount {
  name: string;
  accountName?: string;
  type?: string;
}

interface GBPApiLocation {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
}

function formatAddress(addr: GBPApiLocation['storefrontAddress']): string {
  if (!addr) return '';
  const parts = [
    ...(addr.addressLines ?? []),
    addr.locality,
    addr.administrativeArea,
    addr.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

export async function fetchGoogleBusinessLocations(accessToken: string): Promise<GBPLocation[]> {
  const accountsRes = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!accountsRes.ok) {
    const body = await accountsRes.text();
    throw new Error(`Failed to fetch Google accounts (${accountsRes.status}): ${body}`);
  }

  const accountsData = await accountsRes.json();
  const accounts: GBPApiAccount[] = accountsData.accounts ?? [];

  const locations: GBPLocation[] = [];

  for (const account of accounts) {
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!locationsRes.ok) continue;

    const locationsData = await locationsRes.json();
    for (const loc of (locationsData.locations ?? []) as GBPApiLocation[]) {
      locations.push({
        id: loc.name,
        name: loc.title ?? 'Unnamed Business',
        address: formatAddress(loc.storefrontAddress),
      });
    }
  }

  return locations;
}
