'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export default function KeywordResearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  const mockResults = [
    {
      keyword: 'seo tools',
      volume: 12000,
      difficulty: 65,
      cpc: 4.5,
      trend: 'up',
    },
    {
      keyword: 'best seo tools',
      volume: 8500,
      difficulty: 72,
      cpc: 5.2,
      trend: 'up',
    },
    {
      keyword: 'free seo tools',
      volume: 15000,
      difficulty: 58,
      cpc: 3.8,
      trend: 'stable',
    },
    {
      keyword: 'seo analysis tools',
      volume: 5200,
      difficulty: 55,
      cpc: 4.1,
      trend: 'down',
    },
  ]

  const handleSearch = () => {
    setResults(mockResults)
  }

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty < 30) {
      return <Badge className="bg-green-500">Easy</Badge>
    } else if (difficulty < 60) {
      return <Badge className="bg-yellow-500">Medium</Badge>
    } else {
      return <Badge className="bg-red-500">Hard</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Keyword Research</h1>
          <p className="text-muted-foreground">
            Discover new keyword opportunities for your content
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Find Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter a seed keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Keyword Ideas ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Search Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {result.keyword}
                      </TableCell>
                      <TableCell>{formatNumber(result.volume)}</TableCell>
                      <TableCell>{getDifficultyBadge(result.difficulty)}</TableCell>
                      <TableCell>${result.cpc.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.trend === 'up'
                              ? 'default'
                              : result.trend === 'down'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {result.trend}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Track
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
