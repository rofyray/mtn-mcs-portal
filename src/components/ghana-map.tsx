"use client";

import { useState } from "react";
import { ghanaRegions } from "@/lib/ghana-map-paths";

export type RegionStat = {
  regionCode: string;
  regionName: string;
  partnerCount: number;
  businessCount: number;
  agentCount: number;
};

type GhanaMapProps = {
  assignedRegions: string[];
  stats: RegionStat[];
  onRegionClick: (regionCode: string) => void;
};

export default function GhanaMap({
  assignedRegions,
  stats,
  onRegionClick,
}: GhanaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const statsByCode: Record<string, RegionStat> = {};
  for (const stat of stats) {
    statsByCode[stat.regionCode] = stat;
  }

  function handleMouseMove(event: React.MouseEvent) {
    setTooltipPos({ x: event.clientX, y: event.clientY });
  }

  const hoveredStat = hoveredRegion ? statsByCode[hoveredRegion] : null;

  return (
    <div className="ghana-map-container" onMouseMove={handleMouseMove}>
      <svg
        viewBox="0 0 595.28 841.89"
        className="ghana-map-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffcc08" />
            <stop offset="100%" stopColor="#ffd84d" />
          </linearGradient>
          <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d3748" />
            <stop offset="100%" stopColor="#1a202c" />
          </linearGradient>
        </defs>

        {ghanaRegions.map((region) => {
          const isAssigned = assignedRegions.includes(region.code);
          const isHovered = hoveredRegion === region.code;

          return (
            <g key={region.code}>
              <path
                d={region.path}
                className={`map-region ${isAssigned ? "map-region-active" : "map-region-inactive"} ${isHovered ? "map-region-hovered" : ""}`}
                fill={isAssigned ? "url(#activeGradient)" : "url(#inactiveGradient)"}
                stroke={isAssigned ? "#b38f00" : "#4a5568"}
                strokeWidth={isHovered && isAssigned ? 3 : 1.5}
                filter={isHovered && isAssigned ? "url(#glow)" : undefined}
                onMouseEnter={() => isAssigned && setHoveredRegion(region.code)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => isAssigned && onRegionClick(region.code)}
                style={{
                  cursor: isAssigned ? "pointer" : "default",
                  opacity: isAssigned ? 1 : 0.3,
                  transition: "all 0.2s ease",
                }}
              />
              <text
                x={region.center.x}
                y={region.center.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="map-region-label"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  fill: isAssigned ? "#1a202c" : "#718096",
                  pointerEvents: "none",
                  opacity: isAssigned ? 1 : 0.5,
                }}
              >
                {region.code}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredRegion && hoveredStat && (
        <div
          className="map-tooltip"
          style={{
            left: tooltipPos.x + 16,
            top: tooltipPos.y - 10,
          }}
        >
          <div className="map-tooltip-header">{hoveredStat.regionName}</div>
          <div className="map-tooltip-stats">
            <div className="map-tooltip-stat">
              <span className="map-tooltip-stat-value">{hoveredStat.partnerCount}</span>
              <span className="map-tooltip-stat-label">Partners</span>
            </div>
            <div className="map-tooltip-stat">
              <span className="map-tooltip-stat-value">{hoveredStat.businessCount}</span>
              <span className="map-tooltip-stat-label">Businesses</span>
            </div>
            <div className="map-tooltip-stat">
              <span className="map-tooltip-stat-value">{hoveredStat.agentCount}</span>
              <span className="map-tooltip-stat-label">Agents</span>
            </div>
          </div>
          <div className="map-tooltip-hint">Click to view details</div>
        </div>
      )}
    </div>
  );
}
