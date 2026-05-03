"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

function toArtistSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Period = "7d" | "30d" | "6m" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d",  label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "6m",  label: "6 mois" },
  { key: "all", label: "All time" },
];

type RankChange = number | "new" | null;

interface RankEntry {
  name: string;
  sub?: string;
  time: string;
  plays: number;
  change: RankChange;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function RankIndicator({ change }: { change: RankChange }) {
  if (change === null) return null;
  if (change === "new") {
    return (
      <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-(--color-success)">
        NEW
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-px font-mono text-[10px] tabular-nums text-(--color-success)">
        <ArrowUp size={8} strokeWidth={2.5} />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-px font-mono text-[10px] tabular-nums text-(--color-danger)">
        <ArrowDown size={8} strokeWidth={2.5} />
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="font-mono text-[10px] text-(--color-fg-disabled)">=</span>;
}

function RankingCard({
  title,
  entries,
  getHref,
}: {
  title: string;
  entries: RankEntry[];
  getHref?: (entry: RankEntry) => string;
}) {
  return (
    <div className="overflow-hidden rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated)">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          {title}
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
          {entries.length}
        </span>
      </div>

      {/* Rows */}
      {entries.map((entry, i) => {
        const rowClass = cn(
          "flex h-14 items-center gap-2.5 px-4 transition-colors hover:bg-(--color-bg-muted)",
          i < entries.length - 1 && "border-b border-(--color-border)"
        );
        const rowContent = (
          <>
            <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-(--color-fg-subtle)">
              {i + 1}
            </span>

            <div className="flex w-5 shrink-0 items-center justify-center">
              <RankIndicator change={entry.change} />
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-(--color-bg-muted) text-[11px] font-semibold text-(--color-fg-muted)">
              {initials(entry.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-(--color-fg)">
                {entry.name}
              </div>
              {entry.sub && (
                <div className="truncate text-xs text-(--color-fg-subtle)">
                  {entry.sub}
                </div>
              )}
            </div>

            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                {entry.time}
              </div>
              <div className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
                {entry.plays}×
              </div>
            </div>
          </>
        );

        const href = getHref?.(entry);
        return href ? (
          <Link key={`${title}-${i}`} href={href} className={rowClass}>
            {rowContent}
          </Link>
        ) : (
          <div key={`${title}-${i}`} className={rowClass}>
            {rowContent}
          </div>
        );
      })}
    </div>
  );
}

// ── MOCK DATA ──────────────────────────────────────────────────────────────────

const TRACKS: Record<Period, RankEntry[]> = {
  "7d": [
    { name: "Electric Feel",                  sub: "MGMT",                    time: "1h 12", plays: 18, change: 2 },
    { name: "Around the World",               sub: "Daft Punk",               time: "1h 04", plays: 15, change: "new" },
    { name: "Weird Fishes / Arpeggi",         sub: "Radiohead",               time: "0h 52", plays: 11, change: -1 },
    { name: "1901",                           sub: "Phoenix",                 time: "0h 47", plays: 13, change: 5 },
    { name: "The Less I Know the Better",     sub: "Tame Impala",             time: "0h 43", plays: 10, change: 0 },
    { name: "Midnight City",                  sub: "M83",                     time: "0h 41", plays: 9,  change: 3 },
    { name: "Skinny Love",                    sub: "Bon Iver",                time: "0h 38", plays: 9,  change: -2 },
    { name: "Intro",                          sub: "The xx",                  time: "0h 34", plays: 8,  change: 0 },
    { name: "Pyramids",                       sub: "Frank Ocean",             time: "0h 31", plays: 5,  change: 1 },
    { name: "Take Five",                      sub: "Dave Brubeck Quartet",    time: "0h 30", plays: 7,  change: -3 },
    { name: "Lose Yourself to Dance",         sub: "Daft Punk",               time: "0h 28", plays: 6,  change: "new" },
    { name: "Holocene",                       sub: "Bon Iver",                time: "0h 26", plays: 6,  change: 2 },
    { name: "Get Lucky",                      sub: "Daft Punk",               time: "0h 25", plays: 6,  change: -1 },
    { name: "So What",                        sub: "Miles Davis",             time: "0h 23", plays: 5,  change: 0 },
    { name: "Float On",                       sub: "Modest Mouse",            time: "0h 22", plays: 5,  change: "new" },
    { name: "New Person, Same Old Mistakes",  sub: "Tame Impala",             time: "0h 21", plays: 4,  change: -4 },
    { name: "Lost in Translation",            sub: "Phoenix",                 time: "0h 19", plays: 4,  change: 1 },
    { name: "Black Star",                     sub: "Radiohead",               time: "0h 18", plays: 4,  change: 0 },
    { name: "Come Together",                  sub: "The Beatles",             time: "0h 16", plays: 4,  change: 2 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",      time: "0h 15", plays: 3,  change: "new" },
  ],
  "30d": [
    { name: "The Less I Know the Better",     sub: "Tame Impala",             time: "4h 10", plays: 58, change: 4 },
    { name: "Electric Feel",                  sub: "MGMT",                    time: "3h 58", plays: 53, change: -1 },
    { name: "Weird Fishes / Arpeggi",         sub: "Radiohead",               time: "3h 22", plays: 43, change: 0 },
    { name: "1901",                           sub: "Phoenix",                 time: "3h 08", plays: 50, change: 2 },
    { name: "Midnight City",                  sub: "M83",                     time: "2h 55", plays: 39, change: -2 },
    { name: "Around the World",               sub: "Daft Punk",               time: "2h 44", plays: 37, change: 7 },
    { name: "Pyramids",                       sub: "Frank Ocean",             time: "2h 33", plays: 20, change: 0 },
    { name: "Skinny Love",                    sub: "Bon Iver",                time: "2h 28", plays: 34, change: -1 },
    { name: "Holocene",                       sub: "Bon Iver",                time: "2h 10", plays: 30, change: 3 },
    { name: "Take Five",                      sub: "Dave Brubeck Quartet",    time: "1h 58", plays: 28, change: 0 },
    { name: "Get Lucky",                      sub: "Daft Punk",               time: "1h 52", plays: 26, change: -2 },
    { name: "Intro",                          sub: "The xx",                  time: "1h 48", plays: 26, change: -3 },
    { name: "So What",                        sub: "Miles Davis",             time: "1h 40", plays: 23, change: 1 },
    { name: "Lose Yourself to Dance",         sub: "Daft Punk",               time: "1h 34", plays: 22, change: 5 },
    { name: "Float On",                       sub: "Modest Mouse",            time: "1h 28", plays: 21, change: "new" },
    { name: "New Person, Same Old Mistakes",  sub: "Tame Impala",             time: "1h 20", plays: 18, change: 0 },
    { name: "Lost in Translation",            sub: "Phoenix",                 time: "1h 14", plays: 17, change: -1 },
    { name: "Black Star",                     sub: "Radiohead",               time: "1h 08", plays: 15, change: 2 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",      time: "1h 02", plays: 14, change: "new" },
    { name: "Come Together",                  sub: "The Beatles",             time: "0h 56", plays: 12, change: -1 },
  ],
  "6m": [
    { name: "Weird Fishes / Arpeggi",         sub: "Radiohead",               time: "18h 30", plays: 147, change: 0 },
    { name: "The Less I Know the Better",     sub: "Tame Impala",             time: "16h 42", plays: 142, change: 1 },
    { name: "1901",                           sub: "Phoenix",                 time: "14h 55", plays: 160, change: -1 },
    { name: "Electric Feel",                  sub: "MGMT",                    time: "13h 20", plays: 135, change: 0 },
    { name: "Pyramids",                       sub: "Frank Ocean",             time: "12h 10", plays: 78,  change: 2 },
    { name: "Midnight City",                  sub: "M83",                     time: "11h 44", plays: 118, change: -2 },
    { name: "Around the World",               sub: "Daft Punk",               time: "10h 32", plays: 107, change: 3 },
    { name: "Holocene",                       sub: "Bon Iver",                time: "9h 58",  plays: 98,  change: 0 },
    { name: "Take Five",                      sub: "Dave Brubeck Quartet",    time: "9h 15",  plays: 90,  change: 1 },
    { name: "So What",                        sub: "Miles Davis",             time: "8h 40",  plays: 85,  change: -1 },
    { name: "Get Lucky",                      sub: "Daft Punk",               time: "8h 10",  plays: 82,  change: 2 },
    { name: "Skinny Love",                    sub: "Bon Iver",                time: "7h 45",  plays: 78,  change: -3 },
    { name: "Intro",                          sub: "The xx",                  time: "7h 22",  plays: 74,  change: 0 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",      time: "6h 58",  plays: 68,  change: 5 },
    { name: "New Person, Same Old Mistakes",  sub: "Tame Impala",             time: "6h 33",  plays: 64,  change: -2 },
    { name: "Lose Yourself to Dance",         sub: "Daft Punk",               time: "6h 10",  plays: 60,  change: 1 },
    { name: "Float On",                       sub: "Modest Mouse",            time: "5h 48",  plays: 57,  change: 0 },
    { name: "Lost in Translation",            sub: "Phoenix",                 time: "5h 24",  plays: 53,  change: 3 },
    { name: "Come Together",                  sub: "The Beatles",             time: "5h 02",  plays: 49,  change: -1 },
    { name: "Black Star",                     sub: "Radiohead",               time: "4h 44",  plays: 46,  change: 2 },
  ],
  "all": [
    { name: "Weird Fishes / Arpeggi",         sub: "Radiohead",               time: "62h 14", plays: 498, change: null },
    { name: "1901",                           sub: "Phoenix",                 time: "54h 40", plays: 556, change: null },
    { name: "The Less I Know the Better",     sub: "Tame Impala",             time: "48h 20", plays: 420, change: null },
    { name: "Electric Feel",                  sub: "MGMT",                    time: "42h 30", plays: 389, change: null },
    { name: "Pyramids",                       sub: "Frank Ocean",             time: "38h 10", plays: 245, change: null },
    { name: "Midnight City",                  sub: "M83",                     time: "35h 22", plays: 354, change: null },
    { name: "So What",                        sub: "Miles Davis",             time: "32h 15", plays: 316, change: null },
    { name: "Around the World",               sub: "Daft Punk",               time: "30h 44", plays: 314, change: null },
    { name: "Take Five",                      sub: "Dave Brubeck Quartet",    time: "28h 56", plays: 282, change: null },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",      time: "26h 38", plays: 260, change: null },
    { name: "Get Lucky",                      sub: "Daft Punk",               time: "24h 50", plays: 248, change: null },
    { name: "Holocene",                       sub: "Bon Iver",                time: "23h 14", plays: 234, change: null },
    { name: "Skinny Love",                    sub: "Bon Iver",                time: "21h 30", plays: 216, change: null },
    { name: "Float On",                       sub: "Modest Mouse",            time: "19h 56", plays: 198, change: null },
    { name: "Intro",                          sub: "The xx",                  time: "18h 22", plays: 184, change: null },
    { name: "Lost in Translation",            sub: "Phoenix",                 time: "16h 44", plays: 168, change: null },
    { name: "New Person, Same Old Mistakes",  sub: "Tame Impala",             time: "15h 10", plays: 152, change: null },
    { name: "Lose Yourself to Dance",         sub: "Daft Punk",               time: "13h 36", plays: 138, change: null },
    { name: "Come Together",                  sub: "The Beatles",             time: "12h 02", plays: 122, change: null },
    { name: "Black Star",                     sub: "Radiohead",               time: "10h 28", plays: 106, change: null },
  ],
};

const ARTISTS: Record<Period, RankEntry[]> = {
  "7d": [
    { name: "Radiohead",            time: "2h 44",  plays: 25, change: 0 },
    { name: "Daft Punk",            time: "2h 17",  plays: 27, change: 3 },
    { name: "Tame Impala",          time: "1h 58",  plays: 22, change: -1 },
    { name: "Bon Iver",             time: "1h 44",  plays: 18, change: 2 },
    { name: "Phoenix",              time: "1h 29",  plays: 17, change: 0 },
    { name: "M83",                  time: "1h 15",  plays: 14, change: 1 },
    { name: "Frank Ocean",          time: "1h 06",  plays: 7,  change: -2 },
    { name: "Miles Davis",          time: "0h 58",  plays: 12, change: 0 },
    { name: "The xx",               time: "0h 52",  plays: 10, change: -1 },
    { name: "MGMT",                 time: "0h 47",  plays: 18, change: 2 },
    { name: "Fleet Foxes",          time: "0h 40",  plays: 9,  change: "new" },
    { name: "Modest Mouse",         time: "0h 35",  plays: 8,  change: 1 },
    { name: "Floating Points",      time: "0h 30",  plays: 5,  change: -3 },
    { name: "Four Tet",             time: "0h 28",  plays: 5,  change: 0 },
    { name: "Massive Attack",       time: "0h 25",  plays: 5,  change: 2 },
    { name: "Dave Brubeck Quartet", time: "0h 22",  plays: 7,  change: -1 },
    { name: "Neutral Milk Hotel",   time: "0h 20",  plays: 3,  change: "new" },
    { name: "The Beatles",          time: "0h 18",  plays: 4,  change: 0 },
    { name: "Portishead",           time: "0h 16",  plays: 3,  change: -2 },
    { name: "Aphex Twin",           time: "0h 14",  plays: 3,  change: 1 },
  ],
  "30d": [
    { name: "Radiohead",            time: "9h 30",  plays: 80, change: 0 },
    { name: "Daft Punk",            time: "8h 12",  plays: 88, change: 1 },
    { name: "Tame Impala",          time: "7h 44",  plays: 82, change: -1 },
    { name: "Bon Iver",             time: "6h 58",  plays: 66, change: 0 },
    { name: "Phoenix",              time: "6h 20",  plays: 70, change: 1 },
    { name: "Miles Davis",          time: "5h 40",  plays: 52, change: 2 },
    { name: "M83",                  time: "5h 10",  plays: 56, change: -2 },
    { name: "Frank Ocean",          time: "4h 44",  plays: 30, change: 0 },
    { name: "Fleet Foxes",          time: "4h 20",  plays: 44, change: 3 },
    { name: "MGMT",                 time: "3h 58",  plays: 55, change: -2 },
    { name: "The xx",               time: "3h 40",  plays: 38, change: -1 },
    { name: "Modest Mouse",         time: "3h 22",  plays: 36, change: 1 },
    { name: "Four Tet",             time: "3h 05",  plays: 22, change: 0 },
    { name: "Floating Points",      time: "2h 50",  plays: 18, change: 2 },
    { name: "Neutral Milk Hotel",   time: "2h 36",  plays: 24, change: 4 },
    { name: "Massive Attack",       time: "2h 22",  plays: 22, change: -1 },
    { name: "Dave Brubeck Quartet", time: "2h 08",  plays: 28, change: 0 },
    { name: "The Beatles",          time: "1h 55",  plays: 18, change: 1 },
    { name: "Aphex Twin",           time: "1h 42",  plays: 14, change: -2 },
    { name: "Portishead",           time: "1h 28",  plays: 13, change: 0 },
  ],
  "6m": [
    { name: "Radiohead",            time: "38h 22", plays: 298, change: 0 },
    { name: "Tame Impala",          time: "32h 50", plays: 314, change: 1 },
    { name: "Daft Punk",            time: "30h 10", plays: 306, change: -1 },
    { name: "Phoenix",              time: "26h 44", plays: 280, change: 2 },
    { name: "Bon Iver",             time: "24h 18", plays: 244, change: -1 },
    { name: "Miles Davis",          time: "22h 10", plays: 214, change: 1 },
    { name: "Frank Ocean",          time: "19h 44", plays: 126, change: 0 },
    { name: "Fleet Foxes",          time: "18h 20", plays: 188, change: 2 },
    { name: "M83",                  time: "16h 58", plays: 172, change: -2 },
    { name: "MGMT",                 time: "15h 30", plays: 160, change: 0 },
    { name: "The xx",               time: "14h 10", plays: 143, change: -1 },
    { name: "Neutral Milk Hotel",   time: "12h 50", plays: 126, change: 4 },
    { name: "Four Tet",             time: "11h 40", plays: 96,  change: 1 },
    { name: "Floating Points",      time: "10h 30", plays: 80,  change: 2 },
    { name: "Modest Mouse",         time: "9h 20",  plays: 94,  change: -2 },
    { name: "Dave Brubeck Quartet", time: "8h 10",  plays: 80,  change: 0 },
    { name: "Massive Attack",       time: "7h 00",  plays: 68,  change: 1 },
    { name: "The Beatles",          time: "5h 50",  plays: 56,  change: 0 },
    { name: "Portishead",           time: "4h 40",  plays: 46,  change: -1 },
    { name: "Aphex Twin",           time: "3h 30",  plays: 34,  change: -2 },
  ],
  "all": [
    { name: "Radiohead",            time: "124h 18", plays: 992,  change: null },
    { name: "Daft Punk",            time: "108h 42", plays: 1089, change: null },
    { name: "Tame Impala",          time: "96h 30",  plays: 960,  change: null },
    { name: "Phoenix",              time: "84h 20",  plays: 880,  change: null },
    { name: "Miles Davis",          time: "76h 44",  plays: 748,  change: null },
    { name: "Bon Iver",             time: "70h 12",  plays: 704,  change: null },
    { name: "Frank Ocean",          time: "64h 30",  plays: 415,  change: null },
    { name: "Fleet Foxes",          time: "58h 20",  plays: 584,  change: null },
    { name: "M83",                  time: "52h 44",  plays: 528,  change: null },
    { name: "The xx",               time: "48h 10",  plays: 481,  change: null },
    { name: "MGMT",                 time: "44h 28",  plays: 448,  change: null },
    { name: "Neutral Milk Hotel",   time: "40h 50",  plays: 408,  change: null },
    { name: "Four Tet",             time: "37h 22",  plays: 373,  change: null },
    { name: "Floating Points",      time: "33h 44",  plays: 336,  change: null },
    { name: "Modest Mouse",         time: "30h 10",  plays: 302,  change: null },
    { name: "Dave Brubeck Quartet", time: "26h 36",  plays: 266,  change: null },
    { name: "Massive Attack",       time: "23h 00",  plays: 230,  change: null },
    { name: "The Beatles",          time: "19h 28",  plays: 194,  change: null },
    { name: "Portishead",           time: "16h 00",  plays: 158,  change: null },
    { name: "Aphex Twin",           time: "12h 30",  plays: 122,  change: null },
  ],
};

const ALBUMS: Record<Period, RankEntry[]> = {
  "7d": [
    { name: "Kid A",                          sub: "Radiohead",             time: "1h 30", plays: 14, change: 0 },
    { name: "Discovery",                      sub: "Daft Punk",             time: "1h 18", plays: 12, change: 2 },
    { name: "Currents",                       sub: "Tame Impala",           time: "1h 10", plays: 13, change: -1 },
    { name: "Wolfgang Amadeus Phoenix",       sub: "Phoenix",               time: "0h 58", plays: 11, change: 1 },
    { name: "Hurry Up, We're Dreaming",      sub: "M83",                   time: "0h 52", plays: 9,  change: 3 },
    { name: "For Emma, Forever Ago",          sub: "Bon Iver",              time: "0h 44", plays: 9,  change: -2 },
    { name: "Blonde",                         sub: "Frank Ocean",           time: "0h 40", plays: 5,  change: 0 },
    { name: "xx",                             sub: "The xx",                time: "0h 36", plays: 8,  change: 1 },
    { name: "Kind of Blue",                   sub: "Miles Davis",           time: "0h 31", plays: 7,  change: -1 },
    { name: "Oracular Spectacular",           sub: "MGMT",                  time: "0h 28", plays: 8,  change: 0 },
    { name: "Fleet Foxes",                    sub: "Fleet Foxes",           time: "0h 24", plays: 5,  change: "new" },
    { name: "OK Computer",                    sub: "Radiohead",             time: "0h 22", plays: 5,  change: 1 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",    time: "0h 20", plays: 3,  change: "new" },
    { name: "Promises",                       sub: "Floating Points",       time: "0h 18", plays: 3,  change: -3 },
    { name: "Good Kid, M.A.A.D City",         sub: "Kendrick Lamar",        time: "0h 17", plays: 3,  change: 2 },
    { name: "Mezzanine",                      sub: "Massive Attack",        time: "0h 15", plays: 4,  change: 0 },
    { name: "Dummy",                          sub: "Portishead",            time: "0h 13", plays: 3,  change: -1 },
    { name: "Rounds",                         sub: "Four Tet",              time: "0h 12", plays: 3,  change: 1 },
    { name: "Abbey Road",                     sub: "The Beatles",           time: "0h 11", plays: 3,  change: 0 },
    { name: "Selected Ambient Works Vol. II", sub: "Aphex Twin",            time: "0h 10", plays: 2,  change: "new" },
  ],
  "30d": [
    { name: "OK Computer",                    sub: "Radiohead",             time: "5h 50", plays: 50, change: 8 },
    { name: "Currents",                       sub: "Tame Impala",           time: "5h 10", plays: 55, change: 1 },
    { name: "Kid A",                          sub: "Radiohead",             time: "4h 55", plays: 46, change: -2 },
    { name: "Discovery",                      sub: "Daft Punk",             time: "4h 40", plays: 48, change: 0 },
    { name: "Blonde",                         sub: "Frank Ocean",           time: "4h 20", plays: 28, change: 2 },
    { name: "Wolfgang Amadeus Phoenix",       sub: "Phoenix",               time: "4h 05", plays: 45, change: -1 },
    { name: "For Emma, Forever Ago",          sub: "Bon Iver",              time: "3h 50", plays: 38, change: 1 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",    time: "3h 34", plays: 35, change: 5 },
    { name: "Hurry Up, We're Dreaming",      sub: "M83",                   time: "3h 18", plays: 35, change: -3 },
    { name: "Kind of Blue",                   sub: "Miles Davis",           time: "3h 02", plays: 30, change: 0 },
    { name: "Fleet Foxes",                    sub: "Fleet Foxes",           time: "2h 48", plays: 29, change: 2 },
    { name: "Oracular Spectacular",           sub: "MGMT",                  time: "2h 34", plays: 32, change: -1 },
    { name: "xx",                             sub: "The xx",                time: "2h 20", plays: 25, change: -4 },
    { name: "Good Kid, M.A.A.D City",         sub: "Kendrick Lamar",        time: "2h 06", plays: 14, change: 1 },
    { name: "Mezzanine",                      sub: "Massive Attack",        time: "1h 52", plays: 18, change: 0 },
    { name: "Promises",                       sub: "Floating Points",       time: "1h 38", plays: 13, change: 1 },
    { name: "Rounds",                         sub: "Four Tet",              time: "1h 24", plays: 14, change: 2 },
    { name: "Dummy",                          sub: "Portishead",            time: "1h 10", plays: 12, change: -1 },
    { name: "Abbey Road",                     sub: "The Beatles",           time: "0h 56", plays: 10, change: 0 },
    { name: "Selected Ambient Works Vol. II", sub: "Aphex Twin",            time: "0h 44", plays: 7,  change: -2 },
  ],
  "6m": [
    { name: "Kid A",                          sub: "Radiohead",             time: "20h 44", plays: 166, change: 2 },
    { name: "Currents",                       sub: "Tame Impala",           time: "18h 20", plays: 196, change: 0 },
    { name: "OK Computer",                    sub: "Radiohead",             time: "17h 02", plays: 146, change: -2 },
    { name: "Discovery",                      sub: "Daft Punk",             time: "15h 48", plays: 160, change: 1 },
    { name: "Wolfgang Amadeus Phoenix",       sub: "Phoenix",               time: "14h 30", plays: 154, change: 0 },
    { name: "Blonde",                         sub: "Frank Ocean",           time: "13h 14", plays: 85,  change: 1 },
    { name: "For Emma, Forever Ago",          sub: "Bon Iver",              time: "12h 00", plays: 120, change: -1 },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",    time: "10h 44", plays: 105, change: 4 },
    { name: "Kind of Blue",                   sub: "Miles Davis",           time: "9h 30",  plays: 93,  change: 0 },
    { name: "Fleet Foxes",                    sub: "Fleet Foxes",           time: "8h 18",  plays: 84,  change: 2 },
    { name: "Hurry Up, We're Dreaming",      sub: "M83",                   time: "7h 06",  plays: 72,  change: -3 },
    { name: "Good Kid, M.A.A.D City",         sub: "Kendrick Lamar",        time: "5h 54",  plays: 38,  change: 3 },
    { name: "Oracular Spectacular",           sub: "MGMT",                  time: "5h 42",  plays: 78,  change: -1 },
    { name: "xx",                             sub: "The xx",                time: "5h 30",  plays: 66,  change: -1 },
    { name: "Mezzanine",                      sub: "Massive Attack",        time: "5h 18",  plays: 52,  change: 0 },
    { name: "Rounds",                         sub: "Four Tet",              time: "5h 06",  plays: 50,  change: 1 },
    { name: "Promises",                       sub: "Floating Points",       time: "4h 54",  plays: 40,  change: 1 },
    { name: "Dummy",                          sub: "Portishead",            time: "4h 42",  plays: 46,  change: -1 },
    { name: "Abbey Road",                     sub: "The Beatles",           time: "4h 30",  plays: 44,  change: 0 },
    { name: "Selected Ambient Works Vol. II", sub: "Aphex Twin",            time: "4h 18",  plays: 28,  change: -2 },
  ],
  "all": [
    { name: "Kid A",                          sub: "Radiohead",             time: "68h 20", plays: 547, change: null },
    { name: "OK Computer",                    sub: "Radiohead",             time: "62h 44", plays: 537, change: null },
    { name: "Currents",                       sub: "Tame Impala",           time: "56h 10", plays: 563, change: null },
    { name: "Discovery",                      sub: "Daft Punk",             time: "50h 30", plays: 504, change: null },
    { name: "Wolfgang Amadeus Phoenix",       sub: "Phoenix",               time: "44h 50", plays: 476, change: null },
    { name: "Blonde",                         sub: "Frank Ocean",           time: "40h 10", plays: 258, change: null },
    { name: "For Emma, Forever Ago",          sub: "Bon Iver",              time: "36h 30", plays: 365, change: null },
    { name: "Kind of Blue",                   sub: "Miles Davis",           time: "32h 50", plays: 320, change: null },
    { name: "In the Aeroplane Over the Sea",  sub: "Neutral Milk Hotel",    time: "30h 10", plays: 295, change: null },
    { name: "Fleet Foxes",                    sub: "Fleet Foxes",           time: "27h 30", plays: 276, change: null },
    { name: "Hurry Up, We're Dreaming",      sub: "M83",                   time: "24h 50", plays: 249, change: null },
    { name: "Good Kid, M.A.A.D City",         sub: "Kendrick Lamar",        time: "22h 10", plays: 143, change: null },
    { name: "Oracular Spectacular",           sub: "MGMT",                  time: "20h 30", plays: 224, change: null },
    { name: "xx",                             sub: "The xx",                time: "18h 50", plays: 189, change: null },
    { name: "Mezzanine",                      sub: "Massive Attack",        time: "17h 10", plays: 172, change: null },
    { name: "Rounds",                         sub: "Four Tet",              time: "15h 30", plays: 155, change: null },
    { name: "Promises",                       sub: "Floating Points",       time: "13h 50", plays: 112, change: null },
    { name: "Dummy",                          sub: "Portishead",            time: "12h 10", plays: 122, change: null },
    { name: "Abbey Road",                     sub: "The Beatles",           time: "10h 30", plays: 105, change: null },
    { name: "Selected Ambient Works Vol. II", sub: "Aphex Twin",            time: "8h 50",  plays: 88,  change: null },
  ],
};

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function MusicPage() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-bg) px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-(--color-fg)">
            Classements
          </h1>
          <span className="text-xs text-(--color-fg-subtle)">Spotify · Top 20</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              data-active={period === p.key}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)",
                "hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                "data-[active=true]:border-(--color-accent) data-[active=true]:bg-(--color-accent-bg) data-[active=true]:text-(--color-accent)"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 cards — stacked on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-3">
        <RankingCard title="Titres"   entries={TRACKS[period]} />
        <RankingCard title="Artistes" entries={ARTISTS[period]}
          getHref={entry => `/music/artist/${toArtistSlug(entry.name)}`}
        />
        <RankingCard title="Albums"   entries={ALBUMS[period]} />
      </div>
    </div>
  );
}
