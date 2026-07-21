const WORLD_DIRS = {
  '1-浮光掠影': '1-modern',
  '2-寂土挽歌': '2-apocalypse',
  '3-尘寰问道': '3-ancient',
  '4-慕妮卡帝国': '0-munika',
  '5-星宇织梦': '5-science',
  '6-咒缚回响': '4-fantasy'
};

const FRONTMATTER_FIELD_KINDS = {
  world: 'scalar',
  storyTags: 'list',
  status: 'scalar',
  summary: 'scalar',
  detailLabel: 'scalar',
  isTemplated: 'boolean',
  missingItems: 'list',
  cgRefs: 'list',
  cgSequence: 'list',
  gameplayRefs: 'list',
  foreshadowing: 'list',
  plotTags: 'list',
  bondageTags: 'list',
  specialGameplay: 'list',
  characters: 'list',
  requiredAbilities: 'list',
  locations: 'list',
  reference: 'scalar'
};

export function applyStoryOutlineFrontmatter(outline, markdownModules) {
  const frontmatterByDirectoryAndTitle = createFrontmatterIndex(markdownModules);

  return outline.map((node) => applyNodeFrontmatter(node, frontmatterByDirectoryAndTitle));
}

export function parseMarkdownFrontmatter(markdown) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== '---') {
    return {};
  }

  const endIndex = lines.indexOf('---', 1);
  if (endIndex < 0) {
    return {};
  }

  const frontmatter = {};
  for (let index = 1; index < endIndex; index += 1) {
    const match = lines[index].match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const scalarValue = parseScalar(match[2].trim());
    const listValue = [];
    let listIndex = index + 1;

    while (listIndex < endIndex) {
      const listMatch = lines[listIndex].match(/^\s+-\s*(.*)$/);
      if (!listMatch) {
        break;
      }

      const item = parseScalar(listMatch[1].trim());
      if (item) {
        listValue.push(item);
      }
      listIndex += 1;
    }

    frontmatter[key] = listValue.length > 0 ? listValue : scalarValue;
    index = listIndex - 1;
  }

  return frontmatter;
}

export function parseMarkdownBody(markdown) {
  const lines = markdown.split(/\r?\n/);

  if (lines[0] !== '---') {
    return markdown.trim();
  }

  const endIndex = lines.indexOf('---', 1);
  if (endIndex < 0) {
    return markdown.trim();
  }

  return lines.slice(endIndex + 1).join('\n').trim();
}

function createFrontmatterIndex(markdownModules) {
  const index = new Map();

  Object.entries(markdownModules).forEach(([modulePath, markdown]) => {
    const directory = getDirectoryName(modulePath);
    const title = normalizeTitle(modulePath);
    const frontmatter = parseMarkdownFrontmatter(markdown);
    const detailMarkdown = parseMarkdownBody(markdown);

    if (!directory || !title || (!detailMarkdown && Object.keys(frontmatter).length === 0)) {
      return;
    }

    if (!index.has(directory)) {
      index.set(directory, new Map());
    }
    index.get(directory).set(title, {
      frontmatter,
      detailMarkdown,
      detailSourcePath: modulePath
    });
  });

  return index;
}

function applyNodeFrontmatter(node, frontmatterByDirectoryAndTitle) {
  const nextNode = {
    ...node,
    isTemplated: node.isTemplated === true,
    children: Array.isArray(node.children)
      ? node.children.map((child) => applyNodeFrontmatter(child, frontmatterByDirectoryAndTitle))
      : node.children
  };
  const markdownEntry = findFrontmatterForNode(node, frontmatterByDirectoryAndTitle);

  if (!markdownEntry) {
    return nextNode;
  }

  const { frontmatter, detailMarkdown, detailSourcePath } = markdownEntry;

  Object.entries(FRONTMATTER_FIELD_KINDS).forEach(([field, kind]) => {
    if (!Object.prototype.hasOwnProperty.call(frontmatter, field)) {
      return;
    }

    const value = resolveFrontmatterValue(frontmatter[field], kind);
    if (value === undefined) {
      return;
    }

    nextNode[field] = value;
  });

  nextNode.detailSourcePath = detailSourcePath;

  if (detailMarkdown) {
    nextNode.detailMarkdown = detailMarkdown;
  }

  return nextNode;
}

function findFrontmatterForNode(node, frontmatterByDirectoryAndTitle) {
  const directory = WORLD_DIRS[node.world];
  if (!directory) {
    return null;
  }

  const frontmatterByTitle = frontmatterByDirectoryAndTitle.get(directory);
  if (!frontmatterByTitle) {
    return null;
  }

  if (frontmatterByTitle.has(node.title)) {
    return frontmatterByTitle.get(node.title);
  }

  const matchingTitle = [...frontmatterByTitle.keys()].find(
    (title) => node.title.endsWith(title) || title.endsWith(node.title)
  );

  return matchingTitle ? frontmatterByTitle.get(matchingTitle) : null;
}

function resolveFrontmatterValue(rawValue, kind) {
  if (kind === 'boolean') {
    return toBoolean(rawValue);
  }

  if (kind === 'list') {
    const listValue = toList(rawValue);
    return listValue.length > 0 ? listValue : undefined;
  }

  const scalarValue = toScalar(rawValue);
  return scalarValue || undefined;
}

function toBoolean(value) {
  const scalarValue = toScalar(value).toLowerCase();

  if (['true', 'yes', '1'].includes(scalarValue)) {
    return true;
  }

  if (['false', 'no', '0'].includes(scalarValue)) {
    return false;
  }

  return undefined;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const scalarValue = toScalar(value);
  return scalarValue ? [scalarValue] : [];
}

function toScalar(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join('、');
  }

  return String(value ?? '').trim();
}

function getDirectoryName(modulePath) {
  const normalizedPath = modulePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/').filter(Boolean);

  return parts.length >= 2 ? parts[parts.length - 2] : '';
}

function normalizeTitle(modulePath) {
  const normalizedPath = modulePath.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop() ?? '';

  return filename
    .replace(/\.md$/i, '')
    .replace(/^\d+(?:\.\d+)*[-_\s]*/, '')
    .replace(/^[《「【\[]/, '')
    .replace(/[》」】\]]$/, '')
    .trim();
}

function parseScalar(value) {
  if (!value) {
    return '';
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
