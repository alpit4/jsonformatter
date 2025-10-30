# JSON Tree Visualizer

Visualize JSON as a tree using React Flow (React + TypeScript + Tailwind).

## Features

- JSON input with validation
- Color-coded nodes (object/array/primitive)
- Search by JSON path with highlighting and recentering
- Light/Dark toggle
- Clear input and Download as PNG

## Getting Started

```bash
npm install
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Usage

1. Paste JSON on the left and click Generate Tree.
2. Enter a path (e.g., `$.user.name` or `items[0]`) and press Enter or click Search.
3. Click a node to view its full path and value above the canvas.
4. Use Download to export the visualization as an image.
