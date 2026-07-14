export function buildStoryOutlineTree(source) {
  const nodes = Array.isArray(source?.nodes) ? source.nodes : [];
  const rootKeys = Array.isArray(source?.rootKeys) ? source.rootKeys : [];
  const nodeByKey = new Map();

  nodes.forEach((node) => {
    if (!node?.key) {
      throw new Error('故事大纲扁平节点缺少 key。');
    }

    if (nodeByKey.has(node.key)) {
      throw new Error(`故事大纲存在重复 key：${node.key}`);
    }

    nodeByKey.set(node.key, node);
  });

  const childrenByParentKey = new Map();

  nodes.forEach((node) => {
    if (!node.parentKey) {
      return;
    }

    if (!nodeByKey.has(node.parentKey)) {
      throw new Error(`故事大纲节点 ${node.key} 找不到父节点：${node.parentKey}`);
    }

    if (!childrenByParentKey.has(node.parentKey)) {
      childrenByParentKey.set(node.parentKey, []);
    }

    childrenByParentKey.get(node.parentKey).push(node);
  });

  return rootKeys.map((rootKey) => {
    const rootNode = nodeByKey.get(rootKey);

    if (!rootNode) {
      throw new Error(`故事大纲根节点不存在：${rootKey}`);
    }

    return createTreeNode(rootNode, childrenByParentKey);
  });
}

function createTreeNode(node, childrenByParentKey) {
  const { parentKey, order, ...treeNode } = cloneSerializableNode(node);
  const children = (childrenByParentKey.get(node.key) ?? [])
    .slice()
    .sort(compareStoryNodeOrder)
    .map((child) => createTreeNode(child, childrenByParentKey));

  if (children.length > 0) {
    treeNode.children = children;
  }

  return treeNode;
}

function compareStoryNodeOrder(leftNode, rightNode) {
  const leftOrder = Number.isFinite(leftNode.order) ? leftNode.order : 0;
  const rightOrder = Number.isFinite(rightNode.order) ? rightNode.order : 0;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return String(leftNode.key).localeCompare(String(rightNode.key));
}

function cloneSerializableNode(node) {
  return JSON.parse(JSON.stringify(node));
}
