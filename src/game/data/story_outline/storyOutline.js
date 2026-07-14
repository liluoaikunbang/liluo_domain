import { applyStoryOutlineFrontmatter } from './storyOutlineFrontmatter';
import { storyOutlineSource } from './storyOutlineSource';
import { buildStoryOutlineTree } from './storyOutlineTreeBuilder';

const markdownModules = import.meta.glob('./**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

export const storyOutline = applyStoryOutlineFrontmatter(
  buildStoryOutlineTree(storyOutlineSource),
  markdownModules
);
