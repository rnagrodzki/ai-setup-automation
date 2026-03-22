const docRoutes = {
  'architecture.md': '/ai-setup-automation/architecture/',
  'getting-started.md': '/ai-setup-automation/getting-started/',
  'adding-skills.md': '/ai-setup-automation/guides/adding-skills/',
  'adding-commands.md': '/ai-setup-automation/guides/adding-commands/',
  'adding-hooks.md': '/ai-setup-automation/guides/adding-hooks/',
  'plugin-ai-setup-automation.md': '/ai-setup-automation/guides/plugin-reference/',
};

function visitLinks(node, fn) {
  if (node.type === 'link') fn(node);
  if (node.children) node.children.forEach(child => visitLinks(child, fn));
}

export default function remarkRewriteLinks() {
  return function transformer(tree) {
    visitLinks(tree, (node) => {
      const url = node.url;
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return;
      }
      const mdMatch = url.match(/^(.*\.md)(#.*)?$/);
      if (!mdMatch) return;
      const [, mdPath, anchor = ''] = mdMatch;
      if (mdPath === '../README.md') {
        node.url = 'https://github.com/rnagrodzki/ai-setup-automation/blob/main/README.md' + anchor;
        return;
      }
      const skillsPrefixMatch = mdPath.match(/^skills\/(.+)\.md$/);
      if (skillsPrefixMatch) {
        // Strip 'aisa-' prefix if present (docs reference aisa-init.md but files are init.md)
        const slug = skillsPrefixMatch[1].replace(/^aisa-/, '');
        node.url = `/ai-setup-automation/skills/${slug}/` + anchor;
        return;
      }
      if (Object.prototype.hasOwnProperty.call(docRoutes, mdPath)) {
        node.url = docRoutes[mdPath] + anchor;
        return;
      }
      const bareSlugMatch = mdPath.match(/^([^/]+)\.md$/);
      if (bareSlugMatch) {
        const slug = bareSlugMatch[1].replace(/^aisa-/, '');
        node.url = `/ai-setup-automation/skills/${slug}/` + anchor;
        return;
      }
    });
  };
}
