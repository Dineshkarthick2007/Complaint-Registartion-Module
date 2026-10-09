import { createComplaint, deleteComplaint } from './db.js';
import { auth } from './auth.js';
import { toast } from './toast.js';
import { icons, getCategoryIcon } from './icons.js';

class StudentController {
  constructor() {
    this.complaints = [];
    this.previousComplaintsMap = new Map();
    this.currentFilter = 'all'; // 'all' | 'In progress' | 'Addressed' | 'Rectified'
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedPriority = 'all';
    this.selectedComplaintForModal = null;
    this.hasInitialized = false;
  }

  setComplaints(complaints) {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    // Filter complaints raised by this student (or match by studentId/room)
    const studentComplaints = complaints.filter(c => 
      c.studentId === currentUser.id || 
      (c.roomNumber === currentUser.roomNumber && c.block === currentUser.block) ||
      !c.studentId
    );

    // Real-time status update notification
    if (this.hasInitialized) {
      studentComplaints.forEach(c => {
        const prev = this.previousComplaintsMap.get(c.id);
        if (prev && prev.status !== c.status) {
          toast.success(
            `Ticket Updated: ${c.ticketNumber || 'Ticket'}`,
            `Status changed to "${c.status}". ${c.wardenNotes ? `Note: ${c.wardenNotes}` : ''}`,
            6000
          );
        }
      });
    }

    this.previousComplaintsMap.clear();
    studentComplaints.forEach(c => this.previousComplaintsMap.set(c.id, { ...c }));
    this.complaints = studentComplaints;
    this.hasInitialized = true;

    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.render();
  }

  setCategoryFilter(category) {
    this.selectedCategory = category;
    this.render();
  }

  setPriorityFilter(priority) {
    this.selectedPriority = priority;
    this.render();
  }

  getFilteredComplaints() {
    return this.complaints.filter(c => {
      if (this.currentFilter !== 'all') {
        if ((c.status || '').toLowerCase() !== this.currentFilter.toLowerCase()) {
          return false;
        }
      }
      if (this.selectedCategory !== 'all') {
        if (c.category !== this.selectedCategory) return false;
      }
      if (this.selectedPriority !== 'all') {
        if (c.priority !== this.selectedPriority) return false;
      }
      if (this.searchQuery) {
        const titleMatch = (c.title || '').toLowerCase().includes(this.searchQuery);
        const descMatch = (c.description || '').toLowerCase().includes(this.searchQuery);
        const ticketMatch = (c.ticketNumber || '').toLowerCase().includes(this.searchQuery);
        const catMatch = (c.category || '').toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !descMatch && !ticketMatch && !catMatch) {
          return false;
        }
      }
      return true;
    });
  }

  render() {
    const container = document.getElementById('studentDashboardContent');
    if (!container) return;

    const user = auth.getCurrentUser();
    const filtered = this.getFilteredComplaints();

    const totalCount = this.complaints.length;
    const inProgressCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'in progress').length;
    const addressedCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'addressed').length;
    const rectifiedCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'rectified').length;

    container.innerHTML = `
      <!-- Welcome Hero Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1>Student Complaint Portal</h1>
          <div class="welcome-meta">
            <span class="welcome-meta-pill">${icons.user} ${escapeHtml(user?.name || 'Student')}</span>
            <span class="welcome-meta-pill">${icons.building} ${escapeHtml(user?.block || 'Block A')}</span>
            <span class="welcome-meta-pill">Room ${escapeHtml(user?.roomNumber || '201')}</span>
            <span class="welcome-meta-pill">ID: ${escapeHtml(user?.id || 'Student ID')}</span>
          </div>
        </div>
        <button id="btnOpenRaiseModal" class="btn btn-primary btn-lg">
          ${icons.plus}
          <span>Raise Complaint Ticket</span>
        </button>
      </div>

      <!-- Stats KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card ${this.currentFilter === 'all' ? 'active-filter' : ''}" data-status="all">
          <div class="stat-info">
            <span class="stat-label">Total Raised</span>
            <span class="stat-value">${totalCount}</span>
            <span class="stat-subtext">Submitted tickets</span>
          </div>
          <div class="stat-icon-wrapper">${icons.fileText}</div>
        </div>

        <div class="stat-card ${this.currentFilter === 'In progress' ? 'active-filter' : ''}" data-status="In progress">
          <div class="stat-info">
            <span class="stat-label">In Progress</span>
            <span class="stat-value">${inProgressCount}</span>
            <span class="stat-subtext">Active maintenance</span>
          </div>
          <div class="stat-icon-wrapper">${icons.clock}</div>
        </div>

        <div class="stat-card ${this.currentFilter === 'Addressed' ? 'active-filter' : ''}" data-status="Addressed">
          <div class="stat-info">
            <span class="stat-label">Addressed</span>
            <span class="stat-value">${addressedCount}</span>
            <span class="stat-subtext">Warden scheduled</span>
          </div>
          <div class="stat-icon-wrapper">${icons.eye}</div>
        </div>

        <div class="stat-card ${this.currentFilter === 'Rectified' ? 'active-filter' : ''}" data-status="Rectified">
          <div class="stat-info">
            <span class="stat-label">Rectified</span>
            <span class="stat-value">${rectifiedCount}</span>
            <span class="stat-subtext">Resolved & verified</span>
          </div>
          <div class="stat-icon-wrapper">${icons.checkCircle}</div>
        </div>
      </div>

      <!-- Toolbar & Filters -->
      <div class="toolbar-card">
        <div class="toolbar-main-row">
          <div class="search-box-wrapper">
            <div class="input-with-icon">
              <span class="input-icon">${icons.search}</span>
              <input type="text" id="studentSearchInput" class="form-control" placeholder="Search by title, ID, category..." value="${escapeHtml(this.searchQuery)}">
            </div>
          </div>
          <div class="filter-pills-group">
            <button class="filter-pill ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (${totalCount})</button>
            <button class="filter-pill ${this.currentFilter === 'In progress' ? 'active' : ''}" data-filter="In progress">In Progress (${inProgressCount})</button>
            <button class="filter-pill ${this.currentFilter === 'Addressed' ? 'active' : ''}" data-filter="Addressed">Addressed (${addressedCount})</button>
            <button class="filter-pill ${this.currentFilter === 'Rectified' ? 'active' : ''}" data-filter="Rectified">Rectified (${rectifiedCount})</button>
          </div>
        </div>

        <div class="filter-dropdowns-row">
          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Filter By:</label>
          <select id="studentCategoryFilter" class="filter-select">
            <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories</option>
            <option value="Electrical" ${this.selectedCategory === 'Electrical' ? 'selected' : ''}>Electrical</option>
            <option value="Plumbing" ${this.selectedCategory === 'Plumbing' ? 'selected' : ''}>Plumbing</option>
            <option value="Carpentry" ${this.selectedCategory === 'Carpentry' ? 'selected' : ''}>Carpentry</option>
            <option value="Wi-Fi & Internet" ${this.selectedCategory === 'Wi-Fi & Internet' ? 'selected' : ''}>Wi-Fi & Internet</option>
            <option value="Housekeeping" ${this.selectedCategory === 'Housekeeping' ? 'selected' : ''}>Housekeeping</option>
            <option value="Mess & Food" ${this.selectedCategory === 'Mess & Food' ? 'selected' : ''}>Mess & Food</option>
            <option value="Noise & Discipline" ${this.selectedCategory === 'Noise & Discipline' ? 'selected' : ''}>Noise & Discipline</option>
            <option value="Other" ${this.selectedCategory === 'Other' ? 'selected' : ''}>Other</option>
          </select>

          <select id="studentPriorityFilter" class="filter-select">
            <option value="all" ${this.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
            <option value="urgent" ${this.selectedPriority === 'urgent' ? 'selected' : ''}>Urgent</option>
            <option value="high" ${this.selectedPriority === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${this.selectedPriority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${this.selectedPriority === 'low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
      </div>

      <!-- Complaints Grid -->
      <div class="complaints-grid">
        ${filtered.length === 0 ? this.renderEmptyState() : filtered.map(c => this.renderComplaintCard(c)).join('')}
      </div>
    `;

    this.attachEventListeners();
  }

  renderComplaintCard(c) {
    const statusClassMap = {
      'addressed': 'status-addressed',
      'in progress': 'status-inprogress',
      'rectified': 'status-rectified'
    };
    const statusClass = statusClassMap[(c.status || '').toLowerCase()] || 'status-inprogress';
    const formattedDate = formatDateTime(c.createdAt);

    return `
      <div class="complaint-card" data-id="${c.id}">
        <div class="complaint-header">
          <div class="complaint-tags-row">
            <span class="ticket-num-badge">${escapeHtml(c.ticketNumber || 'HST-TKT')}</span>
            <span class="category-badge">${getCategoryIcon(c.category)} <span>${escapeHtml(c.category || 'General')}</span></span>
            <span class="priority-badge priority-${c.priority || 'medium'}">${escapeHtml(c.priority || 'Medium')}</span>
          </div>
          <span class="status-badge ${statusClass}">
            ${escapeHtml(c.status || 'In progress')}
          </span>
        </div>

        <div class="complaint-title-row">
          <h3 class="complaint-card-title">${escapeHtml(c.title || 'Untitled Complaint')}</h3>
          <div class="complaint-tags-row">
            <span class="location-tag">${icons.building} ${escapeHtml(c.block || 'Block A')} • Room ${escapeHtml(c.roomNumber || '')}</span>
            <span class="location-tag">${icons.clock} ${escapeHtml(c.preferredTime || 'Any Time')}</span>
          </div>
        </div>

        <p class="complaint-card-desc">${escapeHtml(c.description || 'No detailed description.')}</p>

        ${c.imageUrl ? `
          <img src="${escapeHtml(c.imageUrl)}" alt="Issue proof" class="complaint-thumb-preview" loading="lazy" />
        ` : ''}

        ${c.wardenNotes ? `
          <div class="warden-remarks-callout">
            <div class="warden-remarks-header">
              ${icons.shield}
              <span>Warden Remark:</span>
              ${c.assignedTo ? `<span style="font-weight: 500; color: var(--text-muted);">(${escapeHtml(c.assignedTo)})</span>` : ''}
            </div>
            <p class="warden-remarks-text">"${escapeHtml(c.wardenNotes)}"</p>
          </div>
        ` : ''}

        <div class="complaint-card-footer">
          <span style="display: flex; align-items: center; gap: 0.3rem;">${icons.calendar} ${formattedDate}</span>
          <div class="complaint-actions">
            <button class="btn btn-secondary btn-sm btn-view-details" data-id="${c.id}">
              ${icons.eye}
              <span>Details</span>
            </button>
            ${(c.status || '').toLowerCase() !== 'rectified' ? `
              <button class="btn btn-danger btn-sm btn-delete-complaint" data-id="${c.id}" title="Withdraw Ticket">
                ${icons.trash}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.checkCircle}</div>
        <h3>No Complaints Found</h3>
        <p>You have no active complaints matching this filter.</p>
        <button id="btnEmptyRaiseModal" class="btn btn-primary btn-sm">
          ${icons.plus}
          <span>Raise New Complaint</span>
        </button>
      </div>
    `;
  }

  attachEventListeners() {
    const btnOpen = document.getElementById('btnOpenRaiseModal');
    const btnEmpty = document.getElementById('btnEmptyRaiseModal');
    if (btnOpen) btnOpen.addEventListener('click', () => this.openRaiseModal());
    if (btnEmpty) btnEmpty.addEventListener('click', () => this.openRaiseModal());

    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.currentTarget.dataset.filter);
      });
    });

    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const status = e.currentTarget.dataset.status;
        if (status) this.setFilter(status);
      });
    });

    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearch(e.target.value);
      });
    }

    const catSelect = document.getElementById('studentCategoryFilter');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.setCategoryFilter(e.target.value);
      });
    }

    const prioSelect = document.getElementById('studentPriorityFilter');
    if (prioSelect) {
      prioSelect.addEventListener('change', (e) => {
        this.setPriorityFilter(e.target.value);
      });
    }

    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const complaint = this.complaints.find(c => c.id === id);
        if (complaint) {
          this.openDetailsModal(complaint);
        }
      });
    });

    document.querySelectorAll('.btn-delete-complaint').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Are you sure you want to withdraw this complaint ticket?')) {
          try {
            await deleteComplaint(id);
            toast.info('Ticket Withdrawn', 'Complaint removed successfully.');
          } catch (err) {
            toast.danger('Error', 'Failed to withdraw complaint.');
          }
        }
      });
    });
  }

  openRaiseModal() {
    const modal = document.getElementById('raiseComplaintModal');
    if (!modal) return;

    const user = auth.getCurrentUser();
    const blockSelect = document.getElementById('newComplaintBlock');
    const roomInput = document.getElementById('newComplaintRoom');
    if (blockSelect && user?.block) blockSelect.value = user.block;
    if (roomInput && user?.roomNumber) roomInput.value = user.roomNumber;

    document.getElementById('newComplaintTitle').value = '';
    document.getElementById('newComplaintDesc').value = '';
    document.getElementById('newComplaintPhoto').value = '';
    const imgPreview = document.getElementById('imagePreviewContainer');
    if (imgPreview) imgPreview.innerHTML = '';

    modal.classList.add('active');
  }

  openDetailsModal(complaint) {
    this.selectedComplaintForModal = complaint;
    const modal = document.getElementById('detailsTimelineModal');
    if (!modal) return;

    const modalBody = document.getElementById('detailsTimelineBody');
    if (!modalBody) return;

    let timeline = [];
    try {
      timeline = typeof complaint.timeline === 'string' ? JSON.parse(complaint.timeline) : (complaint.timeline || []);
    } catch (e) {
      timeline = [];
    }

    const statusClassMap = {
      'addressed': 'status-addressed',
      'in progress': 'status-inprogress',
      'rectified': 'status-rectified'
    };
    const statusClass = statusClassMap[(complaint.status || '').toLowerCase()] || 'status-inprogress';

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
        <div>
          <span class="ticket-num-badge">${escapeHtml(complaint.ticketNumber || 'HST-TKT')}</span>
          <h2 style="font-size: 1.25rem; margin-top: 0.35rem;">${escapeHtml(complaint.title)}</h2>
        </div>
        <span class="status-badge ${statusClass}">
          ${escapeHtml(complaint.status || 'In progress')}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.65rem; background: var(--bg-surface-hover); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; border: 1px solid var(--border-subtle);">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Category</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.category || 'General')}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Location</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.block)} • Room ${escapeHtml(complaint.roomNumber)}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Priority</div>
          <div style="font-weight: 600; text-transform: uppercase;">${escapeHtml(complaint.priority)}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Timing</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.preferredTime || 'Any Time')}</div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--text-muted); text-transform: uppercase;">Issue Description</h4>
        <p style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.88rem; color: var(--text-main); white-space: pre-wrap;">${escapeHtml(complaint.description)}</p>
      </div>

      ${complaint.imageUrl ? `
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--text-muted); text-transform: uppercase;">Attached Photo</h4>
          <img src="${escapeHtml(complaint.imageUrl)}" style="max-height: 220px; width: auto; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);" alt="Complaint Photo" />
        </div>
      ` : ''}

      <div>
        <h4 style="font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--text-muted); text-transform: uppercase;">Resolution Stepper Timeline</h4>
        <div class="timeline-stepper">
          ${timeline.map((step, idx) => `
            <div class="timeline-step ${step.status === 'Rectified' ? 'rectified' : (idx === timeline.length - 1 ? 'active' : 'completed')}">
              <div class="timeline-step-bullet">${idx + 1}</div>
              <div class="timeline-step-title">${escapeHtml(step.title || step.status)}</div>
              <div class="timeline-step-time">${formatDateTime(step.timestamp)} • by ${escapeHtml(step.author || 'System')}</div>
              ${step.note ? `<div class="timeline-step-notes">${escapeHtml(step.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.add('active');
  }
}

export const studentController = new StudentController();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTime(timestamp) {
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
