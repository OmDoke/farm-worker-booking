import { NextResponse } from 'next/server';

const SERVICES = [
  { id: 'srv_1', name: 'Pruning', category: 'Grape Farming' },
  { id: 'srv_2', name: 'Tying', category: 'Grape Farming' },
  { id: 'srv_3', name: 'Harvesting', category: 'Grape Farming' },
  { id: 'srv_4', name: 'Thinning', category: 'Grape Farming' },
  { id: 'srv_5', name: 'Spraying', category: 'Grape Farming' },
  { id: 'srv_6', name: 'Weeding', category: 'Grape Farming' },
];

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: SERVICES });
  } catch (error: unknown) {
    console.error('Get Services Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch services' } },
      { status: 500 }
    );
  }
}
