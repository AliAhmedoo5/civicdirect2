"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Inbox, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { VerificationDrawer } from "@/components/verification-drawer"
import { Database } from "../../../shared/types/database.types"

type RequestRow = Database['public']['Tables']['requests']['Row'] & {
  ngos: { name: string } | null;
}

export default function InboxPage() {
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          ngos ( name )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as RequestRow[]
    }
  })

  const openDrawer = (request: RequestRow) => {
    setSelectedRequest(request)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Inbox</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve NGO registration and campaign requests.
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Refresh Queue
        </Button>
      </div>

      <div className="rounded-md border border-border/50 bg-card">
        <Table>
          {requests?.length === 0 && !isLoading && (
            <TableCaption className="pb-4">No pending requests at the moment.</TableCaption>
          )}
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Target Amount</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading requests...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-destructive">
                  Error loading requests: {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                    <p>Queue is empty.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((request) => (
                <TableRow key={request.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium capitalize">{request.request_type}</TableCell>
                  <TableCell>{request.ngos?.name || 'Unknown'}</TableCell>
                  <TableCell>Rs. {request.target_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={request.urgency_level === 'critical' ? 'destructive' : 'default'} className="capitalize">
                      {request.urgency_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openDrawer(request)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VerificationDrawer 
        request={selectedRequest} 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
      />
    </div>
  )
}
