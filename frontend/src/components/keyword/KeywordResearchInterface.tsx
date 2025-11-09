'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Zap,
  Target,
  DollarSign,
  BarChart3,
  Filter,
  Download,
  Plus,
  Check,
  X,
  Sparkles,
  Brain,
  Globe,
} from 'lucide-react';
import { debounce } from 'lodash';

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  trend: number[];
  serp Features: string[];
  opportunityScore: number;
  isTracked: boolean;
}

interface KeywordFilters {
  minVolume: number;
  maxVolume: number;
  minDifficulty: number;
  maxDifficulty: number;
  intents: string[];
  hasQuestionModifier: boolean;
  hasLocalModifier: boolean;
}

interface KeywordResearchProps {
  projectId: string;
  onKeywordAdd?: (keyword: string) => void;
}

export const KeywordResearchInterface: React.FC<KeywordResearchProps> = ({
  projectId,
  onKeywordAdd,
}) => {
  const queryClient = useQueryClient();
  const [seedKeyword, setSeedKeyword] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<KeywordFilters>({
    minVolume: 0,
    maxVolume: 1000000,
    minDifficulty: 0,
    maxDifficulty: 100,
    intents: [],
    hasQuestionModifier: false,
    hasLocalModifier: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'suggestions' | 'questions' | 'related' | 'competitors'>('suggestions');

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      if (keyword.trim().length >= 2) {
        refetch();
      }
    }, 500),
    []
  );

  // Fetch keyword suggestions
  const { data: suggestions, isLoading, refetch } = useQuery<KeywordSuggestion[]>({
    queryKey: ['keyword-suggestions', projectId, seedKeyword, analysisMode, filters],
    queryFn: async () => {
      if (!seedKeyword.trim()) return [];

      const response = await fetch(`/api/keywords/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          seedKeyword,
          mode: analysisMode,
          filters,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: seedKeyword.trim().length >= 2,
    staleTime: 300000, // 5 minutes
  });

  // Add keywords mutation
  const addKeywordsMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) throw new Error('Failed to add keywords');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords', projectId] });
      setSelectedKeywords(new Set());
    },
  });

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSeedKeyword(value);
    debouncedSearch(value);
  };

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];

    return suggestions.filter((s) => {
      // Volume filter
      if (s.searchVolume < filters.minVolume || s.searchVolume > filters.maxVolume) {
        return false;
      }

      // Difficulty filter
      if (s.difficulty < filters.minDifficulty || s.difficulty > filters.maxDifficulty) {
        return false;
      }

      // Intent filter
      if (filters.intents.length > 0 && !filters.intents.includes(s.intent)) {
        return false;
      }

      // Question modifier
      if (filters.hasQuestionModifier) {
        const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which'];
        if (!questionWords.some((q) => s.keyword.toLowerCase().startsWith(q))) {
          return false;
        }
      }

      // Local modifier
      if (filters.hasLocalModifier) {
        const localWords = ['near me', 'nearby', 'local', 'in'];
        if (!localWords.some((l) => s.keyword.toLowerCase().includes(l))) {
          return false;
        }
      }

      return true;
    });
  }, [suggestions, filters]);

  // Calculate aggregated metrics
  const metrics = useMemo(() => {
    if (!filteredSuggestions.length) return null;

    const totalVolume = filteredSuggestions.reduce((sum, s) => sum + s.searchVolume, 0);
    const avgDifficulty =
      filteredSuggestions.reduce((sum, s) => sum + s.difficulty, 0) / filteredSuggestions.length;
    const avgCPC = filteredSuggestions.reduce((sum, s) => sum + s.cpc, 0) / filteredSuggestions.length;
    const highOpportunity = filteredSuggestions.filter((s) => s.opportunityScore >= 7).length;

    return {
      total: filteredSuggestions.length,
      totalVolume,
      avgDifficulty: avgDifficulty.toFixed(1),
      avgCPC: avgCPC.toFixed(2),
      highOpportunity,
    };
  }, [filteredSuggestions]);

  // Toggle keyword selection
  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  // Select all filtered
  const selectAllFiltered = () => {
    const newSelected = new Set(selectedKeywords);
    filteredSuggestions.forEach((s) => newSelected.add(s.keyword));
    setSelectedKeywords(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedKeywords(new Set());
  };

  // Add selected keywords
  const handleAddSelected = async () => {
    if (selectedKeywords.size === 0) return;
    await addKeywordsMutation.mutateAsync(Array.from(selectedKeywords));
  };

  // Export to CSV
  const handleExport = () => {
    if (!filteredSuggestions.length) return;

    const csv = [
      [
        'Keyword',
        'Volume',
        'Difficulty',
        'CPC',
        'Competition',
        'Intent',
        'Opportunity',
        'SERP Features',
      ].join(','),
      ...filteredSuggestions.map((s) =>
        [
          s.keyword,
          s.searchVolume,
          s.difficulty,
          s.cpc,
          s.competition,
          s.intent,
          s.opportunityScore,
          s.serpFeatures.join(';'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-research-${seedKeyword}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'informational':
        return 'bg-blue-100 text-blue-800';
      case 'navigational':
        return 'bg-purple-100 text-purple-800';
      case 'commercial':
        return 'bg-yellow-100 text-yellow-800';
      case 'transactional':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600';
    if (difficulty <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Search and Mode Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Seed Keyword Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter seed keyword (e.g., 'seo tools')"
              value={seedKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Analysis Mode Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setAnalysisMode('suggestions')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                analysisMode === 'suggestions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Suggestions
            </button>
            <button
              onClick={() => setAnalysisMode('questions')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                analysisMode === 'questions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              Questions
            </button>
            <button
              onClick={() => setAnalysisMode('related')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                analysisMode === 'related'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              Related
            </button>
            <button
              onClick={() => setAnalysisMode('competitors')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                analysisMode === 'competitors'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              Competitors
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.intents.length > 0 ||
                filters.minVolume > 0 ||
                filters.maxVolume < 1000000 ||
                filters.minDifficulty > 0 ||
                filters.maxDifficulty < 100) && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {selectedKeywords.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedKeywords.size} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleAddSelected}
                    disabled={addKeywordsMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Project
                  </button>
                </>
              )}
              <button
                onClick={handleExport}
                disabled={!filteredSuggestions.length}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Volume
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minVolume}
                  onChange={(e) =>
                    setFilters({ ...filters, minVolume: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxVolume}
                  onChange={(e) =>
                    setFilters({ ...filters, maxVolume: parseInt(e.target.value) || 1000000 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minDifficulty}
                  onChange={(e) =>
                    setFilters({ ...filters, minDifficulty: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="100"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxDifficulty}
                  onChange={(e) =>
                    setFilters({ ...filters, maxDifficulty: parseInt(e.target.value) || 100 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Intent
              </label>
              <div className="space-y-2">
                {['informational', 'navigational', 'commercial', 'transactional'].map((intent) => (
                  <label key={intent} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.intents.includes(intent)}
                      onChange={(e) => {
                        const newIntents = e.target.checked
                          ? [...filters.intents, intent]
                          : filters.intents.filter((i) => i !== intent);
                        setFilters({ ...filters, intents: newIntents });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{intent}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasQuestionModifier}
                  onChange={(e) =>
                    setFilters({ ...filters, hasQuestionModifier: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Question keywords only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasLocalModifier}
                  onChange={(e) =>
                    setFilters({ ...filters, hasLocalModifier: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Local keywords only</span>
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Keywords</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Avg. Difficulty</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgDifficulty}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">High Opportunity</div>
            <div className="text-2xl font-bold text-green-600">{metrics.highOpportunity}</div>
          </div>
        </div>
      )}

      {/* Keywords List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSuggestions.length > 0 ? (
          <div>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Keyword Suggestions</h3>
              <button
                onClick={selectAllFiltered}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select All
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.keyword}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedKeywords.has(suggestion.keyword) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleKeyword(suggestion.keyword)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {selectedKeywords.has(suggestion.keyword) ? (
                          <Check className="w-5 h-5 text-blue-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{suggestion.keyword}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getIntentColor(suggestion.intent)}`}>
                            {suggestion.intent}
                          </span>
                          {suggestion.isTracked && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                              Tracked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            {suggestion.searchVolume.toLocaleString()} vol
                          </span>
                          <span className={`flex items-center gap-1 font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                            <Target className="w-4 h-4" />
                            {suggestion.difficulty} KD
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${suggestion.cpc.toFixed(2)} CPC
                          </span>
                        </div>
                        {suggestion.serpFeatures.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {suggestion.serpFeatures.map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Opportunity</div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getOpportunityColor(suggestion.opportunityScore)}`}
                          ></div>
                          <span className="text-sm font-semibold text-gray-900">
                            {suggestion.opportunityScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : seedKeyword.trim() ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords found</h3>
            <p className="text-gray-600">Try a different seed keyword or adjust your filters</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to discover keywords</h3>
            <p className="text-gray-600">Enter a seed keyword above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
