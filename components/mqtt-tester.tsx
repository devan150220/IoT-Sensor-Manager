"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Send, TestTube, CheckCircle, AlertCircle, Zap, Activity, Clock, Database } from "lucide-react"
import { generateSensorData } from "@/lib/mqtt-client"

interface TestResult {
  success: boolean
  message: string
  timestamp: string
  data?: any
}

export function MqttTester() {
  const [connectionTest, setConnectionTest] = useState({
    brokerUrl: "broker.hivemq.com",
    isLoading: false,
    result: null as TestResult | null,
  })

  const [publishTest, setPublishTest] = useState({
    brokerUrl: "broker.hivemq.com",
    topic: "sensors/test-sensor/data",
    payload: '{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z", "unit": "°C"}',
    qos: "0" as "0" | "1" | "2",
    isLoading: false,
    result: null as TestResult | null,
  })

  const [simulationTest, setSimulationTest] = useState({
    sensorId: "test-sensor-01",
    dataType: "temperature" as "temperature" | "humidity" | "pressure" | "generic",
    interval: 5,
    isRunning: false,
    messageCount: 0,
    lastMessage: null as any,
  })

  const handleConnectionTest = async () => {
    setConnectionTest((prev) => ({ ...prev, isLoading: true, result: null }))

    try {
      const response = await fetch("/api/mqtt/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brokerUrl: connectionTest.brokerUrl,
          topic: "test/connection",
          payload: '{"test": true}',
        }),
      })

      const result = await response.json()

      setConnectionTest((prev) => ({
        ...prev,
        result: {
          success: response.ok,
          message: result.message || (response.ok ? "Connection successful" : "Connection failed"),
          timestamp: new Date().toISOString(),
          data: result,
        },
      }))
    } catch (error) {
      setConnectionTest((prev) => ({
        ...prev,
        result: {
          success: false,
          message: error instanceof Error ? error.message : "Connection test failed",
          timestamp: new Date().toISOString(),
        },
      }))
    } finally {
      setConnectionTest((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handlePublishTest = async () => {
    setPublishTest((prev) => ({ ...prev, isLoading: true, result: null }))

    try {
      // Validate JSON payload
      JSON.parse(publishTest.payload)

      const response = await fetch("/api/mqtt/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brokerUrl: publishTest.brokerUrl,
          topic: publishTest.topic,
          payload: publishTest.payload,
          qos: Number.parseInt(publishTest.qos),
        }),
      })

      const result = await response.json()

      setPublishTest((prev) => ({
        ...prev,
        result: {
          success: response.ok,
          message: result.message || (response.ok ? "Message published" : "Publish failed"),
          timestamp: new Date().toISOString(),
          data: result,
        },
      }))
    } catch (error) {
      setPublishTest((prev) => ({
        ...prev,
        result: {
          success: false,
          message: error instanceof Error ? error.message : "Publish test failed",
          timestamp: new Date().toISOString(),
        },
      }))
    } finally {
      setPublishTest((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleStartSimulation = async () => {
    setSimulationTest((prev) => ({ ...prev, isRunning: true, messageCount: 0 }))

    const publishMessage = async () => {
      const sensorData = generateSensorData(simulationTest.sensorId, simulationTest.dataType)

      try {
        const response = await fetch("/api/mqtt/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brokerUrl: "broker.hivemq.com",
            topic: `sensors/${simulationTest.sensorId}/data`,
            payload: JSON.stringify(sensorData),
            qos: 0,
          }),
        })

        if (response.ok) {
          setSimulationTest((prev) => ({
            ...prev,
            messageCount: prev.messageCount + 1,
            lastMessage: sensorData,
          }))
        }
      } catch (error) {
        console.error("Simulation publish error:", error)
      }
    }

    // Publish first message immediately
    await publishMessage()

    // Set up interval for subsequent messages
    const intervalId = setInterval(publishMessage, simulationTest.interval * 1000)

    // Store interval ID for cleanup
    ;(window as any).simulationInterval = intervalId
  }

  const handleStopSimulation = () => {
    setSimulationTest((prev) => ({ ...prev, isRunning: false }))
    if ((window as any).simulationInterval) {
      clearInterval((window as any).simulationInterval)
      delete (window as any).simulationInterval
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            MQTT Testing Suite
          </CardTitle>
          <CardDescription>
            Test MQTT connections, publish messages, and simulate sensor data to verify your setup.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection" className="gap-2">
            <Database className="w-4 h-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-2">
            <Send className="w-4 h-4" />
            Publish
          </TabsTrigger>
          <TabsTrigger value="simulate" className="gap-2">
            <Zap className="w-4 h-4" />
            Simulate
          </TabsTrigger>
        </TabsList>

        {/* Connection Test */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Test</CardTitle>
              <CardDescription>Test connectivity to your MQTT broker.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conn-broker">MQTT Broker URL</Label>
                <Input
                  id="conn-broker"
                  value={connectionTest.brokerUrl}
                  onChange={(e) => setConnectionTest((prev) => ({ ...prev, brokerUrl: e.target.value }))}
                  placeholder="broker.hivemq.com"
                />
              </div>

              <Button
                onClick={handleConnectionTest}
                disabled={connectionTest.isLoading || !connectionTest.brokerUrl}
                className="w-full"
              >
                {connectionTest.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              {connectionTest.result && (
                <Alert className={connectionTest.result.success ? "border-green-500" : "border-destructive"}>
                  {connectionTest.result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription className={connectionTest.result.success ? "text-green-700" : ""}>
                    <div className="space-y-1">
                      <p>{connectionTest.result.message}</p>
                      <p className="text-xs opacity-75">{new Date(connectionTest.result.timestamp).toLocaleString()}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publish Test */}
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Publishing</CardTitle>
              <CardDescription>Send test messages to MQTT topics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pub-broker">MQTT Broker URL</Label>
                  <Input
                    id="pub-broker"
                    value={publishTest.brokerUrl}
                    onChange={(e) => setPublishTest((prev) => ({ ...prev, brokerUrl: e.target.value }))}
                    placeholder="broker.hivemq.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pub-topic">Topic</Label>
                  <Input
                    id="pub-topic"
                    value={publishTest.topic}
                    onChange={(e) => setPublishTest((prev) => ({ ...prev, topic: e.target.value }))}
                    placeholder="sensors/test-sensor/data"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pub-payload">JSON Payload</Label>
                <Textarea
                  id="pub-payload"
                  value={publishTest.payload}
                  onChange={(e) => setPublishTest((prev) => ({ ...prev, payload: e.target.value }))}
                  rows={4}
                  placeholder='{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z"}'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pub-qos">Quality of Service (QoS)</Label>
                <Select
                  value={publishTest.qos}
                  onValueChange={(value: "0" | "1" | "2") => setPublishTest((prev) => ({ ...prev, qos: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - At most once</SelectItem>
                    <SelectItem value="1">1 - At least once</SelectItem>
                    <SelectItem value="2">2 - Exactly once</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handlePublishTest}
                disabled={publishTest.isLoading || !publishTest.brokerUrl || !publishTest.topic}
                className="w-full"
              >
                {publishTest.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Message
                  </>
                )}
              </Button>

              {publishTest.result && (
                <Alert className={publishTest.result.success ? "border-green-500" : "border-destructive"}>
                  {publishTest.result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription className={publishTest.result.success ? "text-green-700" : ""}>
                    <div className="space-y-1">
                      <p>{publishTest.result.message}</p>
                      {publishTest.result.data?.messageId && (
                        <p className="text-xs opacity-75">Message ID: {publishTest.result.data.messageId}</p>
                      )}
                      <p className="text-xs opacity-75">{new Date(publishTest.result.timestamp).toLocaleString()}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Test */}
        <TabsContent value="simulate">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sensor Data Simulation</CardTitle>
              <CardDescription>Generate and publish realistic sensor data automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sim-sensor">Sensor ID</Label>
                  <Input
                    id="sim-sensor"
                    value={simulationTest.sensorId}
                    onChange={(e) => setSimulationTest((prev) => ({ ...prev, sensorId: e.target.value }))}
                    placeholder="test-sensor-01"
                    disabled={simulationTest.isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sim-type">Data Type</Label>
                  <Select
                    value={simulationTest.dataType}
                    onValueChange={(value: typeof simulationTest.dataType) =>
                      setSimulationTest((prev) => ({ ...prev, dataType: value }))
                    }
                    disabled={simulationTest.isRunning}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature (°C)</SelectItem>
                      <SelectItem value="humidity">Humidity (%)</SelectItem>
                      <SelectItem value="pressure">Pressure (hPa)</SelectItem>
                      <SelectItem value="generic">Generic Values</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-interval">Publish Interval (seconds)</Label>
                <Input
                  id="sim-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={simulationTest.interval}
                  onChange={(e) =>
                    setSimulationTest((prev) => ({ ...prev, interval: Number.parseInt(e.target.value) || 5 }))
                  }
                  disabled={simulationTest.isRunning}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartSimulation}
                  disabled={simulationTest.isRunning || !simulationTest.sensorId}
                  className="flex-1"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Start Simulation
                </Button>
                <Button
                  onClick={handleStopSimulation}
                  disabled={!simulationTest.isRunning}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Stop Simulation
                </Button>
              </div>

              {simulationTest.isRunning && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Simulation Status</span>
                    <Badge variant="default" className="animate-pulse">
                      Running
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Messages sent: {simulationTest.messageCount}</div>
                  <div className="text-sm text-muted-foreground">Topic: sensors/{simulationTest.sensorId}/data</div>
                  {simulationTest.lastMessage && (
                    <div className="mt-3">
                      <Label className="text-xs">Last Message:</Label>
                      <pre className="text-xs bg-background p-2 rounded border mt-1 overflow-x-auto">
                        {JSON.stringify(simulationTest.lastMessage, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
