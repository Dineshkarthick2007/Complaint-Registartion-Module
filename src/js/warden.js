import { updateComplaintStatus, deleteComplaint } from './db.js';
import { auth } from './auth.js';
import { toast } from './toast.js';
import { seedRealisticComplaints } from './demoSeed.js';
import { icons, getCategoryIcon } from './icons.js';

class WardenController {
  constructor() {
    this.complaints = [];
    this.currentFilter = 'all'; // 'all' | 'Addressed' | 'In progress' | 'Rectified'
    this.selectedBlock = 'all';
    this.selectedCategory = 'all';
    this.selectedPriority = 'all';
    this.searchQuery = '';
    this.viewMode = 'grid'; // 'grid' | 'table'
    this.activeComplaintToEdit = null;
  }

  setComplaints(complaints) {
    this.complaints = complaints || [];
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  setBlockFilter(block) {
    this.selectedBlock = block;
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

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.render();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  getFilteredComplaints() {
    return this.complaints.filter(c => {
      if (this.currentFilter !== 'all') {
        if ((c.status || '').toLowerCase() !== this.currentFilter.toLowerCase()) {
          return false;
        }
      }
      if (this.selectedBlock !== 'all') {
        if (c.block !== this.selectedBlock) return false;
      }
      if (this.selectedCategory !== 'all') {
        if (c.category !== this.selectedCategory) return false;
      }
      if (this.selectedPriority !== 'all') {
        if (c.priority !== this.selectedPriority) return false;
      }
      if (this.searchQuery) {
        const studentName = (c.studentName || '').toLowerCase();
        const studentId = (c.studentId || '').toLowerCase();
        const room = (c.roomNumber || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const ticket = (c.ticketNumber || '').toLowerCase();
        const category = (c.category || '').toLowerCase();

        if (!studentName.includes(this.searchQuery) &&
            !studentId.includes(this.searchQuery) &&
            !room.includes(this.searchQuery) &&
            !title.includes(this.searchQuery) &&
            !ticket.includes(this.searchQuery) &&
            !category.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    });
  }

  render() {
    const container = document.getElementById('wardenDashboardContent');
    if (!container) return;

    const user = auth.getCurrentUser();
    const filtered = this.getFilteredComplaints();

    const totalCount = this.complaints.length;
    const inProgressCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'in progress').length;
    const addressedCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'addressed').length;
    const rectifiedCount = this.complaints.filter(c => (c.status || '').toLowerCase() === 'rectified').length;
    const urgentCount = this.complaints.filter(c => c.priority === 'urgent' && (c.status || '').toLowerCase() !== 'rectified').length;

    container.innerHTML = `
      <!-- Warden Header Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1>Warden Administration & Oversight</h1>
          <div class="welcome-meta">
            <span class="welcome-meta-pill">${icons.shield} ${escapeHtml(user?.name || 'Chief Warden')}</span>
            <span class="welcome-meta-pill">${escapeHtml(user?.designation || 'Hostel Authority')}</span>
            <span class="welcome-meta-pill">${icons.layers} Live Real-time Sync</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btnSeedDemoComplaints" class="btn btn-secondary btn-sm" title="Seed realistic test complaints">
            ${icons.seed}
            <span>Seed Sample Data</span>
          </button>
          <button id="btnExportCSV" class="btn btn-primary btn-sm">
            ${icons.download}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Urgent Alert Banner -->
      ${urgentCount > 0 ? `
        <div class="urgent-banner">
          <div class="urgent-content">
            <div class="urgent-icon">${icons.alertTriangle}</div>
            <div>
              <h3 style="font-size: 0.95rem; color: var(--priority-urgent); margin-bottom: 0.15rem;">
                Attention: ${urgentCount} Urgent Maintenance Ticket${urgentCount > 1 ? 's' : ''} Pending
              </h3>
              <p style="font-size: 0.8rem; color: var(--text-main);">
                High-priority emergency repairs require immediate technician allocation.
              </p>
            </div>
          </div>
          <button id="btnFilterUrgent" class="btn btn-danger btn-sm">
            ${icons.alertTriangle}
            <span>View Urgent</span>
          </button>
        </div>
      ` : ''}

      <!-- KPI Metrics Cards -->
      <div class="stats-grid">
        <div class="stat-card ${this.currentFilter === 'all' ? 'active-filter' : ''}" data-status="all">
          <div class="stat-info">
            <span class="stat-label">Total Complaints</span>
            <span class="stat-value">${totalCount}</span>
            <span class="stat-subtext">All hostel blocks</span>
          </div>
          <div class="stat-icon-wrapper">${icons.fileText}</div>
        </div>

        <div class="stat-card ${this.currentFilter === 'In progress' ? 'active-filter' : ''}" data-status="In progress">
          <div class="stat-info">
            <span class="stat-label">In Progress</span>
            <span class="stat-value">${inProgressCount}</span>
            <span class="stat-subtext">Technician engaged</span>
          </div>
          <div class="stat-icon-wrapper">${icons.clock}</div>
        </div>

        <div class="stat-card ${this.currentFilter === 'Addressed' ? 'active-filter' : ''}" data-status="Addressed">
          <div class="stat-info">
            <span class="stat-label">Addressed</span>
            <span class="stat-value">${addressedCount}</span>
            <span class="stat-subtext">Acknowledged & scheduled</span>
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

      <!-- Filter Controls & Toolbar -->
      <div class="toolbar-card">
        <div class="toolbar-main-row">
          <div class="search-box-wrapper">
            <div class="input-with-icon">
              <span class="input-icon">${icons.search}</span>
              <input type="text" id="wardenSearchInput" class="form-control" placeholder="Search student name, roll number, room, ticket ID..." value="${escapeHtml(this.searchQuery)}">
            </div>
          </div>
          <div class="filter-pills-group">
            <button class="filter-pill ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (${totalCount})</button>
            <button class="filter-pill ${this.currentFilter === 'In progress' ? 'active' : ''}" data-filter="In progress">In Progress (${inProgressCount})</button>
            <button class="filter-pill ${this.currentFilter === 'Addressed' ? 'active' : ''}" data-filter="Addressed">Addressed (${addressedCount})</button>
            <button class="filter-pill ${this.currentFilter === 'Rectified' ? 'active' : ''}" data-filter="Rectified">Rectified (${rectifiedCount})</button>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="icon-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="btnViewGrid" title="Grid View">${icons.grid}</button>
            <button class="icon-btn ${this.viewMode === 'table' ? 'active' : ''}" id="btnViewTable" title="Table View">${icons.table}</button>
          </div>
        </div>

        <div class="filter-dropdowns-row">
          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Block:</label>
          <select id="wardenBlockFilter" class="filter-select">
            <option value="all" ${this.selectedBlock === 'all' ? 'selected' : ''}>All Hostel Blocks</option>
            <option value="Block A" ${this.selectedBlock === 'Block A' ? 'selected' : ''}>Block A (Nilgiri)</option>
            <option value="Block B" ${this.selectedBlock === 'Block B' ? 'selected' : ''}>Block B (Aravali)</option>
            <option value="Block C" ${this.selectedBlock === 'Block C' ? 'selected' : ''}>Block C (Vindhya)</option>
            <option value="Block D" ${this.selectedBlock === 'Block D' ? 'selected' : ''}>Block D (Shivalik)</option>
            <option value="Girls Hostel" ${this.selectedBlock === 'Girls Hostel' ? 'selected' : ''}>Girls Hostel</option>
            <option value="Boys Hostel" ${this.selectedBlock === 'Boys Hostel' ? 'selected' : ''}>Boys Hostel</option>
          </select>

          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Category:</label>
          <select id="wardenCategoryFilter" class="filter-select">
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

          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Priority:</label>
          <select id="wardenPriorityFilter" class="filter-select">
            <option value="all" ${this.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
            <option value="urgent" ${this.selectedPriority === 'urgent' ? 'selected' : ''}>Urgent</option>
            <option value="high" ${this.selectedPriority === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${this.selectedPriority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${this.selectedPriority === 'low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
      </div>

      <!-- Content Display -->
      ${filtered.length === 0 ? this.renderEmptyState() : (this.viewMode === 'grid' ? this.renderGrid(filtered) : this.renderTable(filtered))}
    `;

    this.attachEventListeners();
  }

  renderGrid(filtered) {
    return `
      <div class="complaints-grid">
        ${filtered.map(c => this.renderWardenCard(c)).join('')}
      </div>
    `;
  }

  renderWardenCard(c) {
    const statusClassMap = {
      'addressed': 'status-addressed',
      'in progress': 'status-inprogress',
      'rectified': 'status-rectified'
    };
    const statusClass = statusClassMap[(c.status || '').toLowerCase()] || 'status-inprogress';

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
            <span class="location-tag" style="font-weight: 600; color: var(--text-main);">
              ${icons.user} ${escapeHtml(c.studentName || 'Student')} (${escapeHtml(c.studentId || 'ID')})
            </span>
            <span class="location-tag">${icons.building} ${escapeHtml(c.block || 'Block A')} • Room ${escapeHtml(c.roomNumber || '')}</span>
          </div>
        </div>

        <p class="complaint-card-desc">${escapeHtml(c.description || 'No detailed description.')}</p>

        ${c.imageUrl ? `
          <img src="${escapeHtml(c.imageUrl)}" alt="Issue proof" class="complaint-thumb-preview" loading="lazy" />
        ` : ''}

        ${c.wardenNotes || c.assignedTo ? `
          <div class="warden-remarks-callout">
            <div class="warden-remarks-header">
              ${icons.shield}
              <span>Warden Action & Staff:</span>
              ${c.assignedTo ? `<span style="font-weight:600;">[Assigned: ${escapeHtml(c.assignedTo)}]</span>` : ''}
            </div>
            ${c.wardenNotes ? `<p class="warden-remarks-text">"${escapeHtml(c.wardenNotes)}"</p>` : ''}
          </div>
        ` : ''}

        <div class="complaint-card-footer">
          <span style="display: flex; align-items: center; gap: 0.3rem;">${icons.calendar} ${formatDateTime(c.createdAt)}</span>
          <div class="complaint-actions">
            <button class="btn btn-primary btn-sm btn-update-status" data-id="${c.id}">
              ${icons.edit}
              <span>Update</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-view-details" data-id="${c.id}">
              ${icons.eye}
            </button>
            <button class="btn btn-danger btn-sm btn-delete-complaint" data-id="${c.id}" title="Delete Ticket">
              ${icons.trash}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderTable(filtered) {
    const statusClassMap = {
      'addressed': 'status-addressed',
      'in progress': 'status-inprogress',
      'rectified': 'status-rectified'
    };

    return `
      <div class="warden-table-card">
        <div class="table-responsive">
          <table class="complaints-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Student & Room</th>
                <th>Complaint Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(c => {
                const statusClass = statusClassMap[(c.status || '').toLowerCase()] || 'status-inprogress';
                return `
                  <tr>
                    <td><span class="ticket-num-badge">${escapeHtml(c.ticketNumber || 'HST-TKT')}</span></td>
                    <td>
                      <div style="font-weight: 600;">${escapeHtml(c.studentName || 'Student')}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(c.block)} • Room ${escapeHtml(c.roomNumber)}</div>
                    </td>
                    <td>
                      <div style="font-weight: 500; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.title)}</div>
                      ${c.assignedTo ? `<div style="font-size:0.7rem; color:var(--text-muted);">Assigned: ${escapeHtml(c.assignedTo)}</div>` : ''}
                    </td>
                    <td><span class="category-badge">${getCategoryIcon(c.category)} <span>${escapeHtml(c.category || 'General')}</span></span></td>
                    <td><span class="priority-badge priority-${c.priority || 'medium'}">${escapeHtml(c.priority || 'Medium')}</span></td>
                    <td>
                      <span class="status-badge ${statusClass}">
                        ${escapeHtml(c.status || 'In progress')}
                      </span>
                    </td>
                    <td style="font-size: 0.75rem; color: var(--text-muted);">${formatDateTime(c.createdAt)}</td>
                    <td>
                      <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-primary btn-sm btn-update-status" data-id="${c.id}" title="Update Status">
                          ${icons.edit}
                          <span>Update</span>
                        </button>
                        <button class="btn btn-secondary btn-sm btn-view-details" data-id="${c.id}" title="View Details">
                          ${icons.eye}
                        </button>
                        <button class="btn btn-danger btn-sm btn-delete-complaint" data-id="${c.id}" title="Delete">
                          ${icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.fileText}</div>
        <h3>No Complaints Match Filter</h3>
        <p>There are no tickets matching the selected status or block criteria.</p>
        <button id="btnSeedDemoEmpty" class="btn btn-primary btn-sm">
          ${icons.seed}
          <span>Seed Sample Complaints</span>
        </button>
      </div>
    `;
  }

  attachEventListeners() {
    const btnSeed = document.getElementById('btnSeedDemoComplaints');
    const btnSeedEmpty = document.getElementById('btnSeedDemoEmpty');
    const handleSeed = async () => {
      try {
        toast.info('Seeding Complaints', 'Adding realistic test records to InstantDB...');
        await seedRealisticComplaints();
        toast.success('Seeding Complete', 'Complaints are now live in the system.');
      } catch (e) {
        toast.danger('Error', 'Failed to seed sample complaints.');
      }
    };
    if (btnSeed) btnSeed.addEventListener('click', handleSeed);
    if (btnSeedEmpty) btnSeedEmpty.addEventListener('click', handleSeed);

    const btnExport = document.getElementById('btnExportCSV');
    if (btnExport) btnExport.addEventListener('click', () => this.exportCSV());

    const btnUrgent = document.getElementById('btnFilterUrgent');
    if (btnUrgent) {
      btnUrgent.addEventListener('click', () => {
        this.selectedPriority = 'urgent';
        this.render();
      });
    }

    const btnGrid = document.getElementById('btnViewGrid');
    const btnTable = document.getElementById('btnViewTable');
    if (btnGrid) btnGrid.addEventListener('click', () => this.setViewMode('grid'));
    if (btnTable) btnTable.addEventListener('click', () => this.setViewMode('table'));

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

    const searchInput = document.getElementById('wardenSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearch(e.target.value);
      });
    }

    const blockSelect = document.getElementById('wardenBlockFilter');
    if (blockSelect) {
      blockSelect.addEventListener('change', (e) => {
        this.setBlockFilter(e.target.value);
      });
    }

    const catSelect = document.getElementById('wardenCategoryFilter');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.setCategoryFilter(e.target.value);
      });
    }

    const prioSelect = document.getElementById('wardenPriorityFilter');
    if (prioSelect) {
      prioSelect.addEventListener('change', (e) => {
        this.setPriorityFilter(e.target.value);
      });
    }

    document.querySelectorAll('.btn-update-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const complaint = this.complaints.find(c => c.id === id);
        if (complaint) {
          this.openUpdateStatusModal(complaint);
        }
      });
    });

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
        if (confirm('Are you sure you want to permanently delete this complaint ticket?')) {
          try {
            await deleteComplaint(id);
            toast.info('Ticket Deleted', 'Complaint removed from system.');
          } catch (err) {
            toast.danger('Error', 'Failed to delete complaint.');
          }
        }
      });
    });
  }

  openUpdateStatusModal(complaint) {
    this.activeComplaintToEdit = complaint;
    const modal = document.getElementById('wardenUpdateStatusModal');
    if (!modal) return;

    document.getElementById('editTicketNumberBadge').textContent = complaint.ticketNumber || 'HST-TKT';
    document.getElementById('editTicketTitle').textContent = complaint.title || 'Complaint';
    document.getElementById('editTicketStudent').textContent = `${complaint.studentName || 'Student'} (${complaint.block}, Room ${complaint.roomNumber})`;
    document.getElementById('wardenRemarksInput').value = complaint.wardenNotes || '';
    document.getElementById('wardenAssignedStaffInput').value = complaint.assignedTo || '';

    const statusVal = (complaint.status || 'In progress').toLowerCase();
    const radioAddressed = document.getElementById('statusRadioAddressed');
    const radioInProgress = document.getElementById('statusRadioInProgress');
    const radioRectified = document.getElementById('statusRadioRectified');

    if (statusVal === 'addressed') radioAddressed.checked = true;
    else if (statusVal === 'rectified') radioRectified.checked = true;
    else radioInProgress.checked = true;

    modal.classList.add('active');
  }

  async saveStatusUpdate() {
    if (!this.activeComplaintToEdit) return;

    const modal = document.getElementById('wardenUpdateStatusModal');
    let selectedStatus = 'In progress';
    if (document.getElementById('statusRadioAddressed').checked) selectedStatus = 'Addressed';
    if (document.getElementById('statusRadioRectified').checked) selectedStatus = 'Rectified';

    const wardenNotes = document.getElementById('wardenRemarksInput').value.trim();
    const assignedTo = document.getElementById('wardenAssignedStaffInput').value.trim();

    try {
      await updateComplaintStatus(this.activeComplaintToEdit.id, this.activeComplaintToEdit, {
        newStatus: selectedStatus,
        wardenNotes,
        assignedTo
      });

      toast.success(
        'Status Synchronized',
        `Ticket ${this.activeComplaintToEdit.ticketNumber} updated to "${selectedStatus}".`
      );

      modal.classList.remove('active');
    } catch (err) {
      console.error('Failed to update status', err);
      toast.danger('Update Failed', 'Could not save status change.');
    }
  }

  openDetailsModal(complaint) {
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
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Student</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.studentName)} (${escapeHtml(complaint.studentId)})</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Contact</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.studentPhone || 'N/A')}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Location</div>
          <div style="font-weight: 600;">${escapeHtml(complaint.block)} • Room ${escapeHtml(complaint.roomNumber)}</div>
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
              <div class="timeline-step-time">${formatDateTime(step.timestamp)} • by ${escapeHtml(step.author || 'Authority')}</div>
              ${step.note ? `<div class="timeline-step-notes">${escapeHtml(step.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  exportCSV() {
    if (this.complaints.length === 0) {
      toast.warning('No Data', 'There are no complaints to export.');
      return;
    }

    const headers = ['Ticket ID', 'Student Name', 'Roll Number', 'Hostel Block', 'Room Number', 'Category', 'Priority', 'Status', 'Assigned Staff', 'Warden Remarks', 'Date Created'];
    const rows = this.complaints.map(c => [
      `"${c.ticketNumber || ''}"`,
      `"${c.studentName || ''}"`,
      `"${c.studentId || ''}"`,
      `"${c.block || ''}"`,
      `"${c.roomNumber || ''}"`,
      `"${c.category || ''}"`,
      `"${c.priority || ''}"`,
      `"${c.status || ''}"`,
      `"${c.assignedTo || ''}"`,
      `"${(c.wardenNotes || '').replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hostel_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Successful', 'Hostel complaints CSV file downloaded.');
  }
}

export const wardenController = new WardenController();

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
