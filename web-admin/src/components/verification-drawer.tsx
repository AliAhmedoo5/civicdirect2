"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DynamicPayloadRenderer } from "./dynamic-payload-renderer"
import { Database } from "../../../shared/types/database.types"
import { supabase } from "@/lib/supabase"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type RequestRow = Database['public']['Tables']['requests']['Row'] & {
  ngos: { name: string } | null;
}

interface VerificationDrawerProps {
  request: RequestRow | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerificationDrawer({ request, isOpen, onOpenChange }: VerificationDrawerProps) {
  const queryClient = useQueryClient()

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      onOpenChange(false)
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
      onOpenChange(false)
    }
  })

  if (!request) return null

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-background border-l-border/50">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">Request Details</SheetTitle>
            <Badge variant="outline" className="capitalize">
              {request.status}
            </Badge>
          </div>
          <SheetDescription>
            Review the details and documents below to verify or reject this campaign.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">NGO Organization</h4>
            <p className="text-lg font-medium">{request.ngos?.name || 'Unknown NGO'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Request Type</h4>
              <Badge variant="secondary" className="capitalize">{request.request_type}</Badge>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Target Amount</h4>
              <p className="text-lg font-medium">Rs. {request.target_amount.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Urgency</h4>
              <Badge variant={request.urgency_level === 'critical' ? 'destructive' : 'default'} className="capitalize">
                {request.urgency_level}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dynamic Data Payload</h4>
            <DynamicPayloadRenderer 
              requestType={request.request_type} 
              details={request.details as Record<string, any>} 
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Proof Document</h4>
            {request.proof_image_url ? (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <img src={request.proof_image_url} alt="Proof Document" className="w-full object-cover" />
              </div>
            ) : (
              <div className="p-4 border border-dashed border-border rounded-md text-center text-muted-foreground">
                No proof image uploaded.
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-border/50">
            <Button 
              className="flex-1" 
              variant="destructive"
              onClick={() => rejectMutation.mutate(request.id)}
              disabled={rejectMutation.isPending || verifyMutation.isPending || request.status !== 'pending'}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => verifyMutation.mutate(request.id)}
              disabled={rejectMutation.isPending || verifyMutation.isPending || request.status !== 'pending'}
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify & Publish'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
