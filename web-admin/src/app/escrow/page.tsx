"use client"

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
import { Loader2, WalletCards } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Database } from "../../../../shared/types/database.types"

type RequestRow = Database['public']['Tables']['requests']['Row'] & {
  ngos: { name: string } | null;
}

export default function EscrowPage() {
  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['escrow-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          ngos ( name )
        `)
        .eq('status', 'fully_funded')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as RequestRow[]
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escrow Pipeline</h1>
          <p className="text-muted-foreground mt-2">
            Campaigns that are fully funded and awaiting manual review for final disbursal.
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Refresh Pipeline
        </Button>
      </div>

      <div className="rounded-md border border-border/50 bg-card">
        <Table>
          {requests?.length === 0 && !isLoading && (
            <TableCaption className="pb-4">No fully funded campaigns waiting for disbursal.</TableCaption>
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
                    <p>Loading escrow pipeline...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-destructive">
                  Error loading pipeline: {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <WalletCards className="h-8 w-8 text-muted-foreground/50" />
                    <p>No campaigns ready for disbursal.</p>
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
                    <Badge variant="outline" className="capitalize text-green-500 border-green-500/20 bg-green-500/10">
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => alert('Disbursal workflow not implemented yet.')}
                    >
                      Process Disbursal
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
