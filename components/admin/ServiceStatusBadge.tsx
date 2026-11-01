'use client';

/**
 * Service Status Badge Component
 * Kannada Kaliri — Milestone 10
 */

import React from 'react';
import type { ServiceHealthStatus } from '@/lib/admin/types';

interface ServiceStatusBadgeProps {
  status: ServiceHealthStatus['status'];
}

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps) {
  switch (status) {
    case 'verified_live':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Verified Live
        </span>
      );
    case 'configured':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Configured
        </span>
      );
    case 'unavailable':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Unavailable
        </span>
      );
    case 'unconfigured':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Unconfigured (Fallback Active)
        </span>
      );
  }
}

