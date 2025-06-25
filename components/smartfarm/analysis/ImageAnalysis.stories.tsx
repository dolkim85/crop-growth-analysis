import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { ImageAnalysis } from './ImageAnalysis'

const meta: Meta<typeof ImageAnalysis> = {
  title: 'SmartFarm/Analysis/ImageAnalysis',
  component: ImageAnalysis,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '작물 이미지를 업로드하고 AI 분석을 수행하는 컴포넌트입니다. 드래그앤드롭, 파일 선택, 분석 진행률 표시 등의 기능을 제공합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onAnalysisComplete: {
      description: '분석 완료 시 호출되는 콜백 함수',
      action: 'analysis-complete',
    },
    maxImages: {
      description: '최대 업로드 가능한 이미지 수',
      control: { type: 'number', min: 1, max: 20, step: 1 },
    },
    allowedFormats: {
      description: '허용되는 이미지 형식',
      control: 'object',
    },
    maxFileSize: {
      description: '최대 파일 크기 (바이트)',
      control: { type: 'number', min: 1024, max: 50 * 1024 * 1024, step: 1024 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 5,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
}

export const SingleImage: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 1,
    allowedFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  parameters: {
    docs: {
      description: {
        story: '단일 이미지만 업로드할 수 있는 모드입니다. 정밀한 개별 분석이 필요한 경우 사용합니다.',
      },
    },
  },
}

export const MultipleImages: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 10,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  parameters: {
    docs: {
      description: {
        story: '여러 이미지를 한 번에 업로드하여 배치 분석할 수 있는 모드입니다. 대량의 작물 이미지를 처리할 때 유용합니다.',
      },
    },
  },
}

export const RestrictedFormats: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 5,
    allowedFormats: ['image/jpeg'], // JPEG만 허용
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  parameters: {
    docs: {
      description: {
        story: 'JPEG 형식만 허용하고 파일 크기를 제한한 모드입니다. 네트워크 대역폭이 제한적인 환경에서 사용합니다.',
      },
    },
  },
}

export const HighResolution: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 3,
    allowedFormats: ['image/jpeg', 'image/png', 'image/tiff'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  parameters: {
    docs: {
      description: {
        story: '고해상도 이미지를 처리할 수 있는 모드입니다. 상세한 분석이 필요한 연구용 이미지에 적합합니다.',
      },
    },
  },
}

export const MobileOptimized: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 3,
    allowedFormats: ['image/jpeg', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: '모바일 환경에 최적화된 설정입니다. 파일 크기와 이미지 수를 제한하여 모바일 네트워크에서도 원활하게 사용할 수 있습니다.',
      },
    },
  },
}

export const WithAnalysisInProgress: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 5,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024,
  },
  parameters: {
    docs: {
      description: {
        story: '분석이 진행 중인 상태를 시뮬레이션합니다. 실제 사용 시 분석 진행률과 상태 메시지가 표시됩니다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // 분석 진행 상태 시뮬레이션
    const simulateAnalysis = () => {
      console.log('분석 시작...')
      // 실제로는 컴포넌트 내부 상태를 조작해야 함
    }
    
    setTimeout(simulateAnalysis, 1000)
  },
}

export const ErrorHandling: Story = {
  args: {
    onAnalysisComplete: action('analysis-complete'),
    maxImages: 2,
    allowedFormats: ['image/jpeg'], // 제한적인 형식
    maxFileSize: 1024 * 1024, // 1MB - 작은 크기 제한
  },
  parameters: {
    docs: {
      description: {
        story: '에러 처리 상황을 테스트할 수 있는 설정입니다. 큰 파일이나 지원하지 않는 형식의 파일을 업로드하면 에러 메시지가 표시됩니다.',
      },
    },
  },
}

export const CustomCallback: Story = {
  args: {
    onAnalysisComplete: (results) => {
      action('analysis-complete')(results)
      console.log('분석 결과:', results)
      alert(`분석이 완료되었습니다!\n건강도: ${results.health}\n성장상태: ${results.growth}`)
    },
    maxImages: 5,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024,
  },
  parameters: {
    docs: {
      description: {
        story: '사용자 정의 콜백 함수를 사용하는 예시입니다. 분석 완료 시 커스텀 로직을 실행할 수 있습니다.',
      },
    },
  },
}

export const BatchAnalysis: Story = {
  args: {
    onAnalysisComplete: action('batch-analysis-complete'),
    maxImages: 20,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 15 * 1024 * 1024,
  },
  parameters: {
    docs: {
      description: {
        story: '대량의 이미지를 배치로 처리하는 모드입니다. 농장 전체의 작물 상태를 한 번에 분석할 때 사용합니다.',
      },
    },
  },
} 