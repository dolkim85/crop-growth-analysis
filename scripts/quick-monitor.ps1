# 🚀 dolkim85 스마트팜 실시간 배포 모니터 (간단 버전)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 dolkim85 스마트팜 V11.4 실시간 배포 모니터" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Host "⏰ 시작 시간: $startTime" -ForegroundColor Yellow
Write-Host ""

# 단계별 진행률 표시
$steps = @(
    "Git 설정 확인",
    "로컬 커밋 상태",
    "GitHub 연결 상태", 
    "Vercel 로그인",
    "프로젝트 빌드",
    "배포 진행",
    "서비스 온라인"
)

for ($i = 0; $i -lt $steps.Length; $i++) {
    $progress = [math]::Round(($i + 1) / $steps.Length * 100)
    
    Write-Host "🔍 단계 $($i+1)/$($steps.Length): $($steps[$i])" -ForegroundColor Blue
    
    # 진행률 바 표시
    $bar = "█" * [math]::Floor($progress / 5) + "░" * (20 - [math]::Floor($progress / 5))
    Write-Host "[$bar] $progress%" -ForegroundColor Green
    
    # 실제 상태 체크
    switch ($i) {
        0 { 
            $gitUser = git config user.name 2>$null
            if ($gitUser -eq "dolkim85") {
                Write-Host "✅ Git 사용자: $gitUser" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Git 사용자 확인 필요" -ForegroundColor Yellow
            }
        }
        1 {
            $lastCommit = git log -1 --oneline 2>$null
            if ($lastCommit) {
                Write-Host "✅ 최근 커밋: $($lastCommit.Substring(0, [math]::Min(50, $lastCommit.Length)))" -ForegroundColor Green
            } else {
                Write-Host "❌ 커밋 없음" -ForegroundColor Red
            }
        }
        2 {
            $remote = git remote -v 2>$null
            if ($remote -like "*dolkim85*") {
                Write-Host "✅ GitHub 연결됨: dolkim85" -ForegroundColor Green
            } else {
                Write-Host "⏳ GitHub 연결 대기 중..." -ForegroundColor Yellow
            }
        }
        3 {
            Write-Host "⏳ Vercel 로그인 진행 중 (브라우저 확인)" -ForegroundColor Yellow
        }
        4 {
            Write-Host "⏳ 빌드 대기 중..." -ForegroundColor Yellow
        }
        5 {
            Write-Host "⏳ 배포 대기 중..." -ForegroundColor Yellow
        }
        6 {
            Write-Host "⏳ 서비스 확인 대기 중..." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "⏱️ 소요 시간: $($duration.TotalSeconds.ToString('F1'))초" -ForegroundColor Magenta
Write-Host ""
Write-Host "🎯 다음 단계: Vercel 브라우저 로그인 완료 후 계속 진행됩니다." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan 