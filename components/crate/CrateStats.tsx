"use client";

import React from "react";
import {
  FaChartBar,
  FaDatabase,
  FaHistory,
  FaEye,
  FaFileAlt,
  FaDownload,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import StatsCard from "../ui/StatsCard";
import { CrateCategory } from "../../shared/types/crate";

interface CrateStatsProps {
  crateInfo: any;
  accessStats: {
    today: number;
    week: number;
  };
  usageChartData: any[];
  formatBytes: (bytes: number) => string;
  formatCategoryForDisplay: (category: CrateCategory) => string;
  formatDate: (date: string | Date) => string;
  getCrateIcon: () => React.ReactNode;
}

export default function CrateStats({
  crateInfo,
  accessStats,
  usageChartData,
  formatBytes,
  formatCategoryForDisplay,
  formatDate,
  getCrateIcon,
}: CrateStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Usage Stats Card */}
      <StatsCard
        title="Usage Statistics"
        icon={<FaChartBar className="text-blue-600" />}
        tooltip="Crate access statistics over time"
        className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
      >
        <div className="mb-5">
          <StatsCard.Grid columns={3} className="mb-4">
            <StatsCard.Stat
              label="Today"
              value={accessStats.today}
              icon={<FaEye />}
            />
            <StatsCard.Stat
              label="This week"
              value={accessStats.week}
              icon={<FaEye />}
            />
            <StatsCard.Stat
              label="Total views"
              value={crateInfo.viewCount || 0}
              icon={<FaEye />}
            />
          </StatsCard.Grid>

          {usageChartData.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">
                7-Day Access Trend
              </div>
              <StatsCard.Chart
                data={usageChartData}
                type="bar"
                height={100}
                color="#3b82f6"
              />
            </div>
          )}
        </div>
      </StatsCard>

      {/* Storage Stats */}
      <StatsCard
        title="Storage Details"
        icon={<FaDatabase className="text-blue-500" />}
      >
        <div className="mb-2">
          <StatsCard.Grid columns={2} className="mb-4">
            <StatsCard.Stat
              label="Size"
              value={formatBytes(crateInfo.size || 0)}
              icon={<FaFileAlt />}
            />
            <StatsCard.Stat
              label="Downloads"
              value={crateInfo.downloadCount || 0}
              icon={<FaDownload />}
            />
          </StatsCard.Grid>
          <StatsCard.Stat
            label="Category"
            value={formatCategoryForDisplay(crateInfo.category)}
            icon={getCrateIcon()}
            className="mb-2"
          />
        </div>
      </StatsCard>

      {/* Time Related Stats */}
      <StatsCard
        title="Timeline"
        icon={<FaHistory className="text-purple-500" />}
      >
        <div className="space-y-4">
          <StatsCard.Stat
            label="Created on"
            value={formatDate(crateInfo.createdAt || new Date())}
            icon={<FaCalendarAlt />}
            className="mb-2"
          />

          {crateInfo.expiresAt && (
            <>
              <StatsCard.Stat
                label="Expires on"
                value={formatDate(crateInfo.expiresAt)}
                icon={<FaClock />}
                className="mb-2"
              />

              {/* TTL display removed as ttlDays is no longer supported */}
            </>
          )}
        </div>
      </StatsCard>
    </div>
  );
}