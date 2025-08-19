"use client"

import { MqttTester } from "@/components/mqtt-tester"
import { SensorForm } from "@/components/sensor-form"
import { SensorList } from "@/components/sensor-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Sensor } from "@/types/sensor"
import { Activity, Database, List, Plus, Settings, TestTube, Wifi } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoadingOverview, setIsLoadingOverview] = useState(false)

  // Load sensors on first render to populate overview
  useEffect(() => {
    ;(async () => {
      try {
        setIsLoadingOverview(true)
        const res = await fetch("/api/sensors")
        const j = await res.json()
        if (res.ok && Array.isArray(j.sensors)) setSensors(j.sensors as Sensor[])
      } finally {
        setIsLoadingOverview(false)
      }
    })()
  }, [])

  const connectedSensors = sensors.filter((s) => s.status === "connected").length
  const totalFlows = sensors.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">IoT Sensor Manager</h1>
                <p className="text-sm text-muted-foreground">MQTT • Node-RED • Real-time Data</p>
              </div>
            </div>
            <Button onClick={() => setActiveTab("add-sensor")} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Sensor
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sensors" className="gap-2">
              <List className="w-4 h-4" />
              Sensors ({sensors.length})
            </TabsTrigger>
            <TabsTrigger value="add-sensor" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Sensor
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-2">
              <TestTube className="w-4 h-4" />
              Testing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected Sensors</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoadingOverview ? "–" : connectedSensors}</div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingOverview
                      ? "Loading..."
                      : sensors.length === 0
                      ? "No sensors configured yet"
                      : `${connectedSensors} of ${sensors.length} online`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Node-RED Flows</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoadingOverview ? "–" : totalFlows}</div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingOverview ? "Loading..." : totalFlows === 0 ? "Flows will be auto-generated" : "Active processing flows"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MQTT Status</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant={connectedSensors > 0 ? "default" : "secondary"}>
                      {isLoadingOverview ? "Loading" : connectedSensors > 0 ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Using HiveMQ public broker</p>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome to IoT Sensor Manager</CardTitle>
                <CardDescription>
                  Connect and manage your IoT sensors with automated Node-RED flows and MQTT communication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">What you can do:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Add sensors with custom MQTT topics</li>
                      <li>• Auto-generate Node-RED flows</li>
                      <li>• Test sensor connections</li>
                      <li>• Monitor real-time data</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">System Requirements:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Node-RED running on port 1880</li>
                      <li>• MQTT broker (HiveMQ public)</li>
                      <li>• JSON payload format</li>
                      <li>• Topic: sensors/{"{sensor_id}"}/data</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {sensors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest sensor updates and system events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sensors.slice(0, 3).map((sensor) => (
                      <div key={sensor.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              sensor.status === "connected"
                                ? "bg-green-500"
                                : sensor.status === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-sm">{sensor.sensorId}</p>
                            <p className="text-xs text-muted-foreground">{sensor.topic}</p>
                          </div>
                        </div>
                        <Badge variant={sensor.status === "connected" ? "default" : "secondary"}>{sensor.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sensors Tab */}
          <TabsContent value="sensors">
            <SensorList sensors={sensors} setSensors={setSensors} />
          </TabsContent>

          {/* Add Sensor Tab */}
          <TabsContent value="add-sensor" className="flex justify-center">
            <SensorForm sensors={sensors} setSensors={setSensors} onSuccess={() => setActiveTab("sensors")} />
          </TabsContent>

          <TabsContent value="testing">
            <MqttTester />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
