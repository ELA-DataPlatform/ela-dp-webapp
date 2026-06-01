"use client";

import { useParams } from "next/navigation";
import { ActivityFocusProvider } from "@/components/activity/focus-context";
import { ActivityHeader } from "@/components/activity/header";
import { ConditionsStrip } from "@/components/activity/conditions-strip";
import { Hero } from "@/components/activity/hero";
import { ActivityChart } from "@/components/activity/chart";
import { SplitsTable } from "@/components/activity/splits-table";
import { HRZonesPanel } from "@/components/activity/hr-zones";
import { RecentActivitiesPanel } from "@/components/activity/recent-activities";
import { MusicTimeline } from "@/components/activity/music-timeline";
import { VerdictPanel } from "@/components/activity/verdict";
import { MOCK_ACTIVITY, MOCK_VERDICT } from "@/components/activity/mock-data";

export default function ActivityDetailPage() {
  useParams(); // [id] — branchera l'API plus tard
  const activity = MOCK_ACTIVITY;

  return (
    <ActivityFocusProvider>
      <div className="flex flex-col">
        <ActivityHeader activity={activity} />
        <ConditionsStrip conditions={activity.conditions} />

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Hero activity={activity} />
          <ActivityChart data={activity.chartData} totalKm={activity.distanceKm} segments={activity.segments} />
          <SplitsTable activity={activity} />

          <div className="grid gap-4 lg:grid-cols-2">
            <HRZonesPanel zones={activity.hrZones} totalSec={activity.durationSec} />
            <RecentActivitiesPanel activities={activity.history} />
          </div>

          <MusicTimeline tracks={activity.tracks} />
          <VerdictPanel verdict={MOCK_VERDICT} />
        </div>
      </div>
    </ActivityFocusProvider>
  );
}
