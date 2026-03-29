import { NextRequest, NextResponse } from 'next/server';

interface ActivityLog {
  id: string;
  timestamp: string;
  relayId: string;
  relayName: string;
  action: 'ON' | 'OFF' | 'TOGGLE';
  triggeredBy: 'manual' | 'schedule' | 'api' | 'system';
  scheduleName?: string;
  details?: string;
}

// In-memory storage (replace with database in production)
let activityLogs: ActivityLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    relayId: 'relay-001',
    relayName: 'Main Pump',
    action: 'ON',
    triggeredBy: 'schedule',
    scheduleName: 'Morning Pump Cycle',
    details: 'Scheduled activation',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    relayId: 'relay-002',
    relayName: 'Inlet Valve',
    action: 'ON',
    triggeredBy: 'manual',
    details: 'Dashboard control',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    relayId: 'relay-008',
    relayName: 'UV Sterilizer',
    action: 'OFF',
    triggeredBy: 'schedule',
    scheduleName: 'UV Sterilizer Cycle',
    details: 'Duration completed - auto off',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    relayId: 'relay-005',
    relayName: 'Exhaust Fan',
    action: 'ON',
    triggeredBy: 'api',
    details: 'External API request',
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    relayId: 'relay-001',
    relayName: 'Main Pump',
    action: 'OFF',
    triggeredBy: 'schedule',
    scheduleName: 'Evening Pump Cycle',
    details: 'Scheduled deactivation',
  },
  {
    id: 'log-006',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    relayId: 'relay-003',
    relayName: 'Outlet Valve',
    action: 'ON',
    triggeredBy: 'manual',
    details: 'Dashboard control',
  },
  {
    id: 'log-007',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    relayId: 'relay-007',
    relayName: 'Booster Pump',
    action: 'OFF',
    triggeredBy: 'system',
    details: 'System initialization',
  },
];

// GET - Fetch activity logs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relayId = searchParams.get('relayId');
  const triggeredBy = searchParams.get('triggeredBy');
  const action = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let filteredLogs = [...activityLogs];

  // Apply filters
  if (relayId) {
    filteredLogs = filteredLogs.filter(log => log.relayId === relayId);
  }

  if (triggeredBy) {
    filteredLogs = filteredLogs.filter(log => log.triggeredBy === triggeredBy);
  }

  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action === action);
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
  }

  // Sort by timestamp descending
  filteredLogs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply pagination
  const total = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedLogs,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
    timestamp: new Date().toISOString(),
  });
}

// POST - Create new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString(),
      relayId: body.relayId,
      relayName: body.relayName,
      action: body.action,
      triggeredBy: body.triggeredBy || 'api',
      scheduleName: body.scheduleName,
      details: body.details,
    };

    // Add to beginning of array
    activityLogs.unshift(newLog);

    // Keep only last 1000 logs in memory
    if (activityLogs.length > 1000) {
      activityLogs = activityLogs.slice(0, 1000);
    }

    return NextResponse.json({
      success: true,
      data: newLog,
      message: 'Log entry created',
    });
  } catch (error) {
    console.error('[Logs API] Create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create log entry' },
      { status: 400 }
    );
  }
}

// DELETE - Clear logs (with optional filters)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relayId = searchParams.get('relayId');
    const beforeDate = searchParams.get('beforeDate');
    const clearAll = searchParams.get('clearAll') === 'true';

    let deletedCount = 0;

    if (clearAll) {
      deletedCount = activityLogs.length;
      activityLogs = [];
    } else if (relayId) {
      const originalLength = activityLogs.length;
      activityLogs = activityLogs.filter(log => log.relayId !== relayId);
      deletedCount = originalLength - activityLogs.length;
    } else if (beforeDate) {
      const date = new Date(beforeDate);
      const originalLength = activityLogs.length;
      activityLogs = activityLogs.filter(log => new Date(log.timestamp) >= date);
      deletedCount = originalLength - activityLogs.length;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} log entries`,
      deletedCount,
    });
  } catch (error) {
    console.error('[Logs API] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete logs' },
      { status: 400 }
    );
  }
}
