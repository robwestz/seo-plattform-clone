'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Link2,
  Target,
  BarChart2,
  Search,
  Plus,
  X,
  ExternalLink,
  AlertTriangle,
  Award,
  Zap,
} from 'lucide-react';

interface Competitor {
  id: string;
  domain: string;
  name: string;
  estimatedTraffic: number;
  organicKeywords: number;
  paidKeywords: number;
  backlinks: number;
  referringDomains: number;
  domainRating: number;
  trafficTrend: number; // percentage change
  commonKeywords: number;
  keywordGap: number;
  contentGap: number;
  isTracked: boolean;
}

interface KeywordOverlap {
  keyword: string;
  yourPosition: number | null;
  competitorPosition: number;
  searchVolume: number;
  difficulty: number;
  gap: 'winning' | 'losing' | 'missing';
}

interface CompetitorAnalysisProps {
  projectId: string;
  domain: string;
}

export const CompetitorAnalysisDashboard: React.FC<CompetitorAnalysisProps> = ({
  projectId,
  domain,
}) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');
  const [view, setView] = useState<'overview' | 'keywords' | 'content' | 'backlinks'>('overview');

  // Fetch competitors
  const { data: competitors, isLoading } = useQuery<Competitor[]>({
    queryKey: ['competitors', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/competitors`);
      if (!response.ok) throw new Error('Failed to fetch competitors');
      return response.json();
    },
  });

  // Fetch keyword overlap for selected competitor
  const { data: keywordOverlap } = useQuery<KeywordOverlap[]>({
    queryKey: ['keyword-overlap', projectId, selectedCompetitor],
    queryFn: async () => {
      if (!selectedCompetitor) return [];
      const response = await fetch(
        `/api/projects/${projectId}/competitors/${selectedCompetitor}/keywords`
      );
      if (!response.ok) throw new Error('Failed to fetch keyword overlap');
      return response.json();
    },
    enabled: !!selectedCompetitor,
  });

  // Calculate competitive metrics
  const metrics = useMemo(() => {
    if (!competitors) return null;

    const totalCompetitors = competitors.length;
    const avgTraffic =
      competitors.reduce((sum, c) => sum + c.estimatedTraffic, 0) / totalCompetitors;
    const totalCommonKeywords = competitors.reduce((sum, c) => sum + c.commonKeywords, 0);
    const strongCompetitors = competitors.filter((c) => c.domainRating >= 70).length;

    return {
      totalCompetitors,
      avgTraffic: Math.round(avgTraffic),
      totalCommonKeywords,
      strongCompetitors,
    };
  }, [competitors]);

  // Get selected competitor data
  const selectedCompetitorData = useMemo(() => {
    if (!selectedCompetitor || !competitors) return null;
    return competitors.find((c) => c.id === selectedCompetitor);
  }, [selectedCompetitor, competitors]);

  // Analyze keyword gaps
  const keywordGaps = useMemo(() => {
    if (!keywordOverlap) return { winning: 0, losing: 0, missing: 0 };

    return {
      winning: keywordOverlap.filter((k) => k.gap === 'winning').length,
      losing: keywordOverlap.filter((k) => k.gap === 'losing').length,
      missing: keywordOverlap.filter((k) => k.gap === 'missing').length,
    };
  }, [keywordOverlap]);

  const handleAddCompetitor = async () => {
    if (!newCompetitorDomain.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newCompetitorDomain }),
      });

      if (response.ok) {
        setNewCompetitorDomain('');
        setShowAddCompetitor(false);
        // Refetch competitors
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
    }
  };

  const getDomainRatingColor = (rating: number) => {
    if (rating >= 70) return 'text-green-600 bg-green-50';
    if (rating >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0)
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0)
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <div className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{metrics.totalCompetitors}</div>
            <div className="text-sm text-gray-600">Tracked Competitors</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <BarChart2 className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {metrics.avgTraffic.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Avg. Monthly Traffic</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Target className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalCommonKeywords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Common Keywords</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Award className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{metrics.strongCompetitors}</div>
            <div className="text-sm text-gray-600">Strong Competitors (DR 70+)</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitors List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Competitors</h3>
            <button
              onClick={() => setShowAddCompetitor(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showAddCompetitor && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="competitor.com"
                  value={newCompetitorDomain}
                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
                />
                <button
                  onClick={handleAddCompetitor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddCompetitor(false)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {competitors?.map((competitor) => (
              <motion.div
                key={competitor.id}
                whileHover={{ backgroundColor: '#f9fafb' }}
                className={`p-4 cursor-pointer ${
                  selectedCompetitor === competitor.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
                onClick={() => setSelectedCompetitor(competitor.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900 mb-1">{competitor.name}</div>
                    <div className="text-sm text-gray-500">{competitor.domain}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getDomainRatingColor(
                      competitor.domainRating
                    )}`}
                  >
                    DR {competitor.domainRating}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Traffic</div>
                    <div className="font-medium flex items-center gap-1">
                      {getTrendIcon(competitor.trafficTrend)}
                      {competitor.estimatedTraffic.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Keywords</div>
                    <div className="font-medium">{competitor.organicKeywords.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Backlinks</div>
                    <div className="font-medium">{competitor.backlinks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Common</div>
                    <div className="font-medium text-blue-600">{competitor.commonKeywords}</div>
                  </div>
                </div>

                {competitor.keywordGap > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{competitor.keywordGap} keyword opportunities</span>
                  </div>
                )}
              </motion.div>
            ))}

            {(!competitors || competitors.length === 0) && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No competitors yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add competitors to analyze their SEO strategy
                </p>
                <button
                  onClick={() => setShowAddCompetitor(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Competitor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCompetitorData ? (
            <>
              {/* Competitor Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCompetitorData.name}
                    </h2>
                    <a
                      href={`https://${selectedCompetitorData.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      {selectedCompetitorData.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getDomainRatingColor(
                      selectedCompetitorData.domainRating
                    )}`}
                  >
                    Domain Rating: {selectedCompetitorData.domainRating}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Est. Traffic</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedCompetitorData.estimatedTraffic.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Organic Keywords</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedCompetitorData.organicKeywords.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Backlinks</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedCompetitorData.backlinks.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Referring Domains</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedCompetitorData.referringDomains.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 flex gap-2 p-2">
                  <button
                    onClick={() => setView('overview')}
                    className={`px-4 py-2 rounded-lg ${
                      view === 'overview'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setView('keywords')}
                    className={`px-4 py-2 rounded-lg ${
                      view === 'keywords'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Keywords
                  </button>
                  <button
                    onClick={() => setView('content')}
                    className={`px-4 py-2 rounded-lg ${
                      view === 'content'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setView('backlinks')}
                    className={`px-4 py-2 rounded-lg ${
                      view === 'backlinks'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Backlinks
                  </button>
                </div>

                <div className="p-6">
                  {view === 'overview' && (
                    <div className="space-y-6">
                      {/* Keyword Gaps */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Keyword Opportunities</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {keywordGaps.winning}
                            </div>
                            <div className="text-sm text-green-700">You're Winning</div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                              {keywordGaps.losing}
                            </div>
                            <div className="text-sm text-red-700">You're Losing</div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {keywordGaps.missing}
                            </div>
                            <div className="text-sm text-blue-700">Missing Keywords</div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Performance Comparison</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Common Keywords</span>
                            <span className="font-semibold text-gray-900">
                              {selectedCompetitorData.commonKeywords}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Keyword Gap</span>
                            <span className="font-semibold text-amber-600">
                              {selectedCompetitorData.keywordGap} opportunities
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Content Gap</span>
                            <span className="font-semibold text-blue-600">
                              {selectedCompetitorData.contentGap} pages
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {view === 'keywords' && keywordOverlap && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Keyword Overlap Analysis</h3>
                        <span className="text-sm text-gray-600">
                          {keywordOverlap.length} keywords
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {keywordOverlap.slice(0, 50).map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{keyword.keyword}</div>
                              <div className="text-sm text-gray-600">
                                Volume: {keyword.searchVolume.toLocaleString()} | Difficulty:{' '}
                                {keyword.difficulty}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-xs text-gray-500">You</div>
                                <div className="font-semibold">
                                  {keyword.yourPosition ? `#${keyword.yourPosition}` : '-'}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500">Them</div>
                                <div className="font-semibold">#{keyword.competitorPosition}</div>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  keyword.gap === 'winning'
                                    ? 'bg-green-100 text-green-800'
                                    : keyword.gap === 'losing'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {keyword.gap}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {view === 'content' && (
                    <div className="text-center py-12">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Content Gap Analysis
                      </h3>
                      <p className="text-gray-600">
                        Analyzing competitor content to find opportunities
                      </p>
                    </div>
                  )}

                  {view === 'backlinks' && (
                    <div className="text-center py-12">
                      <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Backlink Analysis
                      </h3>
                      <p className="text-gray-600">
                        Discovering competitor backlink opportunities
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a Competitor
              </h3>
              <p className="text-gray-600">
                Choose a competitor from the list to view detailed analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
