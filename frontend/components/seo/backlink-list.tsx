'use client'

import { ExternalLink, Check, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Backlink } from '@/types'
import { formatDate } from '@/lib/utils'

interface BacklinkListProps {
  backlinks: Backlink[]
}

export function BacklinkList({ backlinks }: BacklinkListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlinks</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Domain</TableHead>
              <TableHead>Anchor Text</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>DA</TableHead>
              <TableHead>PA</TableHead>
              <TableHead>First Seen</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backlinks.map((backlink) => (
              <TableRow key={backlink.id}>
                <TableCell className="font-medium">
                  {backlink.sourceDomain}
                </TableCell>
                <TableCell>
                  <span className="max-w-xs truncate">{backlink.anchorText}</span>
                </TableCell>
                <TableCell>
                  {backlink.doFollow ? (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="mr-1 h-3 w-3" />
                      DoFollow
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="mr-1 h-3 w-3" />
                      NoFollow
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{backlink.domainAuthority}</TableCell>
                <TableCell>{backlink.pageAuthority}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(backlink.firstSeen)}
                </TableCell>
                <TableCell>
                  <a
                    href={backlink.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
