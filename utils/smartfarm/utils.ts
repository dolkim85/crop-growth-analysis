import { EnvironmentData } from './types'

// 날짜 포맷팅 함수
export const formatDate = (date: Date | string | null, format?: string): string => {
  if (!date) return "날짜 없음"
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return "잘못된 날짜"
  
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  
  if (format === "HH:mm") {
    return `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`
  }
  return `${year}년 ${month}월 ${day}일`
}

// 환경 데이터 히스토리 생성
export const generateEnvironmentHistory = (): EnvironmentData[] => {
  const history: EnvironmentData[] = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    
    // 계절적 변화를 반영한 환경 데이터 생성
    const month = date.getMonth()
    const baseTemp = 20 + Math.sin((month - 3) * Math.PI / 6) * 10 // 계절별 온도 변화
    
    history.push({
      innerTemperature: baseTemp + Math.random() * 6 - 3,
      outerTemperature: baseTemp + Math.random() * 10 - 5,
      innerHumidity: 60 + Math.random() * 20,
      rootZoneTemperature: baseTemp - 2 + Math.random() * 4,
      solarRadiation: 300 + Math.random() * 400,
      ph: 6.0 + Math.random() * 1.5,
      ec: 1.2 + Math.random() * 1.0,
      dissolvedOxygen: 6.0 + Math.random() * 2.0,
      timestamp: date
    })
  }
  
  return history
}

// 연합학습 정확도 계산
export const calculateFederatedAccuracy = (trainingCount: number, isPersonalized: boolean): number => {
  // 기본 정확도 85%에서 시작
  let accuracy = 85
  
  // 훈련 횟수에 따른 정확도 향상 (최대 95%)
  const trainingBonus = Math.min(trainingCount * 0.5, 10)
  accuracy += trainingBonus
  
  // 개인화 모델 보너스
  if (isPersonalized && trainingCount >= 10) {
    accuracy += 2
  }
  
  // 최대 97%로 제한
  return Math.min(accuracy, 97)
}

// Mock 분석 결과 생성
export const generateMockStringResult = (itemId: string): string => {
  const results: { [key: string]: string[] } = {
    health: ["매우 건강함", "건강함", "보통", "주의 필요", "치료 필요"],
    classification: ["토마토", "고추", "오이", "상추", "시금치"],
    diagnosis: ["정상", "영양 부족", "병해 의심", "해충 피해", "환경 스트레스"],
    growth_stage: ["발아기", "유묘기", "성장기", "개화기", "결실기"],
    treatment: ["물 공급 증가", "영양제 투여", "병해충 방제", "환경 조절", "지속 관찰"],
    care_recommendations: ["정기적인 물 공급", "적절한 온도 유지", "충분한 광량 확보", "영양 관리", "병해충 예방"]
  }
  
  const options = results[itemId] || ["정상", "양호", "보통", "주의", "관리 필요"]
  return options[Math.floor(Math.random() * options.length)]
}

// Mock 객체 결과 생성
export const generateMockObjectResult = (itemId: string): any => {
  const results: { [key: string]: any } = {
    disease: {
      detected: Math.random() > 0.7,
      type: ["잎마름병", "역병", "흰가루병", "탄저병"][Math.floor(Math.random() * 4)],
      severity: Math.floor(Math.random() * 5) + 1,
      confidence: Math.floor(Math.random() * 30) + 70
    },
    growth: {
      rate: Math.floor(Math.random() * 40) + 60,
      stage: ["초기", "중기", "후기"][Math.floor(Math.random() * 3)],
      expected_harvest: Math.floor(Math.random() * 30) + 15,
      yield_prediction: Math.floor(Math.random() * 20) + 80
    },
    nutrition: {
      nitrogen: Math.floor(Math.random() * 30) + 70,
      phosphorus: Math.floor(Math.random() * 25) + 75,
      potassium: Math.floor(Math.random() * 35) + 65,
      overall_status: ["부족", "적정", "과다"][Math.floor(Math.random() * 3)]
    },
    leaf_analysis: {
      color_score: Math.floor(Math.random() * 20) + 80,
      texture_score: Math.floor(Math.random() * 25) + 75,
      size_score: Math.floor(Math.random() * 30) + 70,
      damage_detected: Math.random() > 0.6
    },
    expert_analysis: {
      overall_score: Math.floor(Math.random() * 30) + 70,
      recommendations: ["적절한 물 관리", "영양소 보충", "환경 개선"],
      risk_factors: ["고온", "습도", "병해충"],
      next_action: "지속적인 모니터링 필요"
    }
  }
  
  return results[itemId] || { status: "정상", score: Math.floor(Math.random() * 30) + 70 }
}

// 권장사항 생성
export const generateRecommendations = (analysisData: any, environmentData?: EnvironmentData): string[] => {
  const recommendations: string[] = []
  
  // 환경 데이터 기반 권장사항
  if (environmentData) {
    if (environmentData.innerTemperature > 30) {
      recommendations.push("🌡️ 온도가 높습니다. 환기를 늘리거나 냉각 시스템을 가동하세요.")
    } else if (environmentData.innerTemperature < 18) {
      recommendations.push("🌡️ 온도가 낮습니다. 난방 시스템을 확인하세요.")
    }
    
    if (environmentData.innerHumidity > 80) {
      recommendations.push("💧 습도가 높습니다. 제습기를 가동하거나 환기를 늘리세요.")
    } else if (environmentData.innerHumidity < 50) {
      recommendations.push("💧 습도가 낮습니다. 가습기를 사용하거나 물을 뿌려주세요.")
    }
    
    if (environmentData.ph < 6.0) {
      recommendations.push("⚗️ pH가 낮습니다. 석회를 추가하여 pH를 조절하세요.")
    } else if (environmentData.ph > 7.5) {
      recommendations.push("⚗️ pH가 높습니다. 황 또는 산성 비료로 pH를 낮추세요.")
    }
    
    if (environmentData.ec > 2.5) {
      recommendations.push("🧪 EC가 높습니다. 물을 추가하여 농도를 낮추세요.")
    } else if (environmentData.ec < 1.0) {
      recommendations.push("🧪 EC가 낮습니다. 영양액 농도를 높이세요.")
    }
  }
  
  // 분석 데이터 기반 권장사항
  if (analysisData.health === "주의 필요" || analysisData.health === "치료 필요") {
    recommendations.push("🚨 식물 상태가 좋지 않습니다. 전문가 상담을 받으시기 바랍니다.")
  }
  
  if (analysisData.disease?.detected) {
    recommendations.push(`🦠 ${analysisData.disease.type} 의심. 즉시 방제 조치가 필요합니다.`)
  }
  
  if (analysisData.nutrition?.overall_status === "부족") {
    recommendations.push("🌱 영양소가 부족합니다. 적절한 비료를 공급하세요.")
  } else if (analysisData.nutrition?.overall_status === "과다") {
    recommendations.push("🌱 영양소가 과다합니다. 물을 늘려 농도를 낮추세요.")
  }
  
  // 기본 권장사항
  if (recommendations.length === 0) {
    recommendations.push("✅ 현재 상태가 양호합니다. 지속적인 관리를 유지하세요.")
    recommendations.push("📊 정기적인 모니터링을 통해 변화를 관찰하세요.")
    recommendations.push("🔄 환경 데이터를 주기적으로 확인하세요.")
  }
  
  return recommendations
} 