import { renderHook, act } from '@testing-library/react'
import { useBackend } from '@/hooks/smartfarm/useBackend'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('useBackend', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useBackend())
    
    expect(result.current.connectionStatus).toBe('disconnected')
  })

  it('should check backend connection successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' })
    } as Response)

    const { result } = renderHook(() => useBackend())

    await act(async () => {
      await result.current.checkBackendConnection()
    })

    expect(result.current.connectionStatus).toBe('connected')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/health'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )
  })

  it('should handle backend connection failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useBackend())

    await act(async () => {
      await result.current.checkBackendConnection()
    })

    expect(result.current.connectionStatus).toBe('disconnected')
  })

  it('should send analysis request successfully', async () => {
    const mockResponse = {
      status: 'success',
      message: '분석 완료',
      data: {
        health: '좋음',
        growth: '정상',
        recommend: '물 주기 필요'
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useBackend())
    const formData = new FormData()
    formData.append('images', new File([''], 'test.jpg', { type: 'image/jpeg' }))

    let response: any
    await act(async () => {
      response = await result.current.sendAnalysisRequest(formData)
    })

    expect(response).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/analyze'),
      expect.objectContaining({
        method: 'POST',
        body: formData
      })
    )
  })

  it('should handle analysis request failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ status: 'error', message: 'Server error' })
    } as Response)

    const { result } = renderHook(() => useBackend())
    const formData = new FormData()

    await act(async () => {
      try {
        await result.current.sendAnalysisRequest(formData)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Server error')
      }
    })
  })

  it('should send federated analysis request', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        hybrid_health_score: 85,
        personalized_prediction: { accuracy: 92 },
        farm_recommendations: '온도를 2도 낮추세요'
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useBackend())
    const formData = new FormData()

    let response: any
    await act(async () => {
      response = await result.current.sendFederatedAnalysisRequest(formData)
    })

    expect(response).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/federated-analysis'),
      expect.objectContaining({
        method: 'POST',
        body: formData
      })
    )
  })

  it('should send feedback successfully', async () => {
    const mockResponse = { status: 'success', message: '피드백이 저장되었습니다' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useBackend())
    const feedbackData = {
      rating: 5,
      comment: '매우 정확한 분석이었습니다',
      analysisId: 'test-123'
    }

    let response: any
    await act(async () => {
      response = await result.current.sendFeedback(feedbackData)
    })

    expect(response).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/feedback'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(feedbackData)
      })
    )
  })

  it('should handle network timeout', async () => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 100)
    )
    
    mockFetch.mockImplementationOnce(() => timeoutPromise)

    const { result } = renderHook(() => useBackend())

    await act(async () => {
      await result.current.checkBackendConnection()
    })

    expect(result.current.connectionStatus).toBe('disconnected')
  })

  it('should retry connection on failure', async () => {
    // 첫 번째 시도는 실패
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    // 두 번째 시도는 성공
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' })
    } as Response)

    const { result } = renderHook(() => useBackend())

    // 첫 번째 시도
    await act(async () => {
      await result.current.checkBackendConnection()
    })
    expect(result.current.connectionStatus).toBe('disconnected')

    // 두 번째 시도
    await act(async () => {
      await result.current.checkBackendConnection()
    })
    expect(result.current.connectionStatus).toBe('connected')
  })
}) 