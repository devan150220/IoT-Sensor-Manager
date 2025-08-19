"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Sensor } from "@/types/sensor"
import { AlertCircle, Eye, Loader2, MoreVertical, Pause, Play, Search, Settings, Trash2, Wifi, WifiOff } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

interface SensorListProps {
  sensors: Sensor[]
  setSensors: React.Dispatch<React.SetStateAction<Sensor[]>>
}

export function SensorList({ sensors, setSensors }: SensorListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sensor: Sensor | null }>({
    open: false,
    sensor: null,
  })
  const [viewDialog, setViewDialog] = useState<{ open: boolean; content: any | null; title?: string }>({
    open: false,
    content: null,
    title: undefined,
  })
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)

  // Load sensors on mount
  useEffect(() => {
    ;(async () => {
      try {
        setIsLoadingList(true)
        const res = await fetch("/api/sensors")
        const j = await res.json()
        if (res.ok && Array.isArray(j.sensors)) setSensors(j.sensors as Sensor[])
      } catch {}
      finally { setIsLoadingList(false) }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredSensors = sensors.filter(
    (sensor) =>
      sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.topic.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteSensor = (sensor: Sensor) => {
    setDeleteDialog({ open: true, sensor })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.sensor) return
    try {
      setIsDeletingId(deleteDialog.sensor.sensorId)
      const res = await fetch(`/api/sensors/${encodeURIComponent(deleteDialog.sensor.sensorId)}`, { method: "DELETE" })
      if (res.ok) {
        setSensors((prev) => prev.filter((s) => s.sensorId !== deleteDialog.sensor!.sensorId))
      }
    } catch {}
    setDeleteDialog({ open: false, sensor: null })
    setIsDeletingId(null)
  }

  const toggleSensorStatus = async (id: string) => {
    const sensor = sensors.find((s) => s.id === id)
    if (!sensor) return
    const nextStatus = sensor.status === "connected" ? "disconnected" : "connected"
    const payload: Partial<Sensor> = { status: nextStatus, lastSeen: nextStatus === "connected" ? new Date().toISOString() : sensor.lastSeen }
    try {
      setIsTogglingId(id)
      await fetch(`/api/sensors/${encodeURIComponent(sensor.sensorId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {}
    setSensors((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)))
    setIsTogglingId(null)
  }

  const viewSensor = async (sensor: Sensor) => {
    try {
      setIsViewing(true)
      const res = await fetch(`/api/sensors/${encodeURIComponent(sensor.sensorId)}`)
      const j = await res.json()
      if (res.ok) {
        setViewDialog({ open: true, content: j.sensor, title: sensor.sensorId })
        setIsViewing(false)
        return
      }
      setViewDialog({ open: true, content: j, title: sensor.sensorId })
      setIsViewing(false)
    } catch (e) {
      setViewDialog({ open: true, content: { error: e instanceof Error ? e.message : "Failed" }, title: sensor.sensorId })
      setIsViewing(false)
    }
  }

  const getStatusIcon = (status: Sensor["status"]) => {
    switch (status) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-600" />
      case "disconnected":
        return <WifiOff className="w-4 h-4 text-gray-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Sensor["status"]) => {
    const variants = {
      connected: "default",
      disconnected: "secondary",
      error: "destructive",
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  if (isLoadingList) {
    return (
      <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading sensors...</p>
        </div>
      </div>
    )
  }

  if (sensors.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>No Sensors Configured</CardTitle>
          <CardDescription>Get started by adding your first IoT sensor to begin monitoring data.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Settings className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sensors will appear here once you add them using the "Add Sensor" tab.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Management</CardTitle>
          <CardDescription>Monitor and manage your connected IoT sensors and their Node-RED flows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sensors by ID, description, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {filteredSensors.length} of {sensors.length} sensors
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSensors.map((sensor) => (
          <Card key={sensor.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(sensor.status)}
                  <CardTitle className="text-lg">{sensor.sensorId}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleSensorStatus(sensor.id)} disabled={isTogglingId === sensor.id}>
                      {isTogglingId === sensor.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : sensor.status === "connected" ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewSensor(sensor)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Data
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Flow
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteSensor(sensor)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {sensor.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(sensor.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Broker</span>
                  <span className="text-sm text-muted-foreground">{sensor.brokerUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Topic</span>
                  <span className="text-sm text-muted-foreground font-mono">{sensor.topic}</span>
                </div>
                {sensor.lastSeen && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Seen</span>
                    <span className="text-sm text-muted-foreground">{new Date(sensor.lastSeen).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Flow ID: {sensor.nodeRedFlowId}</span>
                  <span>Created {new Date(sensor.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, sensor: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sensor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.sensor?.sensorId}"? This will also remove its associated
              Node-RED flow. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete Sensor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog (reuse AlertDialog for simplicity) */}
      <AlertDialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, content: null, title: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sensor: {viewDialog.title}</AlertDialogTitle>
            <div className="mt-2">
              {isViewing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
{viewDialog.content ? JSON.stringify(viewDialog.content, null, 2) : ""}
                </pre>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction disabled={isViewing}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
