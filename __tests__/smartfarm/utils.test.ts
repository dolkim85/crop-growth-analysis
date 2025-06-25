import { 
  formatDate, 
  generateEnvironmentHistory, 
  generateMockStringResult, 
  generateRecommendations 
} from '@/utils/smartfarm/utils'
import { EnvironmentData } from '@/utils/smartfarm/types'

describe('Smartfarm Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const testDate = new Date('2024-12-25T14:30:00')
      expect(formatDate(testDate)).toBe('2024년 12월 25일')
    })

    it('should format time correctly', () => {
      const testDate = new Date('2024-12-25T14:30:00')
      expect(formatDate(testDate, 'HH:mm')).toBe('14:30')
    })

    it('should handle null date', () => {
      expect(formatDate(null)).toBe('날짜 없음')
    })

    it('should handle invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('잘못된 날짜')
    })
  })

  describe('generateEnvironmentHistory', () => {
    it('should generate environment history with correct length', () => {
      const history = generateEnvironmentHistory(5)
      expect(history).toHaveLength(5)
    })

    it('should generate valid environment data', () => {
      const history = generateEnvironmentHistory(1)
      const data = history[0]
      
      expect(data.innerTemperature).toBeGreaterThan(15)
      expect(data.innerTemperature).toBeLessThan(35)
      expect(data.innerHumidity).toBeGreaterThan(40)
      expect(data.innerHumidity).toBeLessThan(90)
      expect(data.ph).toBeGreaterThan(5.5)
      expect(data.ph).toBeLessThan(8.0)
      expect(data.ec).toBeGreaterThan(0.8)
      expect(data.ec).toBeLessThan(3.0)
    })

    it('should have timestamps in chronological order', () => {
      const history = generateEnvironmentHistory(3)
      expect(history[0].timestamp.getTime()).toBeGreaterThan(history[1].timestamp.getTime())
      expect(history[1].timestamp.getTime()).toBeGreaterThan(history[2].timestamp.getTime())
    })
  })

  describe('generateMockStringResult', () => {
    it('should generate health result', () => {
      const result = generateMockStringResult('health')
      expect(['좋음', '보통', '주의']).toContain(result)
    })

    it('should generate classification result', () => {
      const result = generateMockStringResult('classification')
      expect(result).toMatch(/토마토|오이|고추|상추|딸기/)
    })

    it('should generate diagnosis result', () => {
      const result = generateMockStringResult('diagnosis')
      expect(result).toMatch(/건강함|경미한|주의 필요/)
    })

    it('should generate default result for unknown item', () => {
      const result = generateMockStringResult('unknown')
      expect(result).toBe('정상')
    })
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations based on analysis data', () => {
      const analysisData = {
        health: '주의',
        disease: { detected: true, type: '잎마름병' }
      }
      
      const recommendations = generateRecommendations(analysisData)
      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('should include environment-based recommendations', () => {
      const analysisData = { health: '좋음' }
      const environmentData: EnvironmentData = {
        innerTemperature: 35, // 높은 온도
        outerTemperature: 30,
        innerHumidity: 45, // 낮은 습도
        rootZoneTemperature: 28,
        solarRadiation: 800,
        ph: 8.2, // 높은 pH
        ec: 3.5, // 높은 EC
        dissolvedOxygen: 4.0, // 낮은 용존산소
        timestamp: new Date()
      }
      
      const recommendations = generateRecommendations(analysisData, environmentData)
      const recommendationText = recommendations.join(' ')
      
      expect(recommendationText).toMatch(/온도|습도|pH|EC|용존산소/)
    })

    it('should provide healthy plant recommendations when all is good', () => {
      const analysisData = { health: '좋음' }
      const environmentData: EnvironmentData = {
        innerTemperature: 25,
        outerTemperature: 22,
        innerHumidity: 65,
        rootZoneTemperature: 24,
        solarRadiation: 400,
        ph: 6.5,
        ec: 1.8,
        dissolvedOxygen: 7.0,
        timestamp: new Date()
      }
      
      const recommendations = generateRecommendations(analysisData, environmentData)
      const recommendationText = recommendations.join(' ')
      
      expect(recommendationText).toMatch(/현재 상태|유지|관리/)
    })
  })
}) 