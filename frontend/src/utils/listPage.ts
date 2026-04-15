import { allTags, CFG, SPACES, SPACE_TAGS } from '../data/mock';

export function resolveListPageContext({
  domainName,
  spaceIdParam,
  tagParam,
}: {
  domainName?: string;
  spaceIdParam?: string;
  tagParam?: string;
}) {
  const matchedDomain = domainName ? CFG.domains.find((item) => item.name === domainName) : undefined;
  const parsedSpaceId = spaceIdParam ? Number(spaceIdParam) : undefined;
  const spaceId = matchedDomain ? matchedDomain.spaceId : parsedSpaceId;

  let pageTitle = '';
  let availableTags: string[] = [];

  if (spaceId) {
    const space = SPACES.find((sp) => sp.id === spaceId);
    pageTitle = matchedDomain?.name || space?.name || '知识空间';
    const spaceTags = SPACE_TAGS[spaceId];
    availableTags = spaceTags ? spaceTags.map((t) => t.name) : [];
  } else if (tagParam) {
    const sec = CFG.sections.find((ss) => ss.tag === tagParam);
    pageTitle = sec?.title || tagParam;
    availableTags = allTags();
  }

  return {
    matchedDomain,
    spaceId,
    pageTitle,
    availableTags,
  };
}
