import React from "react";
import { FaInfoCircle } from "react-icons/fa";

interface StatsCardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

export default function StatsCard({
  title,
  icon,
  children,
  className = "",
  tooltip,
}: StatsCardProps) {
  return (
    <div
      className={`
                bg-white 
                border border-gray-200 
                rounded-lg 
                shadow-sm 
                overflow-hidden
                ${className}
            `}
    >
      {(title || icon) && (
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <div className="flex items-center">
            {icon && <div className="mr-2">{icon}</div>}
            {title && (
              <h3 className="font-medium text-gray-700 text-sm">{title}</h3>
            )}
          </div>
          {tooltip && (
            <div className="relative group">
              <FaInfoCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
              <div className="absolute z-10 bottom-full mb-2 right-0 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

StatsCard.Stat = function Stat({
  label,
  value,
  icon,
  className = "",
  trend,
}: StatItemProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center text-xs text-gray-500 mb-1">
        {icon && <span className="mr-1">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="font-medium text-gray-800 flex items-center">
        <span>{value}</span>
        {trend && (
          <span
            className={`ml-2 text-xs ${trend.isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
};

interface StatGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | "auto";
  className?: string;
}

StatsCard.Grid = function StatGrid({
  children,
  columns = 2,
  className = "",
}: StatGridProps) {
  const getColumnsClass = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case "auto":
        return "grid-cols-auto";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <div className={`grid ${getColumnsClass()} gap-4 ${className}`}>
      {children}
    </div>
  );
};

interface StatProgressProps {
  value: number;
  max: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "green" | "red" | "yellow" | "blue";
}

StatsCard.Progress = function StatProgress({
  value,
  max,
  label,
  size = "md",
  color = "primary",
}: StatProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizeClass = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }[size];

  const colorClass = {
    primary: "bg-primary-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    blue: "bg-blue-500",
  }[color];

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-700 font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClass}`}>
        <div
          className={`${colorClass} rounded-full ${sizeClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

interface StatChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: "bar" | "horizontal-bar";
  height?: number;
  color?: string;
}

StatsCard.Chart = function StatChart({
  data,
  type = "bar",
  height = 120,
  color = "#3b82f6",
}: StatChartProps) {
  // For a simple bar chart
  if (type === "bar") {
    const maxValue = Math.max(...data.map((item) => item.value));

    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex h-full items-end justify-between">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{ width: `${100 / data.length - 2}%` }}
              >
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: color,
                  }}
                ></div>
                <div className="text-xs text-gray-500 mt-1 text-center truncate w-full">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // For horizontal bar chart
  if (type === "horizontal-bar") {
    const maxValue = Math.max(...data.map((item) => item.value));

    return (
      <div
        className="w-full space-y-2"
        style={{ height: `${height}px`, overflowY: "auto" }}
      >
        {data.map((item, index) => {
          const barWidth = (item.value / maxValue) * 100;
          return (
            <div key={index} className="w-full">
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className="text-gray-700 truncate"
                  style={{ maxWidth: "50%" }}
                >
                  {item.label}
                </span>
                <span className="text-gray-500">{item.value}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
