import type { Meta, StoryObj } from '@storybook/react'
import { EnvironmentDataDisplay } from './EnvironmentData'
import { EnvironmentData } from '@/utils/smartfarm/types'

const meta: Meta<typeof EnvironmentDataDisplay> = {
  title: 'SmartFarm/Environment/EnvironmentDataDisplay',
  component: EnvironmentDataDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '스마트팜 환경 데이터를 시각화하는 컴포넌트입니다. 온도, 습도, pH, EC 등의 센서 데이터를 표시하고 상태를 평가합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: '표시할 환경 데이터',
      control: 'object',
    },
    showTimestamp: {
      description: '타임스탬프 표시 여부',
      control: 'boolean',
    },
    compact: {
      description: '컴팩트 모드 (헤더 숨김)',
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 환경 데이터
const defaultEnvironmentData: EnvironmentData = {
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

// 적정 조건
const optimalEnvironmentData: EnvironmentData = {
  innerTemperature: 25.0,
  outerTemperature: 22.0,
  innerHumidity: 65,
  rootZoneTemperature: 24.0,
  solarRadiation: 400,
  ph: 6.5,
  ec: 1.8,
  dissolvedOxygen: 7.0,
  timestamp: new Date()
}

// 주의 조건
const warningEnvironmentData: EnvironmentData = {
  innerTemperature: 35.0, // 높은 온도
  outerTemperature: 32.0,
  innerHumidity: 45, // 낮은 습도
  rootZoneTemperature: 30.0,
  solarRadiation: 800, // 높은 일사량
  ph: 8.5, // 높은 pH
  ec: 3.5, // 높은 EC
  dissolvedOxygen: 4.0, // 낮은 용존산소
  timestamp: new Date()
}

// 위험 조건
const criticalEnvironmentData: EnvironmentData = {
  innerTemperature: 40.0, // 매우 높은 온도
  outerTemperature: 38.0,
  innerHumidity: 30, // 매우 낮은 습도
  rootZoneTemperature: 35.0,
  solarRadiation: 1000, // 매우 높은 일사량
  ph: 9.0, // 매우 높은 pH
  ec: 4.0, // 매우 높은 EC
  dissolvedOxygen: 2.0, // 매우 낮은 용존산소
  timestamp: new Date()
}

export const Default: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
}

export const OptimalConditions: Story = {
  args: {
    data: optimalEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: '모든 환경 조건이 적정 범위에 있는 상태입니다. 모든 센서 값이 녹색 "적정" 배지로 표시됩니다.',
      },
    },
  },
}

export const WarningConditions: Story = {
  args: {
    data: warningEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: '일부 환경 조건이 주의 범위에 있는 상태입니다. 해당 센서 값들이 주황색 "주의" 배지로 표시됩니다.',
      },
    },
  },
}

export const CriticalConditions: Story = {
  args: {
    data: criticalEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: '환경 조건이 위험 범위에 있는 상태입니다. 즉시 조치가 필요한 상황을 나타냅니다.',
      },
    },
  },
}

export const CompactMode: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: false,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: '컴팩트 모드에서는 카드 헤더가 숨겨지고 데이터만 간결하게 표시됩니다. 대시보드나 다른 컴포넌트 내부에 임베드할 때 유용합니다.',
      },
    },
  },
}

export const WithoutTimestamp: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: false,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: '타임스탬프를 숨긴 상태입니다. 실시간 데이터를 표시할 때 시간 정보가 불필요한 경우 사용합니다.',
      },
    },
  },
}

export const RealTimeSimulation: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: '실시간으로 변화하는 환경 데이터를 시뮬레이션합니다. 실제 스마트팜에서는 이런 식으로 센서 데이터가 업데이트됩니다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // 실시간 데이터 업데이트 시뮬레이션
    const updateData = () => {
      const newData: EnvironmentData = {
        ...defaultEnvironmentData,
        innerTemperature: 20 + Math.random() * 15,
        innerHumidity: 50 + Math.random() * 30,
        ph: 6.0 + Math.random() * 2,
        ec: 1.0 + Math.random() * 2,
        timestamp: new Date()
      }
      // 실제로는 컴포넌트 props를 업데이트해야 함
    }
    
    // 5초마다 데이터 업데이트
    const interval = setInterval(updateData, 5000)
    
    // 스토리가 언마운트될 때 인터벌 정리
    return () => clearInterval(interval)
  },
}

export const MobileView: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 표시 상태입니다. 반응형 디자인으로 작은 화면에서도 데이터를 읽기 쉽게 표시됩니다.',
      },
    },
  },
}

export const TabletView: Story = {
  args: {
    data: defaultEnvironmentData,
    showTimestamp: true,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 표시 상태입니다.',
      },
    },
  },
} 