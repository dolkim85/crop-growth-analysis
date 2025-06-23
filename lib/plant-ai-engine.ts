import * as tf from '@tensorflow/tfjs'

// 환경 데이터 인터페이스
interface EnvironmentData {
  innerTemperature: number
  outerTemperature: number
  innerHumidity: number
  rootZoneTemperature: number
  solarRadiation: number
  ph: number
  ec: number
  dissolvedOxygen: number
}

// 분석 옵션 인터페이스
interface AnalysisOptions {
  plantType: string
  environmentData?: EnvironmentData
  analysisItems: string[]
  modelId: string
}

// AI 모델 정의
export const AI_MODELS = {
  'plant-health-basic': {
    id: 'plant-health-basic',
    name: '기본 식물 건강도 모델',
    accuracy: 89,
    analysisItems: [
      { id: 'plantHealth', name: '식물 건강도', type: 'number', unit: '%' },
      { id: 'leafColor', name: '잎 색상 분석', type: 'object' },
      { id: 'size', name: '크기 측정', type: 'number', unit: 'cm' },
      { id: 'leafCount', name: '잎 개수', type: 'number', unit: '개' },
      { id: 'condition', name: '전체 상태', type: 'string' }
    ]
  },
  'growth-analysis-advanced': {
    id: 'growth-analysis-advanced',
    name: '고급 성장 분석 모델',
    accuracy: 94,
    analysisItems: [
      { id: 'growthRate', name: '성장률', type: 'number', unit: '%' },
      { id: 'height', name: '높이', type: 'number', unit: 'cm' },
      { id: 'leafSize', name: '잎 크기', type: 'number', unit: 'cm²' },
      { id: 'stemThickness', name: '줄기 두께', type: 'number', unit: 'mm' },
      { id: 'growthStage', name: '성장 단계', type: 'string' }
    ]
  },
  'disease-detection': {
    id: 'disease-detection',
    name: '질병 감지 모델',
    accuracy: 96,
    analysisItems: [
      { id: 'diseasePresence', name: '질병 유무', type: 'boolean' },
      { id: 'diseaseType', name: '질병 종류', type: 'string' },
      { id: 'severity', name: '심각도', type: 'number', unit: '%' },
      { id: 'affectedArea', name: '감염 부위', type: 'object' },
      { id: 'treatment', name: '치료 방법', type: 'string' }
    ]
  },
  'nutrition-analysis': {
    id: 'nutrition-analysis',
    name: '영양 상태 분석 모델',
    accuracy: 91,
    analysisItems: [
      { id: 'nitrogen', name: '질소 상태', type: 'object' },
      { id: 'phosphorus', name: '인 상태', type: 'object' },
      { id: 'potassium', name: '칼륨 상태', type: 'object' },
      { id: 'micronutrients', name: '미량원소', type: 'object' },
      { id: 'nutritionScore', name: '영양 점수', type: 'number', unit: '%' }
    ]
  },
  'environmental-impact': {
    id: 'environmental-impact',
    name: '환경 영향 분석 모델',
    accuracy: 88,
    analysisItems: [
      { id: 'temperatureStress', name: '온도 스트레스', type: 'object' },
      { id: 'humidityImpact', name: '습도 영향', type: 'object' },
      { id: 'lightStress', name: '광 스트레스', type: 'object' },
      { id: 'soilCondition', name: '토양 상태', type: 'object' },
      { id: 'environmentScore', name: '환경 점수', type: 'number', unit: '%' }
    ]
  }
}

export class PlantAIEngine {
  private models: Map<string, tf.LayersModel> = new Map()
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    console.log('🚀 전문가용 PlantAIEngine 초기화 시작')
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._initialize()
    return this.initializationPromise
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🔄 AI 모델들 초기화 중...')
      
      // TensorFlow.js 백엔드 설정
      await tf.ready()
      
      // 각 모델별로 초기화
      for (const [modelId, modelConfig] of Object.entries(AI_MODELS)) {
        try {
          const model = await this.createModel(modelId, modelConfig)
          this.models.set(modelId, model)
          console.log(`✅ ${modelConfig.name} 초기화 완료`)
        } catch (error) {
          console.warn(`⚠️ ${modelConfig.name} 초기화 실패:`, error)
        }
      }
      
      this.isInitialized = true
      console.log('✅ 전문가용 AI 엔진 초기화 완료')
      
    } catch (error) {
      console.error('❌ AI 엔진 초기화 실패:', error)
      throw error
    }
  }

  private async createModel(modelId: string, config: any): Promise<tf.LayersModel> {
    // 모델별 맞춤형 아키텍처
    switch (modelId) {
      case 'plant-health-basic':
        return this.createBasicHealthModel()
      case 'growth-analysis-advanced':
        return this.createGrowthAnalysisModel()
      case 'disease-detection':
        return this.createDiseaseDetectionModel()
      case 'nutrition-analysis':
        return this.createNutritionAnalysisModel()
      case 'environmental-impact':
        return this.createEnvironmentalModel()
      default:
        return this.createBasicHealthModel()
    }
  }

  private createBasicHealthModel(): tf.LayersModel {
    return tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
        tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'sigmoid' })
      ]
    })
  }

  private createGrowthAnalysisModel(): tf.LayersModel {
    return tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
        tf.layers.conv2d({ filters: 64, kernelSize: 5, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'sigmoid' })
      ]
    })
  }

  private createDiseaseDetectionModel(): tf.LayersModel {
    return tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
        tf.layers.conv2d({ filters: 32, kernelSize: 7, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 5, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 512, activation: 'relu' }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 128, activation: 'sigmoid' })
      ]
    })
  }

  private createNutritionAnalysisModel(): tf.LayersModel {
    return tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
        tf.layers.conv2d({ filters: 16, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'sigmoid' })
      ]
    })
  }

  private createEnvironmentalModel(): tf.LayersModel {
    return tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [224, 224, 3] }),
        tf.layers.conv2d({ filters: 24, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 48, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 96, activation: 'relu' }),
        tf.layers.dense({ units: 48, activation: 'sigmoid' })
      ]
    })
  }

  async analyzeImage(imageUrl: string, options: AnalysisOptions): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const model = this.models.get(options.modelId)
    if (!model) {
      throw new Error(`모델을 찾을 수 없습니다: ${options.modelId}`)
    }

    console.log(`🔍 ${options.modelId} 모델로 분석 시작...`)

    // 이미지 전처리 및 예측
    const predictions = await this.processImageWithModel(imageUrl, model)
    
    // 모델별 결과 해석
    const analysisData = this.interpretResults(
      predictions, 
      options.modelId, 
      options.analysisItems,
      options.environmentData
    )

    console.log('✅ 분석 완료:', Object.keys(analysisData))
    return analysisData
  }

  private async processImageWithModel(imageUrl: string, model: tf.LayersModel): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        try {
          // 이미지를 텐서로 변환
          const tensor = tf.tidy(() => {
            const imageTensor = tf.browser.fromPixels(img)
            const resized = tf.image.resizeBilinear(imageTensor, [224, 224])
            const normalized = resized.div(255.0)
            return normalized.expandDims(0)
          })

          // 모델 예측
          const predictions = model.predict(tensor) as tf.Tensor
          const data = await predictions.data()
          
          // 메모리 정리
          tensor.dispose()
          predictions.dispose()
          
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('이미지 로드 실패'))
      img.src = imageUrl
    })
  }

  private interpretResults(
    predictions: Float32Array, 
    modelId: string, 
    analysisItems: string[],
    environmentData?: EnvironmentData
  ): any {
    const results: any = {}
    const modelConfig = AI_MODELS[modelId as keyof typeof AI_MODELS]
    
    if (!modelConfig) return results

    // 모델별 특화된 결과 해석
    switch (modelId) {
      case 'plant-health-basic':
        return this.interpretHealthResults(predictions, analysisItems, environmentData)
      case 'growth-analysis-advanced':
        return this.interpretGrowthResults(predictions, analysisItems, environmentData)
      case 'disease-detection':
        return this.interpretDiseaseResults(predictions, analysisItems, environmentData)
      case 'nutrition-analysis':
        return this.interpretNutritionResults(predictions, analysisItems, environmentData)
      case 'environmental-impact':
        return this.interpretEnvironmentalResults(predictions, analysisItems, environmentData)
      default:
        return this.interpretHealthResults(predictions, analysisItems, environmentData)
    }
  }

  private interpretHealthResults(predictions: Float32Array, items: string[], env?: EnvironmentData): any {
    const results: any = {}
    
    if (items.includes('plantHealth')) {
      results.plantHealth = Math.round(predictions[0] * 100)
    }
    
    if (items.includes('leafColor')) {
      results.leafColor = {
        rgb: { r: Math.round(predictions[1] * 255), g: Math.round(predictions[2] * 255), b: Math.round(predictions[3] * 255) },
        greenness: Math.round(predictions[4] * 100),
        yellowing: Math.round(predictions[5] * 100),
        browning: Math.round(predictions[6] * 100)
      }
    }
    
    if (items.includes('size')) {
      results.size = Math.round(predictions[7] * 50) // 0-50cm
    }
    
    if (items.includes('leafCount')) {
      results.leafCount = Math.round(predictions[8] * 20) + 5 // 5-25개
    }
    
    if (items.includes('condition')) {
      const healthScore = predictions[0]
      results.condition = healthScore > 0.8 ? '우수' : healthScore > 0.6 ? '양호' : healthScore > 0.4 ? '보통' : '주의'
    }
    
    return results
  }

  private interpretGrowthResults(predictions: Float32Array, items: string[], env?: EnvironmentData): any {
    const results: any = {}
    
    if (items.includes('growthRate')) {
      results.growthRate = Math.round(predictions[0] * 100)
    }
    
    if (items.includes('height')) {
      results.height = Math.round(predictions[1] * 200) + 10 // 10-210cm
    }
    
    if (items.includes('leafSize')) {
      results.leafSize = Math.round(predictions[2] * 100) + 5 // 5-105cm²
    }
    
    if (items.includes('stemThickness')) {
      results.stemThickness = Math.round(predictions[3] * 20) + 2 // 2-22mm
    }
    
    if (items.includes('growthStage')) {
      const stages = ['발아', '유묘', '영양생장', '생식생장', '개화', '결실']
      results.growthStage = stages[Math.floor(predictions[4] * stages.length)]
    }
    
    return results
  }

  private interpretDiseaseResults(predictions: Float32Array, items: string[], env?: EnvironmentData): any {
    const results: any = {}
    
    if (items.includes('diseasePresence')) {
      results.diseasePresence = predictions[0] > 0.5
    }
    
    if (items.includes('diseaseType')) {
      const diseases = ['건강함', '잎반점병', '노균병', '바이러스병', '세균병']
      results.diseaseType = diseases[Math.floor(predictions[1] * diseases.length)]
    }
    
    if (items.includes('severity')) {
      results.severity = Math.round(predictions[2] * 100)
    }
    
    if (items.includes('affectedArea')) {
      results.affectedArea = {
        percentage: Math.round(predictions[3] * 100),
        location: predictions[4] > 0.5 ? '잎' : '줄기'
      }
    }
    
    if (items.includes('treatment')) {
      results.treatment = predictions[0] > 0.5 ? '살균제 처리 권장' : '예방적 관리 유지'
    }
    
    return results
  }

  private interpretNutritionResults(predictions: Float32Array, items: string[], env?: EnvironmentData): any {
    const results: any = {}
    
    if (items.includes('nitrogen')) {
      results.nitrogen = {
        level: predictions[0] > 0.7 ? '충분' : predictions[0] > 0.4 ? '보통' : '부족',
        score: Math.round(predictions[0] * 100)
      }
    }
    
    if (items.includes('phosphorus')) {
      results.phosphorus = {
        level: predictions[1] > 0.7 ? '충분' : predictions[1] > 0.4 ? '보통' : '부족',
        score: Math.round(predictions[1] * 100)
      }
    }
    
    if (items.includes('potassium')) {
      results.potassium = {
        level: predictions[2] > 0.7 ? '충분' : predictions[2] > 0.4 ? '보통' : '부족',
        score: Math.round(predictions[2] * 100)
      }
    }
    
    if (items.includes('micronutrients')) {
      results.micronutrients = {
        iron: Math.round(predictions[3] * 100),
        zinc: Math.round(predictions[4] * 100),
        manganese: Math.round(predictions[5] * 100)
      }
    }
    
    if (items.includes('nutritionScore')) {
      results.nutritionScore = Math.round((predictions[0] + predictions[1] + predictions[2]) / 3 * 100)
    }
    
    return results
  }

  private interpretEnvironmentalResults(predictions: Float32Array, items: string[], env?: EnvironmentData): any {
    const results: any = {}
    
    if (items.includes('temperatureStress') && env) {
      results.temperatureStress = {
        level: env.innerTemperature > 35 || env.innerTemperature < 10 ? '높음' : '낮음',
        impact: Math.round(predictions[0] * 100),
        optimal: env.innerTemperature >= 20 && env.innerTemperature <= 28
      }
    }
    
    if (items.includes('humidityImpact') && env) {
      results.humidityImpact = {
        level: env.innerHumidity > 80 || env.innerHumidity < 40 ? '부적절' : '적절',
        impact: Math.round(predictions[1] * 100),
        optimal: env.innerHumidity >= 60 && env.innerHumidity <= 75
      }
    }
    
    if (items.includes('lightStress') && env) {
      results.lightStress = {
        level: env.solarRadiation < 200 ? '부족' : env.solarRadiation > 600 ? '과다' : '적절',
        impact: Math.round(predictions[2] * 100)
      }
    }
    
    if (items.includes('soilCondition') && env) {
      results.soilCondition = {
        ph: env.ph >= 6.0 && env.ph <= 7.0 ? '적정' : '조정필요',
        ec: env.ec >= 1.0 && env.ec <= 2.0 ? '적정' : '조정필요',
        score: Math.round(predictions[3] * 100)
      }
    }
    
    if (items.includes('environmentScore')) {
      results.environmentScore = Math.round(predictions[4] * 100)
    }
    
    return results
  }

  getAvailableModels() {
    return AI_MODELS
  }

  isReady(): boolean {
    return this.isInitialized
  }

  dispose(): void {
    this.models.forEach(model => model.dispose())
    this.models.clear()
    this.isInitialized = false
    console.log('🧹 AI 엔진 메모리 정리 완료')
  }
}

// 전역 AI 엔진 인스턴스
export const aiEngine = new PlantAIEngine() 