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
  formatBytes: (bytes: number) => string;
  formatCategoryForDisplay: (category: CrateCategory) => string;
  formatDate: (date: string | Date) => string;
  getCrateIcon: () => React.ReactNode;
}

export default function CrateStats({
  crateInfo,
  formatBytes,
  formatCategoryForDisplay,
  formatDate,
  getCrateIcon,
}: CrateStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Usage Stats Card */}
      <StatsCard
        title="Engagement"
        icon={<FaEye className="text-blue-600" />}
        tooltip="Total views for this crate"
        className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
      >
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {crateInfo.viewCount || 0}
            </div>
            <div className="text-sm text-gray-500">
              Total Views
            </div>
          </div>
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