import { init, tx, id } from '@instantdb/core';

// InstantDB Public Application ID provided by user
export const APP_ID = 'c69bafcf-19d7-4f5d-9696-9bcc7b910dd4';

// Initialize InstantDB Client
export const db = init({ appId: APP_ID });

export { tx, id };

const LOCAL_STORAGE_CACHE = 'hostel_complaints_cache';

function getLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read local complaints cache', e);
  }
  return [];
}

function saveLocalCache(complaints) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE, JSON.stringify(complaints));
  } catch (e) {
    console.warn('Failed to write local complaints cache', e);
  }
}

/**
 * Generate a friendly ticket number like HST-2401
 */
export function generateTicketNumber() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `HST-${randomNum}`;
}

/**
 * Subscribe in real-time to all complaints
 * @param {Function} onData - Callback with array of complaints
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComplaints(onData, onError) {
  // 1. Immediately emit local cache for instant UI rendering
  const cached = getLocalCache();
  if (cached && cached.length > 0) {
    onData(cached);
  }

  // 2. Subscribe to InstantDB real-time query
  return db.subscribeQuery({ complaints: {} }, (resp) => {
    if (resp.error) {
      console.error('[InstantDB Error]', resp.error);
      if (onError) onError(resp.error);
      return;
    }
    const complaints = resp.data?.complaints || [];
    // Sort complaints by createdAt descending (newest first)
    complaints.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Update local cache
    saveLocalCache(complaints);
    onData(complaints);
  });
}

/**
 * Create a new complaint ticket in InstantDB
 */
export async function createComplaint(complaintData) {
  const newId = id();
  const ticketNumber = generateTicketNumber();
  const now = Date.now();

  const initialTimeline = [
    {
      status: 'Submitted',
      title: 'Ticket Submitted',
      note: 'Complaint successfully raised by student.',
      timestamp: now,
      author: complaintData.studentName || 'Student'
    }
  ];

  const payload = {
    id: newId,
    ticketNumber,
    title: complaintData.title.trim(),
    description: complaintData.description.trim(),
    category: complaintData.category || 'Other',
    block: complaintData.block || 'Block A',
    roomNumber: complaintData.roomNumber || '',
    studentId: complaintData.studentId || '',
    studentName: complaintData.studentName || 'Student',
    studentPhone: complaintData.studentPhone || '',
    priority: complaintData.priority || 'medium', // 'low' | 'medium' | 'high' | 'urgent'
    preferredTime: complaintData.preferredTime || 'Any Time',
    imageUrl: complaintData.imageUrl || '',
    status: 'In progress', // Initial state: 'In progress' | 'Addressed' | 'Rectified'
    wardenNotes: '',
    assignedTo: '',
    createdAt: now,
    updatedAt: now,
    timeline: JSON.stringify(initialTimeline)
  };

  // Optimistically update local cache
  const cached = getLocalCache();
  saveLocalCache([payload, ...cached.filter(c => c.id !== newId)]);

  // Transact with InstantDB
  try {
    await db.transact([tx.complaints[newId].update(payload)]);
  } catch (e) {
    console.error('InstantDB transaction error:', e);
  }

  return { id: newId, ticketNumber, ...payload };
}

/**
 * Update complaint ticket status and remarks by Warden
 */
export async function updateComplaintStatus(complaintId, existingComplaint, { newStatus, wardenNotes, assignedTo }) {
  const now = Date.now();
  
  // Parse timeline
  let timeline = [];
  try {
    timeline = typeof existingComplaint.timeline === 'string' 
      ? JSON.parse(existingComplaint.timeline) 
      : (existingComplaint.timeline || []);
  } catch (e) {
    timeline = [];
  }

  // Add status change entry into timeline
  const statusLabels = {
    'Addressed': 'Ticket Addressed & Acknowledged',
    'In progress': 'Work In Progress',
    'Rectified': 'Complaint Rectified & Resolved'
  };

  timeline.push({
    status: newStatus,
    title: statusLabels[newStatus] || `Status changed to ${newStatus}`,
    note: wardenNotes || (assignedTo ? `Assigned to: ${assignedTo}` : 'Status updated by Warden.'),
    assignedTo: assignedTo || '',
    timestamp: now,
    author: 'Hostel Warden'
  });

  const payload = {
    status: newStatus,
    wardenNotes: wardenNotes !== undefined ? wardenNotes : (existingComplaint.wardenNotes || ''),
    assignedTo: assignedTo !== undefined ? assignedTo : (existingComplaint.assignedTo || ''),
    updatedAt: now,
    timeline: JSON.stringify(timeline)
  };

  // Optimistically update local cache
  const cached = getLocalCache();
  const updated = cached.map(c => c.id === complaintId ? { ...c, ...payload } : c);
  saveLocalCache(updated);

  // Transact with InstantDB
  try {
    await db.transact([tx.complaints[complaintId].update(payload)]);
  } catch (e) {
    console.error('InstantDB update error:', e);
  }

  return { id: complaintId, ...payload };
}

/**
 * Delete a complaint ticket
 */
export async function deleteComplaint(complaintId) {
  // Optimistically update local cache
  const cached = getLocalCache();
  saveLocalCache(cached.filter(c => c.id !== complaintId));

  try {
    await db.transact([tx.complaints[complaintId].delete()]);
  } catch (e) {
    console.error('InstantDB delete error:', e);
  }
}
