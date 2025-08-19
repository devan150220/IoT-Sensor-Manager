"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, TestTube, CheckCircle, AlertCircle } from "lucide-react"
import type { Sensor } from "@/types/sensor"

interface SensorFormData {
  sensorId: string
  brokerUrl: string
  topic: string
  description: string
  samplePayload: string
}

interface SensorFormProps {
  sensors: Sensor[]
  setSensors: React.Dispatch<React.SetStateAction<Sensor[]>>
  onSuccess?: () => void
}

export function SensorForm({ sensors, setSensors, onSuccess }: SensorFormProps) {
  const [formData, setFormData] = useState<SensorFormData>({
    sensorId: "",
    brokerUrl: "broker.hivemq.com",
    topic: "",
    description: "",
    samplePayload: '{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z", "unit": "°C"}',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleInputChange = (field: keyof SensorFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate topic when sensor ID changes
      ...(field === "sensorId" && { topic: `sensors/${value}/data` }),
    }))
    // Clear messages when user types
    if (message) setMessage(null)
  }

  const validatePayload = (payload: string): boolean => {
    try {
      const parsed = JSON.parse(payload)
      return typeof parsed === "object" && parsed !== null
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Validate form data
      if (!validatePayload(formData.samplePayload)) {
        throw new Error("Invalid JSON payload format")
      }

      // Check for duplicate sensor IDs
      if (sensors.some((s) => s.sensorId === formData.sensorId)) {
        throw new Error("Sensor ID already exists")
      }

      const flowResponse = await fetch("/api/node-red/flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sensorId: formData.sensorId,
          brokerUrl: formData.brokerUrl,
          topic: formData.topic,
          samplePayload: formData.samplePayload,
        }),
      })

      if (!flowResponse.ok) {
        const errorData = await flowResponse.json()
        throw new Error(errorData.error || "Failed to create Node-RED flow")
      }

      const flowResult = await flowResponse.json()

      const newSensor: Sensor = {
        id: `sensor_${Date.now()}`,
        sensorId: formData.sensorId,
        brokerUrl: formData.brokerUrl,
        topic: formData.topic,
        description: formData.description,
        samplePayload: formData.samplePayload,
        status: "disconnected",
        createdAt: new Date().toISOString(),
        nodeRedFlowId: flowResult.flowId,
      }

      setSensors((prev) => [...prev, newSensor])
      setMessage({ type: "success", text: "Sensor created successfully! Node-RED flow has been generated." })

      // Reset form
      setFormData({
        sensorId: "",
        brokerUrl: "broker.hivemq.com",
        topic: "",
        description: "",
        samplePayload: '{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z", "unit": "°C"}',
      })

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create sensor",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setMessage(null)

    try {
      const testResponse = await fetch("/api/mqtt/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brokerUrl: formData.brokerUrl,
          topic: formData.topic,
          payload: formData.samplePayload,
        }),
      })

      if (!testResponse.ok) {
        const errorData = await testResponse.json()
        throw new Error(errorData.error || "Connection test failed")
      }

      const testResult = await testResponse.json()
      setMessage({ type: "success", text: `Connection test successful! Latency: ${testResult.timestamp}` })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Connection test failed. Please check your broker URL.",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Sensor
        </CardTitle>
        <CardDescription>
          Configure your IoT sensor and automatically create a Node-RED flow for data processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className={`mb-6 ${message.type === "error" ? "border-destructive" : "border-green-500"}`}>
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-700" : ""}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sensor ID */}
          <div className="space-y-2">
            <Label htmlFor="sensorId">Sensor ID *</Label>
            <Input
              id="sensorId"
              placeholder="e.g., temp-sensor-01"
              value={formData.sensorId}
              onChange={(e) => handleInputChange("sensorId", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for your sensor (alphanumeric and hyphens only)
            </p>
          </div>

          {/* MQTT Broker */}
          <div className="space-y-2">
            <Label htmlFor="brokerUrl">MQTT Broker URL *</Label>
            <Input
              id="brokerUrl"
              placeholder="broker.hivemq.com"
              value={formData.brokerUrl}
              onChange={(e) => handleInputChange("brokerUrl", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Using HiveMQ public broker for testing (no authentication required)
            </p>
          </div>

          {/* MQTT Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">MQTT Topic *</Label>
            <Input
              id="topic"
              placeholder="sensors/your-sensor-id/data"
              value={formData.topic}
              onChange={(e) => handleInputChange("topic", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated based on sensor ID. Format: sensors/{"{sensor_id}"}/data
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Temperature sensor in server room"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {/* Sample Payload */}
          <div className="space-y-2">
            <Label htmlFor="samplePayload">Sample JSON Payload *</Label>
            <Textarea
              id="samplePayload"
              placeholder='{"value": 25.5, "timestamp": "2025-08-19T12:00:00Z"}'
              value={formData.samplePayload}
              onChange={(e) => handleInputChange("samplePayload", e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">Example of the JSON data your sensor will send</p>
          </div>

          {/* Expected Data Format */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Expected Data Format:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                • <strong>value</strong>: Sensor reading (number)
              </p>
              <p>
                • <strong>timestamp</strong>: ISO 8601 format
              </p>
              <p>
                • <strong>unit</strong>: Measurement unit (optional)
              </p>
              <p>
                • <strong>QoS</strong>: 0 (at most once delivery)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isLoading || !formData.sensorId || !formData.topic} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Flow...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Sensor Flow
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !formData.brokerUrl}
              className="flex-1 bg-transparent"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
