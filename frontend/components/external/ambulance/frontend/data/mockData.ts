export interface AmbulanceData {
  vehicleCode: string;
  vehicleType: string;
  assignedZone: string;
  stationBase: string;
  district: string;
  status: 'READY' | 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY';
  statusLabel: string;
  statusDetail: string;
  gpsSync: string;
  cadLink: string;
  gpsLock: string;
  activeCrew: string;
  crewMembers: string[];
  priorityChannel: string;
  shiftElapsed: string;
  v2xProtocol: string;
  requiredEquipment: string[];
  currentAssignment: {
    title: string;
    badge: string;
    stagingOrigin: {
      name: string;
      subtext: string;
      sector: string;
    };
    destination: {
      name: string;
      fullHospitalName: string;
      status: string;
      category: string;
    };
    routeDistance: string;
    routeVia: string;
    etaMinutes: string;
    etaStatus: string;
    dispatchedPosture: string;
    postureDetail: string;
    nextManeuver: {
      distance: string;
      instruction: string;
      highlight: string;
      signalPreemption: string;
      corridorStatus: string;
    };
    telemetry: {
      heading: string;
      rtkStatus: string;
      currentSpeed: number;
    };
  };
  historyLogs: {
    id: string;
    time: string;
    type: string;
    description: string;
    location: string;
    status: 'completed' | 'in-progress' | 'dispatched';
  }[];
  completedTasks: {
    id: string;
    taskNumber: string;
    callType: string;
    priority: 'CRITICAL' | 'URGENT' | 'HIGH' | 'ROUTINE';
    dispatchedTime: string;
    completedTime: string;
    duration: string;
    origin: string;
    originDetail: string;
    destination: string;
    destinationFacility: string;
    distance: string;
    preemptionScore: string;
    junctionsCleared: number;
    receivingDoctor: string;
    handoverId: string;
    crewSignoff: string;
    outcomeSummary: string;
    status: 'COMPLETED';
  }[];
}

export const mockAmbulanceData: AmbulanceData = {
  vehicleCode: 'AP-07-AM-101',
  vehicleType: 'M-ICU ALPHA',
  assignedZone: 'Sector 4 Transit Node',
  stationBase: 'Vijayawada Metro Command',
  district: 'Vijayawada (NTR District)',
  status: 'AVAILABLE',
  statusLabel: 'UNIT READY',
  statusDetail: 'Vehicle online and cleared for priority emergency dispatch.',
  gpsSync: '99.8% TELEMETRY',
  cadLink: 'ONLINE',
  gpsLock: '0.4M ACC',
  activeCrew: 'PARAMEDIC 2 + DRIVER',
  crewMembers: ['Lead Paramedic: K. Suresh (ALS Certified)', 'EMT-Tactical: M. Bhavani', 'Specialist Pilot: R. Venkatesh'],
  priorityChannel: 'GGH TRAUMA LINKED',
  shiftElapsed: '03H : 42M',
  v2xProtocol: 'CAD auto-routing protocol active • V2X priority armed',
  requiredEquipment: [
    'Biphasic Defibrillator / Monitor',
    'Transport ICU Mechanical Ventilator',
    'Syringe Infusion Pumps (Dual Channel)',
    'Trauma Rapid Splint & Immobilization Kit',
    'Portable Suction Unit & Oxygen Cascades',
    'V2X Emergency Signal Preemption Transponder'
  ],
  currentAssignment: {
    title: 'CURRENT ASSIGNMENT',
    badge: 'ACTIVE DISPATCH • STANDBY',
    stagingOrigin: {
      name: 'Benz Circle',
      subtext: 'Sector 4 Transit Node',
      sector: 'SECTOR 04 • STANDBY UNIT',
    },
    destination: {
      name: 'Govt General...',
      fullHospitalName: 'Govt General Hospital',
      status: 'Trauma Bay 01 Ready',
      category: 'TRAUMA CTR LEVEL 1',
    },
    routeDistance: '2.8 KM',
    routeVia: 'Via MG Road Corridor',
    etaMinutes: '08',
    etaStatus: 'Green Corridor Sync',
    dispatchedPosture: 'STAGED',
    postureDetail: 'Immediate Rollout',
    nextManeuver: {
      distance: 'IN 400 METERS',
      instruction: 'Turn right onto MG Road → ',
      highlight: 'Direct GGH Ramp',
      signalPreemption: 'ARMED',
      corridorStatus: 'GREEN-LOCKED',
    },
    telemetry: {
      heading: 'HDG 042° NE',
      rtkStatus: 'RTK FIXED • 12 SATS',
      currentSpeed: 64,
    },
  },
  historyLogs: [
    {
      id: 'INC-2026-089',
      time: '01:45',
      type: 'Trauma Code 1',
      description: 'Pedestrian RTC transfer to GGH Trauma ICU',
      location: 'Bandar Road Junction, Vijayawada',
      status: 'completed',
    },
    {
      id: 'INC-2026-088',
      time: '00:15',
      type: 'Cardiac Alert',
      description: 'Acute STEMI inter-facility ICU transfer',
      location: 'Suryaraopet Health Node',
      status: 'completed',
    },
    {
      id: 'INC-2026-087',
      time: '22:30',
      type: 'Staging Relocation',
      description: 'High-density coverage zone patrol',
      location: 'MG Road Corridor / Benz Circle',
      status: 'completed',
    },
  ],
  completedTasks: [
    {
      id: 'TASK-101-089',
      taskNumber: 'INC-2026-089',
      callType: 'Severe RTC Trauma Transfer',
      priority: 'CRITICAL',
      dispatchedTime: '01:32 IST',
      completedTime: '01:45 IST',
      duration: '13 MIN (07m transit)',
      origin: 'Bandar Road Junction',
      originDetail: 'Pedestrian vs 2W collision • Near Raghavaiah Park',
      destination: 'Govt General Hospital',
      destinationFacility: 'GGH Trauma Bay 02 • Level 1 Resuscitation',
      distance: '3.4 KM',
      preemptionScore: '100% GREEN-LOCKED',
      junctionsCleared: 4,
      receivingDoctor: 'Dr. R. Murthy (ER Chief)',
      handoverId: 'GGH-TR-4421',
      crewSignoff: 'Paramedic K. Suresh (ALS)',
      outcomeSummary: 'Multi-system blunt trauma stabilized on scene. Cervical spine immobilized, dual IV access secured, vitals transmitted ahead. Successfully handed over to GGH Trauma resuscitation team.',
      status: 'COMPLETED',
    },
    {
      id: 'TASK-101-088',
      taskNumber: 'INC-2026-088',
      callType: 'Acute STEMI Cardiac Rollout',
      priority: 'CRITICAL',
      dispatchedTime: '00:03 IST',
      completedTime: '00:15 IST',
      duration: '12 MIN (06m transit)',
      origin: 'Suryaraopet Health Center',
      originDetail: 'Inter-facility urgent cath lab referral',
      destination: 'Ramesh Cardiac Hospital',
      destinationFacility: 'Cath Lab 01 • Pre-notified Angioplasty Team',
      distance: '2.9 KM',
      preemptionScore: '98% PREEMPTION ACTIVE',
      junctionsCleared: 3,
      receivingDoctor: 'Dr. P. Srinivas (Interventional Cardiology)',
      handoverId: 'RAMESH-CARD-1109',
      crewSignoff: 'Paramedic K. Suresh (ALS)',
      outcomeSummary: '12-lead ECG telemetry continuously streamed to Cath Lab en route. Dual antiplatelet protocol administered under CAD direction. Door-to-Cath transit completed in under 12 minutes.',
      status: 'COMPLETED',
    },
    {
      id: 'TASK-101-087',
      taskNumber: 'INC-2026-087',
      callType: 'Pediatric Respiratory Distress',
      priority: 'URGENT',
      dispatchedTime: '22:12 IST',
      completedTime: '22:30 IST',
      duration: '18 MIN (08m transit)',
      origin: 'Governorpet Residential Node',
      originDetail: 'Acute bronchospasm • Saturation 88% on room air',
      destination: 'Rainbow Children\'s Hospital',
      destinationFacility: 'Pediatric Emergency Care Unit',
      distance: '3.8 KM',
      preemptionScore: '100% GREEN-LOCKED',
      junctionsCleared: 5,
      receivingDoctor: 'Dr. Ananya V. (Pediatric Intensivist)',
      handoverId: 'RCH-PED-8804',
      crewSignoff: 'EMT-Tactical M. Bhavani',
      outcomeSummary: 'Nebulization initiated immediately in transit with high-flow supplemental oxygen. SpO2 improved to 97%. Smooth handover to PICU intake team.',
      status: 'COMPLETED',
    },
    {
      id: 'TASK-101-086',
      taskNumber: 'INC-2026-086',
      callType: 'Green Corridor Organ Transit Escort',
      priority: 'HIGH',
      dispatchedTime: '20:10 IST',
      completedTime: '20:34 IST',
      duration: '24 MIN (19m transit)',
      origin: 'Gannavaram Airport (Arrival Bay)',
      originDetail: 'Charter donor harvest box retrieval',
      destination: 'Govt General Hospital',
      destinationFacility: 'Advanced Transplant OT Complex',
      distance: '18.6 KM',
      preemptionScore: '100% POLICE & V2X LOCK',
      junctionsCleared: 14,
      receivingDoctor: 'Transplant Surgery Team Alpha',
      handoverId: 'GGH-TX-0922',
      crewSignoff: 'Specialist Pilot R. Venkatesh',
      outcomeSummary: 'Zero-delay high-speed highway transit via Eluru Road green corridor under Vijayawada Police & ResQNova V2X signal synchronization. Delivered with cold ischemic time preserved.',
      status: 'COMPLETED',
    },
  ],
};
