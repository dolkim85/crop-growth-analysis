import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EnvironmentDataDisplay } from '@/components/smartfarm/environment/EnvironmentData'
import { EnvironmentData } from '@/utils/smartfarm/types'

const mockEnvironmentData: EnvironmentData = {
  innerTemperature: 25.5,
  outerTemperature: 22.3,
  innerHumidity: 68,
  rootZoneTemperature: 24.2,
  solarRadiation: 420,
  ph: 6.5,
  ec: 1.8,
  dissolvedOxygen: 7.2,
  timestamp: new Date('2024-12-25T14:30:00')
}

describe('EnvironmentDataDisplay', () => {
  it('renders environment data correctly', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} />)
    
    expect(screen.getByText('환경 데이터')).toBeInTheDocument()
    expect(screen.getByText('25.5°C')).toBeInTheDocument()
    expect(screen.getByText('22.3°C')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
    expect(screen.getByText('6.5')).toBeInTheDocument()
    expect(screen.getByText('1.8dS/m')).toBeInTheDocument()
  })

  it('shows timestamp when enabled', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} showTimestamp={true} />)
    
    expect(screen.getByText(/14:30:00/)).toBeInTheDocument()
  })

  it('hides timestamp when disabled', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} showTimestamp={false} />)
    
    expect(screen.queryByText(/14:30:00/)).not.toBeInTheDocument()
  })

  it('renders in compact mode', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} compact={true} />)
    
    // 컴팩트 모드에서는 카드 헤더가 없어야 함
    expect(screen.queryByText('환경 데이터')).not.toBeInTheDocument()
    // 하지만 데이터는 여전히 표시되어야 함
    expect(screen.getByText('25.5°C')).toBeInTheDocument()
  })

  it('shows correct status badges for optimal conditions', () => {
    const optimalData: EnvironmentData = {
      ...mockEnvironmentData,
      innerTemperature: 25, // 적정 범위
      innerHumidity: 65,    // 적정 범위
      ph: 6.5,             // 적정 범위
      ec: 1.8              // 적정 범위
    }
    
    render(<EnvironmentDataDisplay data={optimalData} />)
    
    const statusBadges = screen.getAllByText('적정')
    expect(statusBadges).toHaveLength(4) // 온도, 습도, pH, EC 모두 적정
  })

  it('shows warning badges for suboptimal conditions', () => {
    const suboptimalData: EnvironmentData = {
      ...mockEnvironmentData,
      innerTemperature: 35, // 높은 온도
      innerHumidity: 45,    // 낮은 습도
      ph: 8.5,             // 높은 pH
      ec: 3.5              // 높은 EC
    }
    
    render(<EnvironmentDataDisplay data={suboptimalData} />)
    
    const warningBadges = screen.getAllByText('주의')
    expect(warningBadges).toHaveLength(4) // 모든 값이 주의 범위
  })

  it('displays all sensor readings', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} />)
    
    // 모든 센서 값들이 표시되는지 확인
    expect(screen.getByText('내부온도')).toBeInTheDocument()
    expect(screen.getByText('외부온도')).toBeInTheDocument()
    expect(screen.getByText('내부습도')).toBeInTheDocument()
    expect(screen.getByText('근권온도')).toBeInTheDocument()
    expect(screen.getByText('일사량')).toBeInTheDocument()
    expect(screen.getByText('용존산소')).toBeInTheDocument()
    expect(screen.getByText('산성도')).toBeInTheDocument()
    expect(screen.getByText('전기전도도')).toBeInTheDocument()
  })

  it('formats values correctly', () => {
    render(<EnvironmentDataDisplay data={mockEnvironmentData} />)
    
    // 온도는 소수점 1자리
    expect(screen.getByText('25.5°C')).toBeInTheDocument()
    expect(screen.getByText('22.3°C')).toBeInTheDocument()
    expect(screen.getByText('24.2°C')).toBeInTheDocument()
    
    // 습도는 정수
    expect(screen.getByText('68%')).toBeInTheDocument()
    
    // 일사량은 정수
    expect(screen.getByText('420W/m²')).toBeInTheDocument()
    
    // pH, EC, 용존산소는 소수점 1자리
    expect(screen.getByText('6.5')).toBeInTheDocument()
    expect(screen.getByText('1.8dS/m')).toBeInTheDocument()
    expect(screen.getByText('7.2mg/L')).toBeInTheDocument()
  })
}) 