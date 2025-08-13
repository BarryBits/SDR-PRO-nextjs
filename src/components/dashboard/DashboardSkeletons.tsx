import { Skeleton } from "@/components/ui/skeleton";
import { StatsGrid } from "@/components/data/stats-grid";
import { SectionCard } from "../layout/section-card";

export const MetricsSkeleton = () => (
  <StatsGrid>
    {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[120px] w-full" />
    ))}
  </StatsGrid>
);

export const ActivitySkeleton = ({ title }: { title: string }) => (
    <SectionCard title={title} className="col-span-1 md:col-span-2 row-span-2">
        <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            ))}
        </div>
  </SectionCard>
);