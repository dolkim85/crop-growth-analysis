"use client"

import type React from "react"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { X, CalendarIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface DateRangePickerProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  dataPoints?: { date: string; plantType: string }[]
  plantTypes?: { id: string; name: string }[]
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  dataPoints = [],
  plantTypes = [],
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  // 날짜 포맷팅 함수
  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 날짜 범위 텍스트
  const getDateRangeText = () => {
    if (!dateRange.from && !dateRange.to) {
      return "날짜 범위 선택"
    }
    if (dateRange.from && !dateRange.to) {
      return formatDate(dateRange.from)
    }
    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
    }
    return "날짜 범위 선택"
  }

  // 날짜별 데이터 확인
  const hasDataOnDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return dataPoints.some((point) => {
      const pointDate = new Date(point.date).toISOString().split("T")[0]
      return pointDate === dateStr
    })
  }

  // 시작일 선택 핸들러
  const handleFromSelect = (date: Date | undefined) => {
    const newRange = { ...dateRange, from: date }
    // 시작일이 종료일보다 늦으면 종료일 초기화
    if (date && dateRange.to && date > dateRange.to) {
      newRange.to = undefined
    }
    onDateRangeChange(newRange)
  }

  // 종료일 선택 핸들러
  const handleToSelect = (date: Date | undefined) => {
    const newRange = { ...dateRange, to: date }
    // 종료일이 시작일보다 빠르면 시작일 초기화
    if (date && dateRange.from && date < dateRange.from) {
      newRange.from = undefined
    }
    onDateRangeChange(newRange)
  }

  // 초기화
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateRangeChange({ from: undefined, to: undefined })
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal min-w-[280px]"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span className="truncate">{getDateRangeText()}</span>
        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleReset(e)
            }}
            className="ml-auto h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Button>

      {showCalendar && (
        <Card className="absolute z-50 mt-1 p-4 bg-white shadow-lg border rounded-md" style={{ width: "550px" }}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">날짜 범위 선택</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowCalendar(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 첫 번째 달력: 시작일, 두 번째 달력: 종료일을 선택하세요
              {dataPoints.length > 0 && <div className="mt-1">파란색 날짜에는 분석 데이터가 있습니다.</div>}
            </div>

            <div className="flex justify-between gap-6">
              {/* 시작일 달력 */}
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-gray-600 text-center">시작일</p>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={handleFromSelect}
                  className="rounded-md border"
                  modifiers={{
                    hasData: hasDataOnDate,
                  }}
                  modifiersClassNames={{
                    hasData: "bg-blue-100 font-bold text-blue-900",
                  }}
                  classNames={{
                    months: "flex flex-col space-y-2",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "h-8 w-8 text-center text-sm p-0 relative",
                    day: "h-8 w-8 p-0 font-normal text-sm",
                  }}
                />
              </div>

              {/* 종료일 달력 */}
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-gray-600 text-center">종료일</p>
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={handleToSelect}
                  className="rounded-md border"
                  disabled={(date) => {
                    // 시작일이 선택된 경우, 시작일보다 이전 날짜는 비활성화
                    return dateRange.from ? date < dateRange.from : false
                  }}
                  modifiers={{
                    hasData: hasDataOnDate,
                  }}
                  modifiersClassNames={{
                    hasData: "bg-blue-100 font-bold text-blue-900",
                  }}
                  classNames={{
                    months: "flex flex-col space-y-2",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "h-8 w-8 text-center text-sm p-0 relative",
                    day: "h-8 w-8 p-0 font-normal text-sm",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateRangeChange({ from: undefined, to: undefined })
                }}
              >
                초기화
              </Button>
              <Button size="sm" onClick={() => setShowCalendar(false)} className="bg-blue-600 hover:bg-blue-700">
                적용
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
