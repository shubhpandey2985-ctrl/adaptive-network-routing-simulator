param(
    [string]$BaseUrl = "http://127.0.0.1:8080/api/v1"
)

$ErrorActionPreference = "Stop"
$script:Passed = 0

function Assert-Equal {
    param([string]$Name, $Actual, $Expected)
    if ($Actual -ne $Expected) {
        throw "$Name failed: expected '$Expected', got '$Actual'."
    }
    $script:Passed++
    Write-Host "PASS $Name"
}

function Assert-HttpStatus {
    param([string]$Name, [scriptblock]$Request, [int]$Expected)
    try {
        & $Request | Out-Null
    } catch {
        $response = $_.Exception.Response
        if ($null -ne $response) {
            $status = [int]$response.StatusCode
            if ($status -eq $Expected) {
                $script:Passed++
                Write-Host "PASS $Name (HTTP $status)"
                return
            }
            throw "$Name failed: expected HTTP $Expected, got HTTP $status."
        }
        throw
    }
    throw "$Name failed: expected HTTP $Expected but the request succeeded."
}

function Post-Json {
    param([string]$Path, [string]$Json)
    Invoke-RestMethod -Method Post -Uri "$BaseUrl$Path" `
        -ContentType "application/json" -Body $Json
}

function Assert-Metrics {
    param(
        [string]$Name, $Metrics,
        [int]$Total, [int]$Pending, [int]$Delivered, [int]$Lost, [double]$Rate
    )
    Assert-Equal "$Name totalPackets" $Metrics.totalPackets $Total
    Assert-Equal "$Name pendingPackets" $Metrics.pendingPackets $Pending
    Assert-Equal "$Name deliveredPackets" $Metrics.deliveredPackets $Delivered
    Assert-Equal "$Name lostPackets" $Metrics.lostPackets $Lost
    if ([math]::Abs([double]$Metrics.deliveryRate - $Rate) -gt 0.0001) {
        throw "$Name deliveryRate failed: expected $Rate, got $($Metrics.deliveryRate)."
    }
    $script:Passed++
    Write-Host "PASS $Name deliveryRate"
}

function Test-RouteEdges {
    param($Route, $Links)
    for ($index = 1; $index -lt $Route.route.Count; $index++) {
        $from = $Route.route[$index - 1]
        $to = $Route.route[$index]
        $link = $Links | Where-Object {
            $_.active -and ((($_.source -eq $from) -and ($_.destination -eq $to)) -or
                (($_.source -eq $to) -and ($_.destination -eq $from)))
        } | Select-Object -First 1
        if ($null -eq $link) { return $false }
    }
    return $true
}

$health = Invoke-RestMethod "$BaseUrl/health"
Assert-Equal "health" $health.success $true

$topology8 = Invoke-RestMethod "$BaseUrl/topologies/default"
Assert-Equal "default topology router count" $topology8.routerCount 8
Assert-Equal "default topology link count" $topology8.linkCount 12
$expectedCosts = @{
    "1-2" = 2; "1-3" = 5; "2-3" = 1; "2-4" = 3
    "3-5" = 2; "4-5" = 2; "4-6" = 4; "5-6" = 1
    "5-7" = 3; "6-8" = 2; "7-8" = 1; "3-7" = 5
}
foreach ($edge in $expectedCosts.Keys) {
    $parts = $edge.Split('-')
    $link = $topology8.links | Where-Object {
        ($_.source -eq [int]$parts[0] -and $_.destination -eq [int]$parts[1]) -or
        ($_.source -eq [int]$parts[1] -and $_.destination -eq [int]$parts[0])
    } | Select-Object -First 1
    if ($null -eq $link) { throw "Original topology link $edge is missing." }
    Assert-Equal "original link $edge cost" $link.cost $expectedCosts[$edge]
}
$topology10 = Invoke-RestMethod "$BaseUrl/topologies/default?routers=10"
Assert-Equal "10-router topology" $topology10.routerCount 10
Assert-HttpStatus "invalid router count" { Invoke-RestMethod "$BaseUrl/topologies/default?routers=3" } 400

$sessionA = Post-Json "/simulations" '{"routerCount":8}'
$idA = $sessionA.id
Assert-Metrics "new session metrics" $sessionA.metrics 0 0 0 0 0
$sessionRead = Invoke-RestMethod "$BaseUrl/simulations/$idA"
Assert-Equal "simulation retrieval" $sessionRead.id $idA

$routes = @{}
foreach ($algorithm in @("BFS", "DFS", "Dijkstra", "Adaptive")) {
    $route = Post-Json "/simulations/$idA/route" "{`"source`":1,`"destination`":8,`"algorithm`":`"$algorithm`"}"
    Assert-Equal "$algorithm route reachable" $route.reachable $true
    Assert-Equal "$algorithm route starts at source" $route.route[0] 1
    Assert-Equal "$algorithm route ends at destination" $route.route[-1] 8
    Assert-Equal "$algorithm route uses active links" (Test-RouteEdges $route $topology8.links) $true
    $routes[$algorithm] = $route
}
Assert-Equal "BFS minimum-hop route" $routes.BFS.hops 3
Assert-Equal "Dijkstra minimum route cost" $routes.Dijkstra.cost 8
Assert-Equal "Adaptive score selects lower-cost candidate" (($routes.Adaptive.route -join ",")) (($routes.Dijkstra.route -join ","))

$single = Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"priority":1,"count":1}'
Assert-Equal "single packet queued" $single.pendingPackets 1
Assert-Metrics "one created packet" $single.metrics 1 1 0 0 0
$multiple = Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"priority":10,"count":2}'
Assert-Equal "multiple packets queued" $multiple.pendingPackets 3
Assert-Metrics "three pending packets" $multiple.metrics 3 3 0 0 0
$pending = Invoke-RestMethod "$BaseUrl/simulations/$idA/packets/pending"
Assert-Equal "pending packet retrieval" $pending.pendingPackets.Count 3
$historyBefore = Invoke-RestMethod "$BaseUrl/simulations/$idA/packets"
Assert-Equal "complete packet history before processing" $historyBefore.count 3
Assert-Equal "pending history state" $historyBefore.packets[0].status "pending"

$processed = Post-Json "/simulations/$idA/packets/process" '{"algorithm":"Dijkstra"}'
Assert-Equal "processed packet count" $processed.packets.Count 3
Assert-Equal "processed packet route populated" $processed.packets[0].route.Count 6
Assert-Equal "packet priority is metadata (FIFO order)" (($processed.packets.id -join ",")) "1,2,3"
Assert-Metrics "after delivery" $processed.metrics 3 0 3 0 100
$historyAfter = Invoke-RestMethod "$BaseUrl/simulations/$idA/packets"
Assert-Equal "complete packet history after processing" $historyAfter.count 3
Assert-Equal "delivered packet history state" $historyAfter.packets[0].status "delivered"
$processedAgain = Post-Json "/simulations/$idA/packets/process" '{}'
Assert-Equal "packets are not processed twice" $processedAgain.packets.Count 0
Assert-Metrics "after empty reprocess" $processedAgain.metrics 3 0 3 0 100

$failedRouter = Post-Json "/simulations/$idA/routers/fail" '{"routerId":5}'
$reroute = Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Dijkstra"}'
if ($reroute.route -contains 5) { throw "Route used failed router R5." }
Assert-Equal "router failure reroutes" $reroute.reachable $true
$repairedRouter = Post-Json "/simulations/$idA/routers/repair" '{"routerId":5}'
$restoredRouterRoute = Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Dijkstra"}'
Assert-Equal "router repair restores shortest route" $restoredRouterRoute.cost 8
$failedLink = Post-Json "/simulations/$idA/links/fail" '{"source":1,"destination":2}'
$linkReroute = Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Dijkstra"}'
if (($linkReroute.route[0] -eq 1) -and ($linkReroute.route[1] -eq 2)) { throw "Route used failed link R1-R2." }
Assert-Equal "link failure reroutes" $linkReroute.reachable $true
$repairedLink = Post-Json "/simulations/$idA/links/repair" '{"source":1,"destination":2}'
$restoredLinkRoute = Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Dijkstra"}'
Assert-Equal "link repair restores shortest route" $restoredLinkRoute.cost 8

$comparison = Post-Json "/simulations/$idA/compare" '{"source":1,"destination":8}'
Assert-Equal "algorithm comparison count" $comparison.results.Count 4
Assert-Equal "algorithm comparison names" (($comparison.results.algorithm -join ",")) "BFS,DFS,Dijkstra,Adaptive"

# Isolate R8. A packet may be created for an inactive destination, but processing
# must mark it lost because the destination cannot participate in a route.
Post-Json "/simulations/$idA/links/fail" '{"source":6,"destination":8}' | Out-Null
Post-Json "/simulations/$idA/links/fail" '{"source":7,"destination":8}' | Out-Null
Assert-HttpStatus "unreachable route" { Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Dijkstra"}' } 400
$unreachableComparison = Post-Json "/simulations/$idA/compare" '{"source":1,"destination":8}'
Assert-Equal "unreachable comparison count" $unreachableComparison.results.Count 4
Assert-Equal "unreachable comparison result" $unreachableComparison.results[0].reachable $false
$unreachablePacket = Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"count":1}'
Assert-Metrics "unreachable packet pending" $unreachablePacket.metrics 4 1 3 0 100
$lost = Post-Json "/simulations/$idA/packets/process" '{"algorithm":"Dijkstra"}'
Assert-Equal "unreachable packet marked lost" $lost.packets[0].status "lost"
Assert-Metrics "after unreachable packet" $lost.metrics 4 0 3 1 75
Post-Json "/simulations/$idA/links/repair" '{"source":6,"destination":8}' | Out-Null
Post-Json "/simulations/$idA/links/repair" '{"source":7,"destination":8}' | Out-Null

# Existing behavior: a known but failed source may queue a packet; routing then
# rejects the inactive source and processing records that packet as lost.
Post-Json "/simulations/$idA/routers/fail" '{"routerId":1}' | Out-Null
Assert-HttpStatus "route from failed router" { Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"BFS"}' } 400
$fromFailedSource = Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"count":1}'
Assert-Metrics "packet created at failed source" $fromFailedSource.metrics 5 1 3 1 75
$failedSourceProcessed = Post-Json "/simulations/$idA/packets/process" '{}'
Assert-Equal "failed-source packet marked lost" $failedSourceProcessed.packets[0].status "lost"
Assert-Metrics "after failed-source packet" $failedSourceProcessed.metrics 5 0 3 2 60
Post-Json "/simulations/$idA/routers/repair" '{"routerId":1}' | Out-Null

$events = Invoke-RestMethod "$BaseUrl/simulations/$idA/events"
if ($events.events.Count -lt 8) { throw "Expected simulation and packet/failure events; found $($events.events.Count)." }
$metricsRead = Invoke-RestMethod "$BaseUrl/simulations/$idA/metrics"
Assert-Metrics "metrics endpoint" $metricsRead 5 0 3 2 60

# A second session has independent state and topology.
$sessionB = Post-Json "/simulations" '{"routerCount":10}'
$idB = $sessionB.id
if ($idA -eq $idB) { throw "Session IDs were not unique." }
Assert-Equal "second session topology" $sessionB.topology.routerCount 10
Assert-Metrics "second session starts empty" $sessionB.metrics 0 0 0 0 0
Post-Json "/simulations/$idB/packets" '{"source":1,"destination":10,"count":1}' | Out-Null
Assert-HttpStatus "invalid packet-processing algorithm" { Post-Json "/simulations/$idB/packets/process" '{"algorithm":"Invalid"}' } 400
$sessionBState = Invoke-RestMethod "$BaseUrl/simulations/$idB"
Assert-Metrics "second session packet state" $sessionBState.metrics 1 1 0 0 0
$sessionAState = Invoke-RestMethod "$BaseUrl/simulations/$idA"
Assert-Metrics "first session remains isolated" $sessionAState.metrics 5 0 3 2 60
Post-Json "/simulations/$idB/routers/fail" '{"routerId":2}' | Out-Null
$concurrentIds = 1..12 | ForEach-Object -Parallel {
    $uri = $using:BaseUrl + "/simulations/" + $using:idB + "/packets"
    $response = Invoke-RestMethod -Method Post -Uri $uri `
        -ContentType "application/json" -Body '{"source":1,"destination":10,"count":1}'
    $response.packets[0].id
} -ThrottleLimit 8
Assert-Equal "concurrent packet creation count" $concurrentIds.Count 12
Assert-Equal "concurrent packet IDs are unique" (($concurrentIds | Sort-Object -Unique).Count) 12
$sessionBState = Invoke-RestMethod "$BaseUrl/simulations/$idB"
Assert-Metrics "concurrent session state" $sessionBState.metrics 13 13 0 0 0
$concurrentProcessed = Post-Json "/simulations/$idB/packets/process" '{"algorithm":"Dijkstra"}'
Assert-Equal "concurrently created packets process once" $concurrentProcessed.packets.Count 13
Assert-Metrics "concurrent processing metrics" $concurrentProcessed.metrics 13 0 13 0 100
$sessionAState = Invoke-RestMethod "$BaseUrl/simulations/$idA"
Assert-Equal "router failure isolated to second session" $sessionAState.topology.routers[1].active $true

Assert-HttpStatus "unknown simulation ID" { Invoke-RestMethod "$BaseUrl/simulations/unknown-id" } 404
Assert-HttpStatus "unknown router ID" { Post-Json "/simulations/$idA/route" '{"source":99,"destination":8}' } 400
Assert-HttpStatus "invalid algorithm" { Post-Json "/simulations/$idA/route" '{"source":1,"destination":8,"algorithm":"Invalid"}' } 400
Assert-HttpStatus "invalid packet priority" { Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"priority":11}' } 400
Assert-HttpStatus "non-integer packet priority" { Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"priority":1.5}' } 400
Assert-HttpStatus "non-integer packet count" { Post-Json "/simulations/$idA/packets" '{"source":1,"destination":8,"count":true}' } 400
Assert-HttpStatus "malformed JSON" { Post-Json "/simulations/$idA/route" '{invalid' } 400
Assert-HttpStatus "non-object JSON body" { Post-Json "/simulations/$idA/route" '[]' } 400

$options = Invoke-WebRequest -Method Options -Uri "$BaseUrl/health" -Headers @{
    Origin = "http://localhost:5500"
    "Access-Control-Request-Method" = "GET"
}
Assert-Equal "CORS preflight status" ([int]$options.StatusCode) 204
if ($options.Headers["Access-Control-Allow-Origin"] -notcontains "*") {
    throw "CORS preflight omitted Access-Control-Allow-Origin."
}
$script:Passed++
Write-Host "PASS CORS preflight headers"

$reset = Post-Json "/simulations/$idA/reset" '{}'
Assert-Metrics "reset response metrics" $reset.metrics 0 0 0 0 0
$afterReset = Invoke-RestMethod "$BaseUrl/simulations/$idA"
Assert-Equal "reset clears packet history" $afterReset.packets.Count 0
Assert-Equal "reset clears event history" $afterReset.events.Count 0
Assert-Equal "reset restores router status" $afterReset.topology.routers[0].active $true
Assert-Equal "reset restores every link" @($afterReset.topology.links | Where-Object { -not $_.active }).Count 0
$resetPending = Invoke-RestMethod "$BaseUrl/simulations/$idA/packets/pending"
Assert-Equal "reset clears pending queue" $resetPending.pendingPackets.Count 0

Write-Host "All $script:Passed API assertions passed."
