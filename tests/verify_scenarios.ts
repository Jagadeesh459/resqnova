import {
  runAStarRouting,
  runDStarReplanning,
  assignRescueTeamPriorityQueue,
  assignAmbulanceGreenCorridor,
  buildVijayawadaRoadGraph,
} from '../backend/routingEngine';
import { db } from '../database/db';
import { CitizenRequest, RescueTeam, Ambulance, Hospital } from '../frontend/src/types';

async function runVerificationScenarios() {
  console.log('================================================================');
  console.log('================================================================');
  console.log('');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // =========================================================================
  // SCENARIO 1: Initial Route Generation
  // =========================================================================
  console.log('Scenario 1: Initial Route Generation (A* + Real OSRM Road Geometry)');
  try {
    const originLat = 16.518;
    const originLng = 80.608;
    const destLat = 16.5038;
    const destLng = 80.6432;

    const route1 = await runAStarRouting({
      start_lat: originLat,
      start_lng: originLng,
      end_lat: destLat,
      end_lng: destLng,
      mode: 'rescue_dispatch',
    });

    assert(route1.success === true, 'A* Routing returned success');
    assert(route1.coordinates.length > 2, `Route contains high-resolution geometry (${route1.coordinates.length} waypoints, not a 2-point line)`);
    assert(route1.distance_km > 0 && route1.distance_km < 25, `Distance calculated realistically: ${route1.distance_km} km`);
    assert(route1.duration_min > 0 && route1.duration_min < 60, `ETA duration calculated realistically: ${route1.duration_min} minutes`);
    assert(route1.algorithm === 'A*', 'Algorithm identified as A*');
  } catch (err) {
    console.error('Scenario 1 failed with exception:', err);
    failed++;
  }

  console.log('');

  // =========================================================================
  // SCENARIO 2: Dynamic Obstacle Detection & D* Lite Replanning
  // =========================================================================
  console.log('Scenario 2: Dynamic Obstacle Detection & D* Lite Incremental Replanning');
  try {
    const currentLat = 16.518;
    const currentLng = 80.608;
    const goalLat = 16.5038;
    const goalLng = 80.6432;

    // Block rd-1 (Prakasam Barrage Arterial)
    const replanResult = await runDStarReplanning({
      mission_id: 'mission-test-01',
      current_lat: currentLat,
      current_lng: currentLng,
      goal_lat: goalLat,
      goal_lng: goalLng,
      blocked_road_ids: ['rd-1', 'edge_1'],
    });

    assert(replanResult.success === true, 'D* Lite replanning succeeded');
    assert(replanResult.replanned === true, 'Replanned flag is true');
    assert(replanResult.recompute_latency_ms < 50, `Sub-50ms replanning latency: ${replanResult.recompute_latency_ms} ms`);
    assert(replanResult.coordinates.length > 2, `Detour path has valid road geometry (${replanResult.coordinates.length} points)`);
    assert(replanResult.detour_reason.length > 0, `Detour explanation provided: "${replanResult.detour_reason}"`);
  } catch (err) {
    console.error('Scenario 2 failed with exception:', err);
    failed++;
  }

  console.log('');

  // =========================================================================
  // SCENARIO 3: Complete Blockage / Impassable Network
  // =========================================================================
  console.log('Scenario 3: Complete Blockage / Impassable Network Handling');
  try {
    // Attempt route to an isolated/disconnected node with all edges blocked
    const allRoadIds = db.getState().roads.map((r) => r.id);
    const isolatedRoute = await runDStarReplanning({
      mission_id: 'mission-blocked-all',
      current_lat: 16.5015,
      current_lng: 80.638,
      goal_lat: 16.570,
      goal_lng: 80.720,
      blocked_road_ids: allRoadIds,
    });

    // When graph is impassable, NO fake straight lines must be drawn
    assert(isolatedRoute.coordinates.length === 0, 'No fake straight lines generated: coordinates array is EMPTY');
    assert(
      isolatedRoute.success === false || isolatedRoute.detour_reason.includes('unavailable') || isolatedRoute.detour_reason.includes('blocked'),
      'Alerts that route is unavailable or impassable'
    );
  } catch (err) {
    console.error('Scenario 3 failed with exception:', err);
    failed++;
  }

  console.log('');

  // =========================================================================
  // SCENARIO 4: Rescue Team Shortest-ETA Priority Queue Dispatch
  // =========================================================================
  console.log('Scenario 4: Rescue Team Shortest-ETA Priority Queue Dispatch');
  try {
    const testRequest: CitizenRequest = {
      id: 'req-test-p1',
      request_id: 'REQ-TEST-P1',
      citizen_name: 'Flood Victim Group',
      citizen_phone: '+91 99999 00001',
      latitude: 16.502,
      longitude: 80.639,
      address_hint: 'Krishna Lanka Riverfront',
      people_count: 5,
      children_count: 2,
      elderly_count: 1,
      emergency_type: 'Flood Trapped',
      medical_urgency: 'critical',
      risk_level: 'Critical',
      risk_score: 95,
      priority_score: 95,
      ai_confidence: 98,
      ai_stage: 'received',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const candidateTeams: RescueTeam[] = [
      {
        id: 'team-far',
        team_name: 'NDRF Far Unit',
        leader: 'Capt. Rao',
        latitude: 16.535,
        longitude: 80.665,
        status: 'available',
        personnel: 8,
        equipment: 'Inflatable Boat',
        deployment_zone: 'North Distant Base',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'team-near',
        team_name: 'NDRF Fast Response Alpha',
        leader: 'Insp. Naidu',
        latitude: 16.505,
        longitude: 80.641,
        status: 'available',
        personnel: 6,
        equipment: '40HP Zodiac Rapid Boat',
        deployment_zone: 'Krishna Jetty Staging',
        updated_at: new Date().toISOString(),
      },
    ];

    const dispatch = await assignRescueTeamPriorityQueue(testRequest, candidateTeams);

    assert(dispatch !== null, 'Priority queue dispatch succeeded');
    assert(dispatch?.assignedTeam.id === 'team-near', `Assigned closest squad with shortest ETA (selected: ${dispatch?.assignedTeam.team_name})`);
    assert(dispatch!.etaMinutes < 15, `Realistic emergency arrival ETA: ${dispatch!.etaMinutes} mins`);
    assert(dispatch!.route.coordinates.length > 2, `Real road/waterway route computed (${dispatch!.route.coordinates.length} waypoints)`);
  } catch (err) {
    console.error('Scenario 4 failed with exception:', err);
    failed++;
  }

  console.log('');

  // =========================================================================
  // SCENARIO 5: 108 Emergency Ambulance Green Corridor
  // =========================================================================
  console.log('Scenario 5: 108 Emergency Ambulance Green Corridor to ICU Center');
  try {
    const patientLat = 16.5038;
    const patientLng = 80.6432;

    const candidateAmbulances: Ambulance[] = [
      {
        id: 'amb-101',
        vehicle_code: 'AP-108-ALS-101',
        driver_name: 'M. Krishna',
        phone: '+91 99999 00010',
        latitude: 16.501,
        longitude: 80.638,
        status: 'available',
        crew_size: 3,
        fuel: 85,
        deployment_zone: 'Varadhi South High Ground',
        updated_at: new Date().toISOString(),
      },
    ];

    const candidateHospitals: Hospital[] = [
      {
        id: 'hosp-full',
        hospital_name: 'Community Hospital (Full ICU)',
        district: 'NTR District',
        latitude: 16.509,
        longitude: 80.645,
        total_beds: 100,
        available_beds: 10,
        emergency_capacity: 5,
        icu_beds: 0, // NO ICU BEDS!
        ambulances_available: 2,
        contact_number: '0866-2400001',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'hosp-ggh',
        hospital_name: 'Government General Hospital (GGH Apex Trauma)',
        district: 'NTR District',
        latitude: 16.516,
        longitude: 80.627,
        total_beds: 450,
        available_beds: 85,
        emergency_capacity: 40,
        icu_beds: 18, // OPEN ICU BEDS!
        ambulances_available: 8,
        contact_number: '0866-2570000',
        updated_at: new Date().toISOString(),
      },
    ];

    const greenCorridor = await assignAmbulanceGreenCorridor(
      patientLat,
      patientLng,
      candidateAmbulances,
      candidateHospitals
    );

    assert(greenCorridor !== null, 'Green corridor calculation succeeded');
    assert(greenCorridor?.selectedHospital.icu_beds > 0, `Selected hospital has verified available ICU beds (${greenCorridor?.selectedHospital.icu_beds} beds free at ${greenCorridor?.selectedHospital.hospital_name})`);
    assert(greenCorridor?.selectedHospital.id === 'hosp-ggh', 'Correctly filtered out hospital with 0 ICU beds in favor of GGH Trauma Center');
    assert(greenCorridor!.patientPickupRoute.coordinates.length > 2, `Pickup route follows real road geometry (${greenCorridor!.patientPickupRoute.coordinates.length} waypoints)`);
    assert(greenCorridor!.hospitalCorridorRoute.coordinates.length > 2, `Hospital green corridor follows real road geometry (${greenCorridor!.hospitalCorridorRoute.coordinates.length} waypoints)`);
  } catch (err) {
    console.error('Scenario 5 failed with exception:', err);
    failed++;
  }

  console.log('');
  console.log('================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All 5 core real-time routing scenarios verified successfully! Ready for production.');
    process.exit(0);
  }
}

runVerificationScenarios();
