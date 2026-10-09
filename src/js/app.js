import { subscribeToComplaints, createComplaint } from './db.js';
import { auth, DEMO_PERSONAS } from './auth.js';
import { studentController } from './student.js';
import { wardenController } from './warden.js';
import { toast } from './toast.js';
import { sound } from './sound.js';
import { icons } from './icons.js';
import { chatbot } from './chatbot.js';

class App {
  constructor() {
    this.currentRoleTab = 'student';
    this.currentSubTab = 'login';
    this.selectedCategory = 'Electrical';
    this.uploadedImageBase64 = '';
  }

  init() {
    this.initTheme();
    this.initAuthForms();
    this.initModals();
    this.initHeader();
    this.initRealtimeDB();
    chatbot.init();

    auth.onAuthChange((user) => {
      this.updateViewBasedOnAuth(user);
    });

    this.updateViewBasedOnAuth(auth.getCurrentUser());
  }

  initTheme() {
    const savedTheme = localStorage.getItem('hostel_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtonIcon(savedTheme);

    const btnTheme = document.getElementById('btnToggleTheme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('hostel_theme', next);
        this.updateThemeButtonIcon(next);
      });
    }

    const btnSound = document.getElementById('btnToggleSound');
    if (btnSound) {
      btnSound.innerHTML = icons.volume;
      btnSound.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        btnSound.innerHTML = icons.volume;
        btnSound.style.opacity = sound.enabled ? '1' : '0.4';
        btnSound.title = sound.enabled ? 'Sound: ON' : 'Sound: OFF';
      });
    }
  }

  updateThemeButtonIcon(theme) {
    const btn = document.getElementById('btnToggleTheme');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? icons.sun : icons.moon;
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  initHeader() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        auth.logout();
        toast.info('Logged Out', 'You have been safely signed out.');
      });
    }
  }

  initRealtimeDB() {
    const syncBadge = document.getElementById('dbSyncBadge');
    const syncText = document.getElementById('dbSyncText');

    if (syncBadge) syncBadge.classList.add('syncing');
    if (syncText) syncText.textContent = 'Connecting...';

    subscribeToComplaints(
      (complaints) => {
        if (syncBadge) syncBadge.classList.remove('syncing');
        if (syncText) syncText.textContent = 'Live Sync';

        studentController.setComplaints(complaints);
        wardenController.setComplaints(complaints);
      },
      (error) => {
        if (syncBadge) syncBadge.classList.add('syncing');
        if (syncText) syncText.textContent = 'Offline';
      }
    );
  }

  updateViewBasedOnAuth(user) {
    const authSection = document.getElementById('authSection');
    const studentSection = document.getElementById('studentSection');
    const wardenSection = document.getElementById('wardenSection');
    const userPill = document.getElementById('headerUserPill');
    const btnLogout = document.getElementById('btnLogout');

    if (!user) {
      if (authSection) authSection.style.display = 'flex';
      if (studentSection) studentSection.style.display = 'none';
      if (wardenSection) wardenSection.style.display = 'none';
      if (userPill) userPill.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'none';
    } else if (user.role === 'student') {
      if (authSection) authSection.style.display = 'none';
      if (studentSection) studentSection.style.display = 'block';
      if (wardenSection) wardenSection.style.display = 'none';
      if (userPill) {
        userPill.style.display = 'flex';
        document.getElementById('headerUserName').textContent = user.name || 'Student';
        document.getElementById('headerUserRole').textContent = `Student • ${user.block || ''} ${user.roomNumber || ''}`;
        document.getElementById('headerUserAvatar').textContent = user.avatar || 'ST';
      }
      if (btnLogout) btnLogout.style.display = 'inline-flex';
      studentController.render();
    } else if (user.role === 'warden') {
      if (authSection) authSection.style.display = 'none';
      if (studentSection) studentSection.style.display = 'none';
      if (wardenSection) wardenSection.style.display = 'block';
      if (userPill) {
        userPill.style.display = 'flex';
        document.getElementById('headerUserName').textContent = user.name || 'Warden';
        document.getElementById('headerUserRole').textContent = user.designation || 'Hostel Authority';
        document.getElementById('headerUserAvatar').textContent = user.avatar || 'WD';
      }
      if (btnLogout) btnLogout.style.display = 'inline-flex';
      wardenController.render();
    }
  }

  initAuthForms() {
    const tabStudent = document.getElementById('roleTabStudent');
    const tabWarden = document.getElementById('roleTabWarden');
    const studentFormContainer = document.getElementById('studentFormContainer');
    const wardenFormContainer = document.getElementById('wardenFormContainer');

    const switchRole = (role) => {
      this.currentRoleTab = role;
      if (role === 'student') {
        tabStudent?.classList.add('active');
        tabWarden?.classList.remove('active');
        if (studentFormContainer) studentFormContainer.style.display = 'block';
        if (wardenFormContainer) wardenFormContainer.style.display = 'none';
      } else {
        tabWarden?.classList.add('active');
        tabStudent?.classList.remove('active');
        if (studentFormContainer) studentFormContainer.style.display = 'none';
        if (wardenFormContainer) wardenFormContainer.style.display = 'block';
      }
    };

    if (tabStudent) tabStudent.addEventListener('click', () => switchRole('student'));
    if (tabWarden) tabWarden.addEventListener('click', () => switchRole('warden'));

    const subTabLogin = document.getElementById('subTabLogin');
    const subTabRegister = document.getElementById('subTabRegister');
    const studentLoginForm = document.getElementById('studentLoginForm');
    const studentRegisterForm = document.getElementById('studentRegisterForm');

    if (subTabLogin && subTabRegister) {
      subTabLogin.addEventListener('click', () => {
        this.currentSubTab = 'login';
        subTabLogin.classList.add('active');
        subTabRegister.classList.remove('active');
        if (studentLoginForm) studentLoginForm.style.display = 'block';
        if (studentRegisterForm) studentRegisterForm.style.display = 'none';
      });

      subTabRegister.addEventListener('click', () => {
        this.currentSubTab = 'register';
        subTabRegister.classList.add('active');
        subTabLogin.classList.remove('active');
        if (studentLoginForm) studentLoginForm.style.display = 'none';
        if (studentRegisterForm) studentRegisterForm.style.display = 'block';
      });
    }

    if (studentLoginForm) {
      studentLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('studentLoginId').value;
        const pass = document.getElementById('studentLoginPass').value;
        try {
          const user = auth.loginStudent(id, pass);
          toast.success('Welcome Back', `Signed in as ${user.name}`);
        } catch (err) {
          toast.danger('Login Failed', err.message);
        }
      });
    }

    if (studentRegisterForm) {
      studentRegisterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regStudentName').value;
        const studentId = document.getElementById('regStudentId').value;
        const email = document.getElementById('regStudentEmail').value;
        const block = document.getElementById('regStudentBlock').value;
        const roomNumber = document.getElementById('regStudentRoom').value;
        const phone = document.getElementById('regStudentPhone').value;
        const password = document.getElementById('regStudentPass').value;

        try {
          const user = auth.registerStudent({
            name,
            studentId,
            email,
            block,
            roomNumber,
            phone,
            password
          });
          toast.success('Account Created', `Welcome ${user.name}`);
        } catch (err) {
          toast.danger('Registration Failed', err.message);
        }
      });
    }

    if (wardenFormContainer) {
      const wardenForm = document.getElementById('wardenLoginForm');
      if (wardenForm) {
        wardenForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const id = document.getElementById('wardenLoginId').value;
          const pass = document.getElementById('wardenLoginPass').value;
          try {
            const user = auth.loginWarden(id, pass);
            toast.success('Access Granted', `Welcome Warden ${user.name}`);
          } catch (err) {
            toast.danger('Login Failed', err.message);
          }
        });
      }
    }

    document.querySelectorAll('.demo-user-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const personaKey = e.currentTarget.dataset.persona;
        try {
          const user = auth.loginAsDemo(personaKey);
          toast.success('Signed In', `${user.name} (${user.role.toUpperCase()})`);
        } catch (err) {
          toast.danger('Demo Error', err.message);
        }
      });
    });
  }

  initModals() {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.modal-close-btn, .btn-modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
      });
    });

    document.querySelectorAll('.category-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-option-btn').forEach(b => b.classList.remove('selected'));
        const target = e.currentTarget;
        target.classList.add('selected');
        this.selectedCategory = target.dataset.category;
      });
    });

    const photoInput = document.getElementById('newComplaintPhoto');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            toast.warning('File Size Limit', 'Please upload a photo under 2MB.');
            photoInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.uploadedImageBase64 = event.target.result;
            if (previewContainer) {
              previewContainer.innerHTML = `
                <div style="position: relative; display: inline-block; margin-top: 0.5rem;">
                  <img src="${this.uploadedImageBase64}" style="max-height: 100px; border-radius: 4px; border: 1px solid var(--border-subtle);" alt="Preview" />
                  <button type="button" id="btnRemovePhoto" style="position: absolute; top: -6px; right: -6px; background: #000; color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 10px;">&times;</button>
                </div>
              `;
              document.getElementById('btnRemovePhoto')?.addEventListener('click', () => {
                this.uploadedImageBase64 = '';
                photoInput.value = '';
                previewContainer.innerHTML = '';
              });
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const raiseForm = document.getElementById('raiseComplaintForm');
    if (raiseForm) {
      raiseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.getCurrentUser();
        const title = document.getElementById('newComplaintTitle').value.trim();
        const description = document.getElementById('newComplaintDesc').value.trim();
        const block = document.getElementById('newComplaintBlock').value;
        const roomNumber = document.getElementById('newComplaintRoom').value.trim();
        const preferredTime = document.getElementById('newComplaintTime').value;

        const priorityRadio = document.querySelector('input[name="complaintPriority"]:checked');
        const priority = priorityRadio ? priorityRadio.value : 'medium';

        if (!title || !description || !roomNumber) {
          toast.danger('Missing Fields', 'Please complete title, room number, and description.');
          return;
        }

        const submitBtn = document.getElementById('btnSubmitComplaint');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';
        }

        try {
          await createComplaint({
            title,
            description,
            category: this.selectedCategory,
            block,
            roomNumber,
            studentId: user?.id || 'Student',
            studentName: user?.name || 'Student',
            studentPhone: user?.phone || '',
            priority,
            preferredTime,
            imageUrl: this.uploadedImageBase64 || ''
          });

          toast.success('Complaint Submitted', 'Your ticket has been registered in the system.');
          document.getElementById('raiseComplaintModal')?.classList.remove('active');
          this.uploadedImageBase64 = '';
          raiseForm.reset();
        } catch (err) {
          console.error('Failed to create complaint', err);
          toast.danger('Submission Failed', 'Could not save complaint.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Submit Complaint Ticket</span>`;
          }
        }
      });
    }

    const btnSaveStatus = document.getElementById('btnSaveWardenStatus');
    if (btnSaveStatus) {
      btnSaveStatus.addEventListener('click', () => {
        wardenController.saveStatusUpdate();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
