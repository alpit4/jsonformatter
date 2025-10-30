import { memo, useMemo } from "react";
import { Handle, Position } from "reactflow";
import type { JsonNodeType } from "../utils/jsonToTree";

interface JsonNodeProps {
  data: {
    label: string;
    path: string;
    value: unknown;
    nodeType: JsonNodeType;
    isHighlighted?: boolean;
  };
}

function getNodeColor(type: JsonNodeType): string {
  switch (type) {
    case "object":
      return "#6366f1";
    case "array":
      return "#22c55e";
    case "primitive":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

function getBorderColor(type: JsonNodeType): string {
  switch (type) {
    case "object":
      return "#4f46e5";
    case "array":
      return "#16a34a";
    case "primitive":
      return "#d97706";
    default:
      return "#4b5563";
  }
}

function JsonNodeComponent({ data }: JsonNodeProps) {
  const { label, value, nodeType, isHighlighted } = data;

  const getValuePreview = (): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") {
      const str = value.trim();
      return `"${str.length > 50 ? str.substring(0, 50) + "..." : str}"`;
    }
    if (typeof value === "object") {
      if (Array.isArray(value)) return `[${value.length} items]`;
      return `{${Object.keys(value).length} keys}`;
    }
    return String(value);
  };

  const nodeStyles = useMemo(() => {
    const bgColor = getNodeColor(nodeType);
    const borderColor = isHighlighted ? "#ef4444" : getBorderColor(nodeType);
    const boxShadow = isHighlighted
      ? "0 0 20px rgba(239, 68, 68, 0.5)"
      : "0 4px 6px rgba(0, 0, 0, 0.1)";

    return {
      backgroundColor: bgColor,
      border: `3px solid ${borderColor}`,
      borderRadius: "8px",
      padding: "12px 16px",
      minWidth: "150px",
      color: "#fff",
      textAlign: "center" as const,
      fontSize: "13px",
      fontWeight: "500",
      boxShadow: boxShadow,
      cursor: "default",
      pointerEvents: "auto" as const,
      willChange: "auto" as const,
    };
  }, [nodeType, isHighlighted]);

  return (
    <div className="json-node" style={{ ...nodeStyles, cursor: "pointer" }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#555",
          width: "10px",
          height: "10px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          wordBreak: "break-word",
          maxWidth: "200px",
          lineHeight: "1.4",
        }}
      >
        {label}
        {nodeType === "primitive" && value !== null && value !== undefined && (
          <span style={{ display: "block", fontSize: "11px", opacity: 0.8 }}>
            {getValuePreview()}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#555",
          width: "10px",
          height: "10px",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export const JsonNode = memo(JsonNodeComponent);
