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
  return (
    <Panel
      title={`Structures - ${blueprint.name}`}
      collapsible
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      {!collapsed ? (
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
      ) : null}
    </Panel>
  );
}
