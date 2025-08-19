"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Play, Pause, Trash2, Eye, Settings, Wifi, WifiOff, AlertCircle } from "lucide-react"
import type { Sensor } from "@/types/sensor"

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

  const filteredSensors = sensors.filter(
    (sensor) =>
      sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.topic.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteSensor = (sensor: Sensor) => {
    setDeleteDialog({ open: true, sensor })
  }

  const confirmDelete = () => {
    if (deleteDialog.sensor) {
      setSensors((prev) => prev.filter((s) => s.id !== deleteDialog.sensor!.id))
      setDeleteDialog({ open: false, sensor: null })
    }
  }

  const toggleSensorStatus = (sensorId: string) => {
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === sensorId
          ? {
              ...sensor,
              status: sensor.status === "connected" ? "disconnected" : "connected",
              lastSeen: sensor.status === "disconnected" ? new Date().toISOString() : sensor.lastSeen,
            }
          : sensor,
      ),
    )
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
                    <DropdownMenuItem onClick={() => toggleSensorStatus(sensor.id)}>
                      {sensor.status === "connected" ? (
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
                    <DropdownMenuItem>
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
                  <span className="text-sm text-muted-foreground font-mono text-xs">{sensor.topic}</span>
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
    </div>
  )
}
