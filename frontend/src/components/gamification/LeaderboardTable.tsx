"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Flame, Trophy } from "lucide-react";
import { LeaderboardEntry } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";

const columns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const rank = row.original.rank;
      if (rank === 1) return <Trophy className="h-5 w-5 text-primary" />;
      if (rank === 2) return <Trophy className="h-5 w-5 text-muted" />;
      if (rank === 3) return <Trophy className="h-5 w-5 text-accent" />;
      return <span className="font-semibold text-muted">#{rank}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Student",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted">Level {row.original.level}</p>
      </div>
    ),
  },
  {
    accessorKey: "periodXp",
    header: "XP",
    cell: ({ row }) => <span className="font-semibold text-primary">{row.original.periodXp}</span>,
  },
  {
    accessorKey: "avgWpm",
    header: "Avg WPM",
    cell: ({ row }) => row.original.avgWpm,
  },
  {
    accessorKey: "avgAccuracy",
    header: "Accuracy",
    cell: ({ row }) => `${row.original.avgAccuracy}%`,
  },
  {
    accessorKey: "streak",
    header: "Streak",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1">
        <Flame className="h-4 w-4 text-accent" />
        {row.original.streak}
      </span>
    ),
  },
];

type LeaderboardTableProps = {
  data: LeaderboardEntry[];
  highlightId?: string;
};

export function LeaderboardTable({ data, highlightId }: LeaderboardTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No leaderboard data yet. Start practicing!"
    />
  );
}