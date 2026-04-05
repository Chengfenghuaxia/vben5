export type TeamDomain = { domain: string; used: 1 | 2 };

export type TeamRecord = {
  domains: TeamDomain[];
  id: number;
  name: string;
  operator: string;
  updated_at: number;
};

function joinUrl(domains: TeamDomain[]): string {
  return domains.map((d) => d.domain).filter(Boolean).join(', ');
}

let nextId = 3;
export let teamRecords: TeamRecord[] = [
  {
    id: 1,
    name: '总代一组',
    domains: [
      { domain: 'promo-a.example.com', used: 1 },
      { domain: 'promo-b.example.com', used: 2 },
    ],
    updated_at: Math.floor(Date.now() / 1000),
    operator: 'admin',
  },
  {
    id: 2,
    name: '总代二组',
    domains: [{ domain: 'team2.example.com', used: 2 }],
    updated_at: Math.floor(Date.now() / 1000) - 7200,
    operator: 'admin',
  },
];

export function teamToListRow(r: TeamRecord) {
  return {
    id: r.id,
    name: r.name,
    url: joinUrl(r.domains),
    domains: r.domains.map((d) => ({ domain: d.domain, used: d.used })),
    updated_at: r.updated_at,
    operator: r.operator,
  };
}

export function addTeam(name: string, domainList: string[]): TeamRecord {
  const domains: TeamDomain[] = domainList.map((domain) => ({
    domain,
    used: 2 as const,
  }));
  const row: TeamRecord = {
    id: nextId++,
    name,
    domains,
    updated_at: Math.floor(Date.now() / 1000),
    operator: 'admin',
  };
  teamRecords.push(row);
  return row;
}

export function updateTeam(
  id: number,
  name: string,
  newDomains: string[],
): boolean {
  const idx = teamRecords.findIndex((t) => t.id === id);
  if (idx < 0) {
    return false;
  }
  const prev = teamRecords[idx];
  if (!prev) {
    return false;
  }
  const locked = new Map(
    prev.domains.filter((d) => d.used === 1).map((d) => [d.domain, d]),
  );
  const nextDomains: TeamDomain[] = [];
  for (const d of newDomains) {
    const existed = locked.get(d);
    if (existed) {
      nextDomains.push(existed);
    } else {
      nextDomains.push({ domain: d, used: 2 });
    }
  }
  teamRecords[idx] = {
    ...prev,
    name,
    domains: nextDomains,
    updated_at: Math.floor(Date.now() / 1000),
  };
  return true;
}

export function deleteTeams(ids: number[]) {
  const set = new Set(ids);
  teamRecords = teamRecords.filter((t) => !set.has(t.id));
}
