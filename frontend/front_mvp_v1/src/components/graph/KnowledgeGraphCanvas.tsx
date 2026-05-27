import cytoscape, { Core, EventObject, NodeSingular } from "cytoscape";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode, GraphResponse } from "../../types";

type SelectedNode = {
  id: string;
  label: string;
  status: string;
  group: string;
};

const statusTone: Record<string, string> = {
  target: "target",
  target_topic: "target",
  likely_missed_due_to_switch: "missed",
  likely_covered_abroad: "covered",
  bridge_available_outside_student_path: "bridge",
  currently_in_target_grade_path: "path",
  curriculum: "curriculum",
};

function labelFor(node: GraphNode) {
  return String(node.label || node.topic_name_en || node.id || "Topic");
}

function statusFor(node: GraphNode, curriculumOnly: boolean) {
  if (curriculumOnly) return "curriculum";
  const raw = String(node.status || node.type || "curriculum").toLowerCase();
  return statusTone[raw] || statusTone[String(node.type || "").toLowerCase()] || "curriculum";
}

function relationFor(edge: GraphEdge) {
  return String(edge.type || edge.relation_type || "prerequisite");
}

function isCurriculumGraph(nodes: GraphNode[], title?: string) {
  if (title?.toLowerCase().includes("curriculum")) return true;
  return nodes.length > 0 && nodes.every((node) => String(node.type || node.status || "").toLowerCase().includes("curriculum"));
}

function toCytoscapeElements(nodes: GraphNode[], edges: GraphEdge[], curriculumOnly: boolean) {
  const nodeIds = new Set(nodes.map((node) => String(node.id)));
  return [
    ...nodes.map((node) => {
      const status = statusFor(node, curriculumOnly);
      return {
        data: {
          id: String(node.id),
          label: labelFor(node),
          status,
          group: String(node.group || ""),
          type: String(node.type || ""),
        },
        classes: status,
      };
    }),
    ...edges
      .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
      .map((edge, index) => ({
        data: {
          id: `edge-${index}-${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
          label: relationFor(edge),
        },
      })),
  ];
}

export function KnowledgeGraphCanvas({
  graph,
  title = "Knowledge graph",
  subtitle,
}: {
  graph?: GraphResponse | null;
  title?: string;
  subtitle?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const curriculumOnly = useMemo(() => isCurriculumGraph(nodes, title), [nodes, title]);
  const elements = useMemo(() => toCytoscapeElements(nodes, edges, curriculumOnly), [nodes, edges, curriculumOnly]);

  useEffect(() => {
    if (!containerRef.current || !graph || nodes.length === 0) return undefined;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.22,
      maxZoom: 3.2,
      wheelSensitivity: 0.18,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#041627",
            "border-color": "#ffffff",
            "border-width": 2,
            height: 17,
            label: "",
            "overlay-opacity": 0,
            shape: "ellipse",
            width: 17,
          },
        },
        {
          selector: "node.target",
          style: { "background-color": "#fed65b", height: 22, width: 22 },
        },
        {
          selector: "node.missed",
          style: { "background-color": "#9b2626", height: 20, width: 20 },
        },
        {
          selector: "node.covered",
          style: { "background-color": "#27694a" },
        },
        {
          selector: "node.bridge",
          style: { "background-color": "#735c00" },
        },
        {
          selector: "node.path",
          style: { "background-color": "#8192a7" },
        },
        {
          selector: "node.curriculum",
          style: { "background-color": curriculumOnly ? "#1a2b3c" : "#041627" },
        },
        {
          selector: "node.hovered, node:selected",
          style: {
            "border-color": "#041627",
            "border-width": 4,
            "font-family": "Inter",
            "font-size": 11,
            "font-weight": 700,
            label: "data(label)",
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.94,
            "text-background-padding": "5px",
            "text-border-color": "#d9dcdf",
            "text-border-opacity": 1,
            "text-border-width": 1,
            "text-margin-y": -14,
            "text-max-width": "190px",
            "text-wrap": "wrap",
            "z-index": 10,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "line-color": curriculumOnly ? "#8794a3" : "#b2bbc5",
            "target-arrow-color": curriculumOnly ? "#8794a3" : "#b2bbc5",
            "target-arrow-shape": "triangle",
            width: curriculumOnly ? 1.7 : 1.45,
            opacity: curriculumOnly ? 0.7 : 0.58,
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge.hovered",
          style: {
            "font-family": "Inter",
            "font-size": 10,
            "font-weight": 800,
            label: "data(label)",
            "line-color": "#735c00",
            "target-arrow-color": "#735c00",
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.96,
            "text-background-padding": "4px",
            "text-border-color": "#d9dcdf",
            "text-border-opacity": 1,
            "text-border-width": 1,
            "z-index": 9,
          },
        },
      ],
      layout: {
        name: curriculumOnly ? "cose" : "cose",
        animate: false,
        fit: true,
        padding: 70,
        randomize: true,
        nodeRepulsion: curriculumOnly ? 900000 : 1200000,
        nodeOverlap: 30,
        idealEdgeLength: curriculumOnly ? 95 : 125,
        edgeElasticity: 90,
        nestingFactor: 1.2,
        gravity: curriculumOnly ? 0.45 : 0.32,
        numIter: 1300,
      },
    });

    cyRef.current = cy;
    cy.on("mouseover", "node", (event: EventObject) => {
      event.target.addClass("hovered");
    });
    cy.on("mouseout", "node", (event: EventObject) => {
      event.target.removeClass("hovered");
    });
    cy.on("mouseover", "edge", (event: EventObject) => {
      event.target.addClass("hovered");
    });
    cy.on("mouseout", "edge", (event: EventObject) => {
      event.target.removeClass("hovered");
    });
    cy.on("tap", "node", (event: EventObject) => {
      const node = event.target as NodeSingular;
      setSelected({
        id: node.id(),
        label: String(node.data("label") || node.id()),
        status: String(node.data("status") || "curriculum"),
        group: String(node.data("group") || "-"),
      });
    });
    cy.ready(() => {
      cy.fit(undefined, 70);
      cy.center();
    });

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
      cy.fit(undefined, 70);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [curriculumOnly, elements, graph, nodes.length]);

  const fitGraph = () => {
    cyRef.current?.fit(undefined, 70);
    cyRef.current?.center();
  };

  if (!graph || nodes.length === 0) {
    return (
      <div className="kg-empty-canvas">
        <strong>{title}</strong>
        <p>Run analysis or load a curriculum graph to draw real backend nodes and edges.</p>
      </div>
    );
  }

  return (
    <div className="kg-shell">
      <div className="kg-toolbar">
        <div>
          <h3>{title}</h3>
          <p>{subtitle || `${nodes.length} nodes / ${edges.length} edges`}</p>
        </div>
        <div className="kg-mode-pills">
          <button type="button" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}>+</button>
          <button type="button" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}>-</button>
          <button type="button" onClick={fitGraph}>Fit</button>
          <button type="button" onClick={() => { setSelected(null); cyRef.current?.elements().unselect(); }}>Clear</button>
        </div>
      </div>
      <div className="kg-workspace">
        <div className="kg-canvas kg-cytoscape-canvas" ref={containerRef} />
        <aside className="kg-inspector">
          <h4>Node inspector</h4>
          {selected ? (
            <>
              <strong>{selected.label}</strong>
              <p>Status: {selected.status}</p>
              <p>Group: {selected.group || "-"}</p>
              <p>ID: {selected.id}</p>
            </>
          ) : (
            <p>Hover nodes to preview topic labels. Hover edges to see relation names. Click a node to pin it here.</p>
          )}
          <div className="kg-legend kg-legend-side">
            {(curriculumOnly
              ? [
                  ["curriculum", "Curriculum topic"],
                  ["path", "Prerequisite relation"],
                ]
              : [
                  ["target", "Target topic"],
                  ["missed", "Likely missed"],
                  ["covered", "Covered abroad"],
                  ["bridge", "Bridge"],
                  ["path", "Current path"],
                  ["curriculum", "Curriculum"],
                ]
            ).map(([tone, label]) => (
              <span key={tone}><i className={`kg-legend-${tone}`} />{label}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
