import type { Node } from 'reactflow';

export function searchNodes(nodes: Node[], searchPath: string): string[] {
  if (!searchPath.trim()) return [];

  const normalizedSearch = searchPath.trim();
  const searchPattern = normalizedSearch.startsWith('$') 
    ? normalizedSearch 
    : `$.${normalizedSearch}`;

  const matchingNodeIds: string[] = [];

  nodes.forEach((node) => {
    const nodePath = node.data.path || '';
    
    if (nodePath === searchPattern) {
      matchingNodeIds.push(node.id);
    }
    else if (nodePath.includes(searchPattern.replace('$.', '')) || 
             nodePath === searchPattern || 
             searchPattern.includes(nodePath)) {
      matchingNodeIds.push(node.id);
    }
  });

  return matchingNodeIds;
}

export function isValidJsonPath(path: string): boolean {
  if (!path.trim()) return false;
  
  const pathPattern = /^(\$?)(\.[a-zA-Z_][a-zA-Z0-9_]*|\[[0-9]+\])*$/;
  return pathPattern.test(path) || path.trim() !== '';
}

