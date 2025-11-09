import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Link,
  Hash,
  Type,
  AlignLeft,
  FileSearch,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

// Interfaces
interface ContentScore {
  overall: number;
  seo: number;
  readability: number;
  engagement: number;
  technical: number;
}

interface ReadabilityMetrics {
  fleschKincaid: number;
  fleschReadingEase: number;
  gunningFog: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  gradeLevel: string;
  readingTime: number;
}

interface KeywordDensity {
  keyword: string;
  count: number;
  density: number;
  prominence: number;
  distribution: 'excellent' | 'good' | 'fair' | 'poor';
}

interface HeadingStructure {
  level: number;
  text: string;
  hasKeyword: boolean;
  length: number;
}

interface LinkAnalysis {
  internal: number;
  external: number;
  broken: number;
  nofollow: number;
  dofollow: number;
  anchorTextOptimized: number;
}

interface MetaData {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  hasH1: boolean;
  h1Count: number;
  hasImages: boolean;
  imagesWithAlt: number;
  totalImages: number;
}

interface ContentIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'readability' | 'technical' | 'engagement';
  message: string;
  recommendation: string;
}

interface ContentAnalysis {
  id: string;
  url: string;
  title: string;
  wordCount: number;
  scores: ContentScore;
  readability: ReadabilityMetrics;
  keywordDensity: KeywordDensity[];
  headings: HeadingStructure[];
  links: LinkAnalysis;
  meta: MetaData;
  issues: ContentIssue[];
  analyzedAt: Date;
}

interface ContentAnalysisInterfaceProps {
  projectId: string;
  contentId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ContentAnalysisInterface: React.FC<ContentAnalysisInterfaceProps> = ({
  projectId,
  contentId,
  autoRefresh = false,
  refreshInterval = 300000,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'single' | 'bulk'>('single');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'seo' | 'readability' | 'technical' | 'engagement'>('all');

  // Fetch content analysis
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery<ContentAnalysis>({
    queryKey: ['content-analysis', projectId, selectedUrl || contentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/content/analyze?${selectedUrl ? `url=${selectedUrl}` : `id=${contentId}`}`
      );
      if (!response.ok) throw new Error('Failed to fetch content analysis');
      return response.json();
    },
    enabled: !!(selectedUrl || contentId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!analysis) return null;

    const criticalIssues = analysis.issues.filter((i) => i.severity === 'critical').length;
    const warnings = analysis.issues.filter((i) => i.severity === 'warning').length;
    const totalIssues = analysis.issues.length;

    return {
      overallScore: analysis.scores.overall,
      criticalIssues,
      warnings,
      totalIssues,
      readingTime: analysis.readability.readingTime,
      wordCount: analysis.wordCount,
      scoreChange: '+5', // Mock change
    };
  }, [analysis]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    if (!analysis) return [];

    let issues = analysis.issues;

    if (filterSeverity !== 'all') {
      issues = issues.filter((i) => i.severity === filterSeverity);
    }

    if (selectedCategory !== 'all') {
      issues = issues.filter((i) => i.category === selectedCategory);
    }

    return issues;
  }, [analysis, filterSeverity, selectedCategory]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get score background
  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Get severity icon
  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get readability level color
  const getReadabilityColor = (score: number): string => {
    if (score >= 60) return 'text-green-600'; // Easy
    if (score >= 30) return 'text-yellow-600'; // Moderate
    return 'text-red-600'; // Difficult
  };

  // Export analysis
  const handleExport = useCallback(() => {
    if (!analysis) return;

    const csvContent = [
      ['Content Analysis Report'],
      ['URL', analysis.url],
      ['Title', analysis.title],
      ['Word Count', analysis.wordCount.toString()],
      [''],
      ['Scores'],
      ['Overall', analysis.scores.overall.toString()],
      ['SEO', analysis.scores.seo.toString()],
      ['Readability', analysis.scores.readability.toString()],
      ['Engagement', analysis.scores.engagement.toString()],
      ['Technical', analysis.scores.technical.toString()],
      [''],
      ['Readability Metrics'],
      ['Flesch Reading Ease', analysis.readability.fleschReadingEase.toString()],
      ['Flesch-Kincaid Grade', analysis.readability.fleschKincaid.toString()],
      ['Grade Level', analysis.readability.gradeLevel],
      ['Reading Time (min)', analysis.readability.readingTime.toString()],
      [''],
      ['Issues'],
      ['Severity', 'Category', 'Message', 'Recommendation'],
      ...analysis.issues.map((issue) => [
        issue.severity,
        issue.category,
        issue.message,
        issue.recommendation,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-analysis-${analysis.id}.csv`;
    a.click();
  }, [analysis]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-900">Analysis Failed</h3>
            <p className="text-red-700 text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <FileSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Selected</h3>
        <p className="text-gray-600">Select a URL or content piece to analyze</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Analysis</h2>
          <p className="text-gray-600 mt-1">{analysis.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Overall Score</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(analysis.scores.overall)}`}>
              {analysis.scores.overall}
            </span>
            <span className="text-sm text-green-600">+{stats?.scoreChange}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">SEO Score</span>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.seo)}`}>
            {analysis.scores.seo}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Readability</span>
            <Eye className="h-4 w-4 text-gray-400" />
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.scores.readability)}`}>
            {analysis.scores.readability}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Critical Issues</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">{stats?.criticalIssues}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Word Count</span>
            <Type className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{analysis.wordCount.toLocaleString()}</div>
          <span className="text-xs text-gray-500">{analysis.readability.readingTime} min read</span>
        </motion.div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readability Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-blue-500" />
            Readability Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Flesch Reading Ease</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getReadabilityColor(analysis.readability.fleschReadingEase)}`}>
                  {analysis.readability.fleschReadingEase.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Flesch-Kincaid Grade</span>
              <span className="font-semibold text-gray-900">{analysis.readability.fleschKincaid.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gunning Fog Index</span>
              <span className="font-semibold text-gray-900">{analysis.readability.gunningFog.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SMOG Index</span>
              <span className="font-semibold text-gray-900">{analysis.readability.smogIndex.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium text-gray-700">Reading Level</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {analysis.readability.gradeLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Link Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-500" />
            Link Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Internal Links</span>
              <span className="font-semibold text-gray-900">{analysis.links.internal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">External Links</span>
              <span className="font-semibold text-gray-900">{analysis.links.external}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Broken Links</span>
              <span className="font-semibold text-red-600">{analysis.links.broken}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">DoFollow Links</span>
              <span className="font-semibold text-green-600">{analysis.links.dofollow}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">NoFollow Links</span>
              <span className="font-semibold text-gray-600">{analysis.links.nofollow}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Optimized Anchor Text</span>
              <span className="font-semibold text-blue-600">{analysis.links.anchorTextOptimized}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Density */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-blue-500" />
          Keyword Density
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Density</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prominence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysis.keywordDensity.slice(0, 10).map((kw, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{kw.keyword}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{kw.count}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(kw.density * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${kw.prominence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{(kw.prominence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        kw.distribution === 'excellent'
                          ? 'bg-green-100 text-green-700'
                          : kw.distribution === 'good'
                          ? 'bg-blue-100 text-blue-700'
                          : kw.distribution === 'fair'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {kw.distribution}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues & Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Issues & Recommendations
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="seo">SEO</option>
              <option value="readability">Readability</option>
              <option value="technical">Technical</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p>No issues found with current filters</p>
            </div>
          ) : (
            filteredIssues.map((issue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-l-4 ${
                  issue.severity === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : issue.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : issue.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {issue.category}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{issue.message}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentAnalysisInterface;
