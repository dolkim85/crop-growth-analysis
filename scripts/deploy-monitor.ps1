# 🚀 dolkim85 스마트팜 실시간 배포 모니터 V1.0

param(
    [string]$Stage = "all"
)

function Show-ProgressBar {
    param(
        [int]$Percentage,
        [string]$Activity,
        [string]$Status
    )
    
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $Percentage
}

function Test-Service {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Show-DeploymentStatus {
    $startTime = Get-Date
    
    Write-Host "🚀 dolkim85 스마트팜 배포 모니터링 시작" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "⏰ 시작 시간: $startTime" -ForegroundColor Yellow
    Write-Host ""
    
    # 배포 단계별 체크
    $stages = @(
        @{ Name = "Git 설정"; Command = "git config user.name"; Expected = "dolkim85"; Progress = 10 },
        @{ Name = "로컬 커밋"; Command = "git log -1 --oneline"; Expected = ""; Progress = 20 },
        @{ Name = "GitHub 연결"; Command = "git remote -v"; Expected = "dolkim85"; Progress = 30 },
        @{ Name = "Vercel 설정"; Command = "vercel --version"; Expected = ""; Progress = 50 },
        @{ Name = "빌드 확인"; Command = "npm run build"; Expected = ""; Progress = 70 },
        @{ Name = "배포 진행"; Command = ""; Expected = ""; Progress = 90 },
        @{ Name = "서비스 확인"; Command = ""; Expected = ""; Progress = 100 }
    )
    
    foreach ($stage in $stages) {
        Write-Host "🔍 $($stage.Name) 확인 중..." -ForegroundColor Blue
        Show-ProgressBar -Percentage $stage.Progress -Activity "배포 진행 중" -Status $stage.Name
        
        if ($stage.Command) {
            try {
                $result = Invoke-Expression $stage.Command 2>$null
                if ($result -match $stage.Expected -or $stage.Expected -eq "") {
                    Write-Host "✅ $($stage.Name) 완료" -ForegroundColor Green
                } else {
                    Write-Host "❌ $($stage.Name) 실패" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "⚠️ $($stage.Name) 확인 불가" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 1
        Write-Host ""
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    $endTime = Get-Date
    $duration = $endTime - $startTime
    Write-Host "⏱️ 소요 시간: $($duration.TotalSeconds.ToString('F1'))초" -ForegroundColor Magenta
}

function Monitor-RealTime {
    Write-Host "📊 실시간 배포 모니터링 시작..." -ForegroundColor Green
    
    $urls = @(
        "https://smartfarm-dolkim85.vercel.app",
        "https://crop-growth-analysis-dolkim85.vercel.app"
    )
    
    $counter = 0
    while ($true) {
        Clear-Host
        $counter++
        
        Write-Host "🔄 실시간 모니터링 #$counter - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        foreach ($url in $urls) {
            $status = if (Test-Service -Url $url) { "🟢 ONLINE" } else { "🔴 OFFLINE" }
            Write-Host "📱 $url : $status"
        }
        
        Write-Host ""
        Write-Host "⏹️ 모니터링 중지: Ctrl+C" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

# 메인 실행
switch ($Stage.ToLower()) {
    "status" { Show-DeploymentStatus }
    "monitor" { Monitor-RealTime }
    "all" { 
        Show-DeploymentStatus
        Start-Sleep -Seconds 2
        Monitor-RealTime
    }
    default { Show-DeploymentStatus }
} 