import type { Node, Edge } from 'reactflow';

// Types for different JSON node types
export type JsonNodeType = 'object' | 'array' | 'primitive';

export interface TreeNode {
  id: string;
  path: string;
  label: string;
  value: unknown;
  type: JsonNodeType;
  children: TreeNode[];
}

export function jsonToTree(
  data: unknown,
  parentPath: string = '$'
): TreeNode[] {
  if (data === null || data === undefined) {
    return [
      {
        id: parentPath,
        path: parentPath,
        label: `${parentPath === '$' ? 'root' : parentPath.split('.').pop() || parentPath}: null`,
        value: null,
        type: 'primitive',
        children: [],
      },
    ];
  }

  if (typeof data !== 'object') {
    const label = parentPath === '$' 
      ? `root: ${String(data)}` 
      : `${parentPath.split('.').pop() || parentPath}: ${String(data)}`;
    
    return [
      {
        id: parentPath,
        path: parentPath,
        label,
        value: data,
        type: 'primitive',
        children: [],
      },
    ];
  }

  if (Array.isArray(data)) {
    const arrayNode: TreeNode = {
      id: parentPath,
      path: parentPath,
      label: parentPath === '$' ? 'root: [Array]' : `${parentPath.split('.').pop() || parentPath}: [Array(${data.length})]`,
      value: data,
      type: 'array',
      children: [],
    };

    data.forEach((item, index) => {
      const itemPath = `${parentPath}[${index}]`;
      const childNodes = jsonToTree(item, itemPath);
      arrayNode.children.push(...childNodes);
    });

    return [arrayNode];
  }

  const objectNode: TreeNode = {
    id: parentPath,
    path: parentPath,
    label: parentPath === '$' ? 'root: {Object}' : `${parentPath.split('.').pop() || parentPath}: {Object}`,
    value: data,
    type: 'object',
    children: [],
  };

  Object.keys(data).forEach((key) => {
    const childPath = parentPath === '$' ? `$.${key}` : `${parentPath}.${key}`;
    const childNodes = jsonToTree((data as Record<string, unknown>)[key], childPath);
    objectNode.children.push(...childNodes);
  });

  return [objectNode];
}

export function treeToFlow(
  treeNodes: TreeNode[],
  startX: number = 400,
  startY: number = 50
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  if (treeNodes.length === 0) return { nodes, edges };

  const root = treeNodes[0];
  
  interface QueueItem {
    treeNode: TreeNode;
    parentNode: Node | null;
    x: number;
    y: number;
  }

  const queue: QueueItem[] = [
    {
      treeNode: root,
      parentNode: null,
      x: startX,
      y: startY,
    },
  ];

  const levelYPositions: Record<number, number> = { 0: startY };

  while (queue.length > 0) {
    const { treeNode, parentNode, x, y } = queue.shift()!;
    const level = treeNode.path.split(/[\.\[\]]/).length - 1;
    
    const flowNode: Node = {
      id: treeNode.id,
      type: 'jsonNode',
      position: { x, y },
      data: {
        label: treeNode.label,
        path: treeNode.path,
        value: treeNode.value,
        nodeType: treeNode.type,
      },
      style: {
        backgroundColor: getNodeColor(treeNode.type),
        color: '#fff',
        border: '2px solid',
        borderColor: getBorderColor(treeNode.type),
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '150px',
        textAlign: 'center',
      },
    };

    nodes.push(flowNode);

    if (parentNode) {
      edges.push({
        id: `${parentNode.id}-${treeNode.id}`,
        source: parentNode.id,
        target: treeNode.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      });
    }

    if (treeNode.children.length > 0) {
      const childCount = treeNode.children.length;
      const childY = levelYPositions[level + 1] || y + 320;
      levelYPositions[level + 1] = childY + 280;

      const horizontalSpacing = 320;
      const spacing = Math.max(360, childCount * horizontalSpacing);
      const startChildX = x - spacing / 2 + 160;

      treeNode.children.forEach((child, index) => {
        const childX = startChildX + (index * horizontalSpacing);
        queue.push({
          treeNode: child,
          parentNode: flowNode,
          x: childX,
          y: childY,
        });
      });
    }
  }

  return { nodes, edges };
}

/**
 * Get color for different node types
 */
function getNodeColor(type: JsonNodeType): string {
  switch (type) {
    case 'object':
      return '#6366f1'; // Indigo/Blue
    case 'array':
      return '#22c55e'; // Green
    case 'primitive':
      return '#f59e0b'; // Orange/Amber
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Get border color for different node types
 */
function getBorderColor(type: JsonNodeType): string {
  switch (type) {
    case 'object':
      return '#4f46e5';
    case 'array':
      return '#16a34a';
    case 'primitive':
      return '#d97706';
    default:
      return '#4b5563';
  }
}

/**
 * Find node by JSON path
 * 
 * LOGIC: Search through tree nodes to find matching path
 */
export function findNodeByPath(treeNodes: TreeNode[], path: string): TreeNode | null {
  for (const node of treeNodes) {
    if (node.path === path) {
      return node;
    }
    const found = findNodeByPath(node.children, path);
    if (found) return found;
  }
  return null;
}

