/**
 * @module components/chain-graph
 * Renders one influence chain (from `serializePath`) as a small SVG
 * diagram — nodes as labeled circles left-to-right in path order,
 * connected by lines labeled with the relationship type. This is the
 * "multi-hop query surfaced visually" polish item the brief calls out.
 */
import type { ChainResult } from '@/lib/queries/serialize-path';

const NODE_COLORS: Record<string, string> = {
	Project: '#34d399',
	Lesson: '#a78bfa',
	Technology: '#60a5fa',
};

const ROW_HEIGHT = 92;
const NODE_RADIUS = 22;
const H_GAP = 150;
const PADDING_X = 70;

export function ChainGraph({ chain }: { chain: ChainResult }) {
	const { nodes, steps } = chain;
	const width = PADDING_X * 2 + Math.max(nodes.length - 1, 0) * H_GAP;
	const cy = ROW_HEIGHT / 2;
	const positions = new Map(
		nodes.map((n, i) => [n.id, PADDING_X + i * H_GAP])
	);

	return (
		<svg
			viewBox={`0 0 ${width} ${ROW_HEIGHT}`}
			width="100%"
			role="img"
			aria-label={`Influence chain with ${nodes.length} nodes`}
			className="min-w-105"
		>
			{steps.map((step, i) => {
				const x1 = positions.get(step.from) ?? 0;
				const x2 = positions.get(step.to) ?? 0;
				return (
					<g key={`${step.from}-${step.to}-${i}`}>
						<line
							x1={x1}
							y1={cy}
							x2={x2}
							y2={cy}
							stroke="#3f3f46"
							strokeWidth={1.5}
						/>
						<text
							x={(x1 + x2) / 2}
							y={cy - 10}
							textAnchor="middle"
							fontSize="9"
							fill="#71717a"
						>
							{step.type}
						</text>
					</g>
				);
			})}
			{nodes.map((node) => {
				const x = positions.get(node.id) ?? 0;
				const color = NODE_COLORS[node.label] ?? '#a1a1aa';
				return (
					<g key={node.id}>
						<circle
							cx={x}
							cy={cy}
							r={NODE_RADIUS}
							fill="#18181b"
							stroke={color}
							strokeWidth={2}
						/>
						<text
							x={x}
							y={cy + 4}
							textAnchor="middle"
							fontSize="9"
							fill={color}
						>
							{node.label[0]}
						</text>
						<text
							x={x}
							y={cy + NODE_RADIUS + 16}
							textAnchor="middle"
							fontSize="10.5"
							fill="#d4d4d8"
						>
							{node.name.length > 16
								? `${node.name.slice(0, 15)}…`
								: node.name}
						</text>
					</g>
				);
			})}
		</svg>
	);
}
