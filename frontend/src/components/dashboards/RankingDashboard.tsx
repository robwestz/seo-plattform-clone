'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface RankingDashboardProps {
  projectId: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export const RankingDashboard: React.FC<RankingDashboardProps> = ({
  projectId,
  dateRange,
  autoRefresh = false,
  refreshInterval = 60000,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrend, setFilterTrend] = useState<'all' | 'up' | 'down' | 'stable'>('all');
  const [sortBy, setSortBy] = useState<'position' | 'change' | 'volume' | 'ctr'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch ranking data
  const { data: rankings, isLoading, error, refetch } = useQuery<Keyword[]>({
    queryKey: ['rankings', projectId, dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/rankings/${projectId}?${new URLSearchParams({
        startDate: dateRange?.startDate.toISOString() || '',
        endDate: dateRange?.endDate.toISOString() || '',
      })}`);
      if (!response.ok) throw new Error('Failed to fetch rankings');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  });

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Filter and sort rankings
  const filteredRankings = useMemo(() => {
    if (!rankings) return [];

    let filtered = rankings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Trend filter
    if (filterTrend !== 'all') {
      filtered = filtered.filter((r) => r.trend === filterTrend);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'position':
          comparison = a.currentPosition - b.currentPosition;
          break;
        case 'change':
          comparison = Math.abs(b.change) - Math.abs(a.change);
          break;
        case 'volume':
          comparison = b.searchVolume - a.searchVolume;
          break;
        case 'ctr':
          comparison = b.ctr - a.ctr;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rankings, searchTerm, filterTrend, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!rankings) return null;

    const improvements = rankings.filter((r) => r.trend === 'up').length;
    const declines = rankings.filter((r) => r.trend === 'down').length;
    const stable = rankings.filter((r) => r.trend === 'stable').length;
    const avgPosition = rankings.reduce((sum, r) => sum + r.currentPosition, 0) / rankings.length;
    const totalClicks = rankings.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = rankings.reduce((sum, r) => sum + r.impressions, 0);
    const avgCTR = (totalClicks / totalImpressions) * 100;

    return {
      total: rankings.length,
      improvements,
      declines,
      stable,
      avgPosition: avgPosition.toFixed(1),
      totalClicks,
      totalImpressions,
      avgCTR: avgCTR.toFixed(2),
    };
  }, [rankings]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600 bg-green-50';
    if (position <= 10) return 'text-blue-600 bg-blue-50';
    if (position <= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const handleExport = async () => {
    if (!filteredRankings.length) return;

    const csv = [
      ['Keyword', 'Position', 'Change', 'Volume', 'Clicks', 'Impressions', 'CTR', 'URL'].join(','),
      ...filteredRankings.map((r) =>
        [
          r.keyword,
          r.currentPosition,
          r.change,
          r.searchVolume,
          r.clicks,
          r.impressions,
          r.ctr.toFixed(2),
          r.url,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankings-${projectId}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load rankings</h3>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-1">Total Keywords</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.improvements}
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {stats.declines}
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Minus className="w-3 h-3" />
                {stats.stable}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-1">Avg. Position</div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgPosition}</div>
            <div className="text-xs text-gray-500 mt-2">Across all keywords</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-1">Total Clicks</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalClicks.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.totalImpressions.toLocaleString()} impressions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-1">Avg. CTR</div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgCTR}%</div>
            <div className="text-xs text-gray-500 mt-2">Click-through rate</div>
          </motion.div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-0 md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keywords or URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Trend Filter */}
            <select
              value={filterTrend}
              onChange={(e) => setFilterTrend(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Trends</option>
              <option value="up">Improving</option>
              <option value="down">Declining</option>
              <option value="stable">Stable</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="position">Position</option>
              <option value="change">Change</option>
              <option value="volume">Volume</option>
              <option value="ctr">CTR</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredRankings.map((ranking) => (
                    <motion.tr
                      key={ranking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(ranking.trend)}
                          <span className="text-sm font-medium text-gray-900">
                            {ranking.keyword}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getPositionColor(
                            ranking.currentPosition
                          )}`}
                        >
                          #{ranking.currentPosition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {ranking.change !== 0 && (
                            <>
                              {ranking.change > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  ranking.change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {Math.abs(ranking.change)}
                              </span>
                            </>
                          )}
                          {ranking.change === 0 && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ranking.searchVolume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ranking.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ranking.ctr.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                        {ranking.url}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredRankings.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterTrend !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start tracking keywords to see rankings here'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
