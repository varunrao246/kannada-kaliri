'use client';

/**
 * Admin AI & Voice Service Health Monitoring Page
 * Kannada Kaliri — Milestone 10
 */

import React, { useState, useEffect } from 'react';
import type { ServiceHealthStatus } from '@/lib/admin/types';
import { ServiceStatusBadge } from '@/components/admin/ServiceStatusBadge';

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceHealthStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadServices() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/services');
        const data = await res.json();
        if (!isCancelled && data.success) {
          setServices(data.services || []);
        }
      } catch (err) {
        console.error('Failed to load service health status:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadServices();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[#D5A64A] font-semibold">
          ಸೇವಾ ಸ್ಥಿತಿ ಪರಿಶೀಲನೆ • System Health & AI Services
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
          AI & Voice Service Monitoring
        </h1>
        <p className="text-xs text-[#EDE5D6]/70 mt-0.5">
          Inspect configuration status and endpoints for AI Kannada Guru and Gnani AI voice pipelines
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#EDE5D6]/50 animate-pulse">
          ಸೇವಾ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ... Inspecting service status...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Security Notice Banner */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-200 text-xs flex items-start gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="font-bold text-blue-300">
                Zero-Credential Exposure Policy (ಭದ್ರತಾ ನೀತಿ)
              </div>
              <p className="text-blue-200/80 mt-0.5 leading-relaxed">
                Raw API keys and secrets are never returned by the API or exposed in the client.
                This monitor inspects server-side runtime availability without triggering billable requests.
              </p>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.serviceId}
                className="glass-panel p-6 rounded-2xl border border-[rgba(213,166,74,0.25)] flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">
                      {svc.serviceId === 'guru' ? '🤖' : svc.serviceId === 'gnani_stt' ? '🎙️' : '🔊'}
                    </span>
                    <ServiceStatusBadge status={svc.status} />
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-[#F8F5EE]">
                      {svc.serviceName}
                    </h3>
                    <div className="text-xs text-[#D5A64A] font-medium mt-0.5">
                      {svc.provider}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#EDE5D6]/80 pt-2 border-t border-[rgba(213,166,74,0.15)]">
                    <div className="flex justify-between">
                      <span className="text-[#EDE5D6]/50">Model / Voice:</span>
                      <span className="font-mono text-[#F8F5EE]">{svc.modelOrVoice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#EDE5D6]/50">Endpoint:</span>
                      <span className="font-mono text-[11px] text-[#EDE5D6]/70 truncate max-w-[150px]">
                        {svc.endpoint}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#EDE5D6]/50">Last Active:</span>
                      <span className="text-[11px]">
                        {svc.lastUsedAt ? new Date(svc.lastUsedAt).toLocaleString() : 'No recent calls'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(248,245,238,0.03)] border border-[rgba(213,166,74,0.1)] text-[11px] text-[#EDE5D6]/70 leading-relaxed">
                  {svc.statusDetails}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

