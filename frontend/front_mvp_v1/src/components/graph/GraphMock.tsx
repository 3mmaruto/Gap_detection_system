import { graphEdges, graphNodes } from "../../data/mockData";

const statusClass: Record<string, string> = {
  "Target topic": "node-target",
  "Likely missed prerequisite": "node-missed",
  "Likely covered abroad": "node-covered",
  "Bridge outside studied path": "node-bridge",
  "Current target-grade path": "node-path",
};

export function GraphMock() {
  const nodeById = Object.fromEntries(graphNodes.map((node) => [node.id, node]));

  return (
    <div className="graph-canvas" aria-label="Mock knowledge graph visualization">
      <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {graphEdges.map(([sourceId, targetId]) => {
          const source = nodeById[sourceId];
          const target = nodeById[targetId];
          return (
            <line
              key={`${sourceId}-${targetId}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {graphNodes.map((node) => (
        <button
          key={node.id}
          className={`graph-node ${statusClass[node.status]}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          type="button"
          title={node.status}
        >
          <span>{node.label}</span>
        </button>
      ))}
    </div>
  );
}
