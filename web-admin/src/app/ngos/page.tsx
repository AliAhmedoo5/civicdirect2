"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock } from "lucide-react"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type NGO = {
  id: string
  name: string
  registration_number: string
  city_zone: string
  is_verified: boolean
  created_at: string
}

export default function NGOsPage() {
  const [ngos, setNgos] = useState<NGO[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    fetchNGOs()
  }, [])

  const fetchNGOs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("ngos")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching NGOs:", error)
    } else {
      setNgos(data || [])
    }
    setLoading(false)
  }

  const handleVerify = async (id: string) => {
    setVerifying(id)
    const { error } = await supabase
      .from("ngos")
      .update({ is_verified: true })
      .eq("id", id)

    if (error) {
      console.error("Error verifying NGO:", error)
      alert("Failed to verify NGO.")
    } else {
      // Optimistic update
      setNgos((prev) =>
        prev.map((ngo) =>
          ngo.id === id ? { ...ngo, is_verified: true } : ngo
        )
      )
    }
    setVerifying(null)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NGO Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and verify incoming NGO registration requests.
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NGO Name</TableHead>
              <TableHead>Reg. Number</TableHead>
              <TableHead>City / Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading NGOs...
                </TableCell>
              </TableRow>
            ) : ngos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No NGOs found.
                </TableCell>
              </TableRow>
            ) : (
              ngos.map((ngo) => (
                <TableRow key={ngo.id}>
                  <TableCell className="font-medium">{ngo.name}</TableCell>
                  <TableCell>{ngo.registration_number || "N/A"}</TableCell>
                  <TableCell>{ngo.city_zone || "N/A"}</TableCell>
                  <TableCell>
                    {ngo.is_verified ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!ngo.is_verified && (
                      <Button
                        size="sm"
                        onClick={() => handleVerify(ngo.id)}
                        disabled={verifying === ngo.id}
                      >
                        {verifying === ngo.id ? "Verifying..." : "Approve NGO"}
                      </Button>
                    )}
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
