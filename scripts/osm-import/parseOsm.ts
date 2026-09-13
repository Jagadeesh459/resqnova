import fs from 'fs';
import path from 'path';

export interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OsmWay {
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

export interface OsmData {
  nodes: Map<number, OsmNode>;
  ways: OsmWay[];
}

// Bounding box for Vijayawada Urban Area (Prakasam Barrage, Krishna Lanka, Benz Circle, Governorpet, Bhavanipuram, Ramavarappadu, Kanaka Durga Flyover, NH16/NH65 corridor)
// South: 16.465, West: 80.585, North: 16.555, East: 80.690
const BBOX = {
  south: 16.465,
  west: 80.585,
  north: 16.555,
  east: 80.690,
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export async function fetchVijayawadaOsmData(): Promise<OsmData> {
  const query = `
    [out:json][timeout:60];
    (
      way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link"]
        (${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
    );
    out body;
    >;
    out skel qt;
  `.trim();

  let responseText = '';
  let lastError: any = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[OSM Import] Requesting Vijayawada road network from ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ResQNova-DisasterRouting/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (res.ok) {
        responseText = await res.text();
        console.log(`[OSM Import] Successfully received OSM data (${(responseText.length / 1024).toFixed(1)} KB)`);
        break;
      } else {
        console.warn(`[OSM Import] Endpoint ${endpoint} returned status ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[OSM Import] Error fetching from ${endpoint}:`, err);
    }
  }

  if (!responseText) {
    throw new Error(`Failed to fetch OSM data from all Overpass endpoints: ${lastError?.message || 'Unknown error'}`);
  }

  const rawJson = JSON.parse(responseText);
  const nodesMap = new Map<number, OsmNode>();
  const waysList: OsmWay[] = [];

  for (const elem of rawJson.elements) {
    if (elem.type === 'node') {
      nodesMap.set(elem.id, {
        id: elem.id,
        lat: elem.lat,
        lon: elem.lon,
        tags: elem.tags,
      });
    } else if (elem.type === 'way' && elem.nodes && elem.nodes.length >= 2) {
      // Exclude pedestrian/footway/steps/cycleway if tagged
      const highway = elem.tags?.highway || '';
      if (!['footway', 'pedestrian', 'steps', 'path', 'cycleway', 'track', 'bridleway'].includes(highway)) {
        waysList.push({
          id: elem.id,
          nodes: elem.nodes,
          tags: elem.tags,
        });
      }
    }
  }

  console.log(`[OSM Import] Parsed ${nodesMap.size} raw OSM nodes and ${waysList.length} drivable ways.`);
  return {
    nodes: nodesMap,
    ways: waysList,
  };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('parseOsm.ts')) {
  fetchVijayawadaOsmData()
    .then((data) => {
      console.log(`Extracted ${data.nodes.size} nodes and ${data.ways.length} ways.`);
    })
    .catch((err) => {
      console.error('Failed to parse OSM:', err);
      process.exit(1);
    });
}

