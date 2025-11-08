'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Keyword } from '@/types'
import { formatNumber } from '@/lib/utils'

interface KeywordTableProps {
  keywords: Keyword[]
}

export function KeywordTable({ keywords }: KeywordTableProps) {
  const getRankChange = (current?: number, previous?: number) => {
    if (!current || !previous) return null

    const change = previous - current // Positive means rank improved
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUp className="mr-1 h-4 w-4" />
          <span>{change}</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDown className="mr-1 h-4 w-4" />
          <span>{Math.abs(change)}</span>
        </div>
      )
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />
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
    <Card>
      <CardHeader>
        <CardTitle>Keyword Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Current Rank</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Search Volume</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>CPC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((keyword) => (
              <TableRow key={keyword.id}>
                <TableCell className="font-medium">{keyword.keyword}</TableCell>
                <TableCell>
                  {keyword.currentRank ? (
                    <span className="font-semibold">#{keyword.currentRank}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {getRankChange(keyword.currentRank, keyword.previousRank)}
                </TableCell>
                <TableCell>{formatNumber(keyword.searchVolume)}</TableCell>
                <TableCell>{getDifficultyBadge(keyword.difficulty)}</TableCell>
                <TableCell>${keyword.cpc.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
