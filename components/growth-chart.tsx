"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface GrowthData {
  date: string
  height: number
  leafCount: number
  leafSize: number
  health: number
}

interface GrowthChartProps {
  data: GrowthData[]
  type: "line" | "bar"
  dataKey: string
  title: string
  color: string
  yAxisLabel: string
}

export function GrowthChart({ data, type, dataKey, title, color, yAxisLabel }: GrowthChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>표시할 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
