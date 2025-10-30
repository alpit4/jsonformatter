import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { JsonNode } from "./components/JsonNode";
import { jsonToTree, treeToFlow } from "./utils/jsonToTree";
import { searchNodes } from "./utils/searchUtils";
import html2canvas from "html2canvas";

// Sample JSON data
const SAMPLE_JSON = {
  user: {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    address: {
      street: "123 Main St",
      city: "New York",
      country: "USA",
    },
    hobbies: ["reading", "coding", "traveling"],
  },
  items: [
    { id: 1, name: "Item 1", price: 29.99 },
    { id: 2, name: "Item 2", price: 39.99 },
  ],
  settings: {
    theme: "dark",
    notifications: true,
  },
};

const nodeTypes = { jsonNode: JsonNode };

// Internal component to access useReactFlow hook
function FlowView({
  nodes,
  isDarkMode,
  reactFlowRef,
}: {
  nodes: Node[];
  isDarkMode: boolean;
  reactFlowRef: React.RefObject<{ fitView: () => void } | null>;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (reactFlowRef.current) {
      reactFlowRef.current.fitView = () => fitView({ duration: 400 });
    }
  }, [fitView, reactFlowRef]);

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ duration: 400 });
      }, 200);
    }
  }, [nodes.length, fitView]);

  return (
    <>
      <Background
        gap={12}
        size={1}
        color={isDarkMode ? "#374151" : "#e5e7eb"}
        style={{
          backgroundColor: "transparent",
        }}
      />
      <Controls
        style={{
          backgroundColor: isDarkMode ? "#374151" : "#ffffff",
          border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
        }}
      />
    </>
  );
}

function App() {
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(SAMPLE_JSON, null, 2)
  );
  const [jsonError, setJsonError] = useState<string>("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchPath, setSearchPath] = useState<string>("");
  const [, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [clickedNode, setClickedNode] = useState<{
    path: string;
    value: string;
  } | null>(null);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Apply dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleVisualize = useCallback(() => {
    setJsonError("");
    setHighlightedNodes(new Set());
    setSearchMessage("");

    try {
      if (!jsonInput.trim()) {
        setJsonError("Please enter JSON data");
        setNodes([]);
        setEdges([]);
        return;
      }

      const parsedJson = JSON.parse(jsonInput);
      const treeStructure = jsonToTree(parsedJson);

      if (!treeStructure || treeStructure.length === 0) {
        setJsonError("Unable to parse JSON structure");
        setNodes([]);
        setEdges([]);
        return;
      }

      const { nodes: flowNodes, edges: flowEdges } = treeToFlow(treeStructure);

      setNodes(flowNodes);
      setEdges(flowEdges);

      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView();
        }
      }, 500);
    } catch (error) {
      console.error("Error generating tree:", error);
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      setNodes([]);
      setEdges([]);
    }
  }, [jsonInput]);

  const handleSearch = useCallback(() => {
    if (!searchPath.trim()) {
      setHighlightedNodes(new Set());
      setSearchMessage("");
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: false,
          },
        }))
      );
      return;
    }

    const matchingNodeIds = searchNodes(nodes, searchPath);

    if (matchingNodeIds.length > 0) {
      setHighlightedNodes(new Set(matchingNodeIds));
      setSearchMessage(`${matchingNodeIds.length} match(es) found`);

      // Update nodes with highlight
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: matchingNodeIds.includes(node.id),
          },
        }))
      );

      // Center view on first match
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView();
        }
      }, 100);
    } else {
      setHighlightedNodes(new Set());
      setSearchMessage("No match found");
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: false,
          },
        }))
      );
    }
  }, [searchPath, nodes]);

  const handleCopyInput = useCallback(() => {
    navigator.clipboard.writeText(jsonInput);
    setSearchMessage("JSON copied to clipboard!");
    setTimeout(() => setSearchMessage(""), 2000);
  }, [jsonInput]);

  const handleClearInput = useCallback(() => {
    setJsonInput("");
    setJsonError("");
    setNodes([]);
    setEdges([]);
    setSearchPath("");
    setHighlightedNodes(new Set());
    setSearchMessage("");
    setClickedNode(null);
  }, []);

  const handleDownloadImage = useCallback(async () => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement;
    if (!flowElement) return;

    try {
      const canvas = await html2canvas(flowElement, {
        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
        scale: 2,
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "json-tree-visualization.png";
      link.href = url;
      link.click();

      setSearchMessage("Image downloaded!");
      setTimeout(() => setSearchMessage(""), 2000);
    } catch (error) {
      setSearchMessage("Failed to download image");
      setTimeout(() => setSearchMessage(""), 2000);
    }
  }, [isDarkMode]);

  const handleNodeClick = useCallback((_event: unknown, node: Node) => {
    const path = String(node.data.path || "");
    const value = String(node.data.value ?? "N/A");
    setClickedNode({ path, value });
    if (path) setSearchPath(path);
  }, []);

  return (
    <div
      className="h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: isDarkMode ? "#000000" : "#f5f5f5",
      }}
    >
      <nav
        className="w-full shadow-md border-b transition-colors duration-200"
        style={{
          backgroundColor: isDarkMode ? "#000000" : "#ffffff",
          borderColor: isDarkMode ? "#333333" : "#e5e7eb",
        }}
      >
        <div className="max-w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl font-bold transition-colors duration-200 px-2 py-1"
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
              }}
            >
              JSON Tree Visualizer
            </h1>
            <label className="flex items-center gap-3 select-none px-2 py-1">
              <span
                className="text-sm"
                style={{ color: isDarkMode ? "#ffffff" : "#000000" }}
              >
                {isDarkMode ? "Dark" : "Light"}
              </span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                role="switch"
                aria-checked={isDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDarkMode
                    ? "bg-blue-600 focus-visible:ring-blue-400 focus-visible:ring-offset-black"
                    : "bg-gray-300 focus-visible:ring-gray-500 focus-visible:ring-offset-white"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div
          className="w-1/2 flex flex-col border-r transition-colors duration-200"
          style={{
            backgroundColor: isDarkMode ? "#000000" : "#ffffff",
            borderColor: isDarkMode ? "#333333" : "#d1d5db",
          }}
        >
          <div
            className="p-4 border-b transition-colors duration-200"
            style={{
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold transition-colors duration-200"
                style={{
                  color: isDarkMode ? "#ffffff" : "#000000",
                }}
              >
                JSON Input
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleClearInput}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Clear
                </button>
                <button
                  onClick={handleCopyInput}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Copy
                </button>
              </div>
            </div>

            {jsonError && (
              <div className="mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {jsonError}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON here...\n\nExample:\n{\n  "key": "value"\n}'
              className="w-full h-full p-4 rounded-lg border font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              style={{
                backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff",
                color: isDarkMode ? "#ffffff" : "#000000",
                borderColor: isDarkMode ? "#333333" : "#d1d5db",
              }}
            />
          </div>

          <div
            className="p-4 border-t transition-colors duration-200"
            style={{
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          >
            <button
              onClick={handleVisualize}
              className="w-full px-6 py-3 rounded-md font-bold text-white text-lg bg-emerald-600 hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Generate Tree
            </button>
          </div>
        </div>

        <div
          className="w-1/2 flex flex-col transition-colors duration-200"
          style={{
            backgroundColor: isDarkMode ? "#000000" : "#ffffff",
          }}
        >
          <div
            className="p-4 border-b transition-colors duration-200"
            style={{
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-lg font-semibold transition-colors duration-200"
                style={{
                  color: isDarkMode ? "#ffffff" : "#000000",
                }}
              >
                Tree Visualization
              </h2>
              <button
                onClick={handleDownloadImage}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                title="Download as image"
              >
                Download
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchPath}
                onChange={(e) => setSearchPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by JSON path (e.g., $.user.name or items[0])"
                className="flex-1 px-4 py-2 rounded-lg border font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                  color: isDarkMode ? "#ffffff" : "#000000",
                  borderColor: isDarkMode ? "#444444" : "#d1d5db",
                }}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                Search
              </button>
            </div>

            {searchMessage && (
              <div
                className={`mt-2 text-sm font-medium ${
                  searchMessage.includes("No match") ||
                  searchMessage.includes("Invalid")
                    ? "text-red-400"
                    : searchMessage.includes("Copied") ||
                      searchMessage.includes("downloaded")
                    ? "text-green-400"
                    : "text-blue-400"
                }`}
              >
                {searchMessage}
              </div>
            )}

            <div
              className="p-3 mt-2 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: isDarkMode ? "#1a1a1a" : "#f3f4f6",
                color: isDarkMode ? "#ffffff" : "#1f2937",
                border: `1px solid ${isDarkMode ? "#444444" : "#d1d5db"}`,
                minHeight: "80px",
              }}
            >
              {clickedNode ? (
                <>
                  <div>
                    <strong>Path:</strong> {clickedNode.path}
                  </div>
                  <div>
                    <strong>Value:</strong> {clickedNode.value}
                  </div>
                </>
              ) : (
                <div
                  className="text-sm italic"
                  style={{ color: isDarkMode ? "#aaaaaa" : "#777777" }}
                >
                  Click a node to view its full path and value here.
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            {nodes.length > 0 ? (
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodeClick={handleNodeClick}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  selectionOnDrag={false}
                  panOnScroll
                  zoomOnScroll
                  onPaneClick={() => setClickedNode(null)}
                  fitView
                  onInit={(instance) => {
                    reactFlowInstance.current = instance;
                  }}
                >
                  <FlowView
                    nodes={nodes}
                    isDarkMode={isDarkMode}
                    reactFlowRef={reactFlowInstance}
                  />
                </ReactFlow>
              </ReactFlowProvider>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center transition-colors duration-200"
                style={{
                  color: isDarkMode ? "#888888" : "#999999",
                }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4"></div>
                  <p className="text-lg font-medium">No tree generated yet</p>
                  <p className="text-sm mt-2">
                    Enter JSON data and click "Generate Tree"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
