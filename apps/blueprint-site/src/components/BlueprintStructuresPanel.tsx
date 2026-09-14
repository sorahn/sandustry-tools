import { useState } from "react";
import {
  Panel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sandustry/ui";
import {
  LIQUID_VENT_STRUCTURE_TYPE,
  PIPE_STRUCTURE_TYPE,
  PUMP_STRUCTURE_TYPE,
} from "@daryl.roberts/sandustry-blueprint-core";
import { type Blueprint } from "../utils/blueprint";

type BlueprintStructuresPanelProps = {
  blueprint: Blueprint;
  structureLabel: (type: Blueprint["data"][number]["type"]) => string;
};

export function BlueprintStructuresPanel({
  blueprint,
  structureLabel,
}: BlueprintStructuresPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const counts = blueprint.data.reduce(
    (result, structure) => {
      if (structure.type === PIPE_STRUCTURE_TYPE) result.pipes += 1;
      else if (structure.type === PUMP_STRUCTURE_TYPE) result.pumps += 1;
      else if (structure.type === LIQUID_VENT_STRUCTURE_TYPE) result.vents += 1;
      else result.other += 1;
      return result;
    },
    { pipes: 0, pumps: 0, vents: 0, other: 0 },
  );
  return (
    <Panel
      title={`Structures - ${blueprint.name}`}
      collapsible
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      {!collapsed ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded border border-cyan-900/60 bg-cyan-950/20 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-cyan-300">Pipes</div>
              <div className="font-mono text-slate-200">{counts.pipes}</div>
            </div>
            <div className="rounded border border-blue-900/60 bg-blue-950/20 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-blue-300">Pumps</div>
              <div className="font-mono text-slate-200">{counts.pumps}</div>
            </div>
            <div className="rounded border border-violet-900/60 bg-violet-950/20 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-violet-300">Vents</div>
              <div className="font-mono text-slate-200">{counts.vents}</div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Other</div>
              <div className="font-mono text-slate-200">{counts.other}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[42rem]">
              <TableHead>
                <tr>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>type</TableHeaderCell>
                  <TableHeaderCell>position</TableHeaderCell>
                  <TableHeaderCell>details</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {blueprint.data.map((structure, index) => (
                  <TableRow key={`${index}-${structure.x}-${structure.y}`}>
                    <TableCell className="text-slate-600">{index + 1}</TableCell>
                    <TableCell className="break-all text-yellow-200">
                      {structureLabel(structure.type)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {structure.x}, {structure.y}
                    </TableCell>
                    <TableCell className="max-w-xl whitespace-pre-wrap break-all text-slate-500">
                      {structure.filter ? `filter ${JSON.stringify(structure.filter)}` : ""}
                      {structure.filter && structure.data !== undefined ? " · " : ""}
                      {structure.data !== undefined ? `data ${JSON.stringify(structure.data)}` : ""}
                      {structure.filter === undefined && structure.data === undefined ? "—" : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
