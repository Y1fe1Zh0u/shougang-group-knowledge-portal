import wikiData from './wikiData.json';

export interface WikiEntry {
  id: string;
  name: string;
  domain: string;
  body: string;
  references: string[];
}

export interface WikiListItem {
  id: string;
  name: string;
  domain: string;
}

export const WIKI_ENTRIES: WikiEntry[] = wikiData as WikiEntry[];

export const WIKI_LIST_ITEMS: WikiListItem[] = WIKI_ENTRIES.map((entry) => ({
  id: entry.id,
  name: entry.name,
  domain: entry.domain,
}));

export function getWikiEntry(id: string | undefined): WikiEntry | undefined {
  if (!id) return undefined;
  return WIKI_ENTRIES.find((entry) => entry.id === id);
}
