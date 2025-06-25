'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Droplets, Sun, Zap } from "lucide-react"
import { EnvironmentData } from '@/utils/smartfarm/types'

interface EnvironmentDataProps {
  data: EnvironmentData
  showTimestamp?: boolean
  compact?: boolean
}

export const EnvironmentDataDisplay: React.FC<EnvironmentDataProps> = ({ 
  data, 
  showTimestamp = true, 
  compact = false 
}) => {
  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="text-center">
          <div className="text-xs text-gray-600">내부온도</div>
          <div className="font-bold text-red-600">{data.innerTemperature.toFixed(1)}°C</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">습도</div>
          <div className="font-bold text-blue-600">{data.innerHumidity.toFixed(0)}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">pH</div>
          <div className="font-bold text-green-600">{data.ph.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">EC</div>
          <div className="font-bold text-purple-600">{data.ec.toFixed(1)}dS/m</div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🌡️ 환경 데이터
          {showTimestamp && (
            <Badge variant="secondary" className="text-xs">
              {data.timestamp.toLocaleTimeString('ko-KR')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 온도 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-sm text-gray-600">내부온도</div>
                <div className="text-lg font-bold text-red-600">
                  {data.innerTemperature.toFixed(1)}°C
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-sm text-gray-600">외부온도</div>
                <div className="text-lg font-bold text-orange-600">
                  {data.outerTemperature.toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>

          {/* 습도 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">내부습도</div>
                <div className="text-lg font-bold text-blue-600">
                  {data.innerHumidity.toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-cyan-500" />
              <div>
                <div className="text-sm text-gray-600">근권온도</div>
                <div className="text-lg font-bold text-cyan-600">
                  {data.rootZoneTemperature.toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>

          {/* 광량 및 용존산소 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Sun className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-sm text-gray-600">일사량</div>
                <div className="text-lg font-bold text-yellow-600">
                  {data.solarRadiation.toFixed(0)}W/m²
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
              <Zap className="h-5 w-5 text-teal-500" />
              <div>
                <div className="text-sm text-gray-600">용존산소</div>
                <div className="text-lg font-bold text-teal-600">
                  {data.dissolvedOxygen.toFixed(1)}mg/L
                </div>
              </div>
            </div>
          </div>

          {/* pH 및 EC */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                pH
              </div>
              <div>
                <div className="text-sm text-gray-600">산성도</div>
                <div className="text-lg font-bold text-green-600">
                  {data.ph.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                EC
              </div>
              <div>
                <div className="text-sm text-gray-600">전기전도도</div>
                <div className="text-lg font-bold text-purple-600">
                  {data.ec.toFixed(1)}dS/m
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상태 평가 */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">환경 상태 평가</div>
          <div className="flex flex-wrap gap-2">
            {/* 온도 상태 */}
            <Badge 
              variant={data.innerTemperature >= 18 && data.innerTemperature <= 30 ? "default" : "destructive"}
              className="text-xs"
            >
              온도: {data.innerTemperature >= 18 && data.innerTemperature <= 30 ? "적정" : "주의"}
            </Badge>
            
            {/* 습도 상태 */}
            <Badge 
              variant={data.innerHumidity >= 50 && data.innerHumidity <= 80 ? "default" : "destructive"}
              className="text-xs"
            >
              습도: {data.innerHumidity >= 50 && data.innerHumidity <= 80 ? "적정" : "주의"}
            </Badge>
            
            {/* pH 상태 */}
            <Badge 
              variant={data.ph >= 6.0 && data.ph <= 7.5 ? "default" : "destructive"}
              className="text-xs"
            >
              pH: {data.ph >= 6.0 && data.ph <= 7.5 ? "적정" : "주의"}
            </Badge>
            
            {/* EC 상태 */}
            <Badge 
              variant={data.ec >= 1.0 && data.ec <= 2.5 ? "default" : "destructive"}
              className="text-xs"
            >
              EC: {data.ec >= 1.0 && data.ec <= 2.5 ? "적정" : "주의"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 