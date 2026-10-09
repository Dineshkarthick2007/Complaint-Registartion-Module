/**
 * Authentication and User Session Management
 */

const STORAGE_KEY = 'hostel_auth_user';

export const DEMO_PERSONAS = {
  student_rahul: {
    role: 'student',
    id: '22BCE1045',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@campus.edu',
    block: 'Block B',
    roomNumber: '304',
    phone: '+91 98765 43210',
    avatar: 'RS'
  },
  student_ananya: {
    role: 'student',
    id: '22BCE1180',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@campus.edu',
    block: 'Block A',
    roomNumber: '112',
    phone: '+91 98765 43211',
    avatar: 'AI'
  },
  warden_chief: {
    role: 'warden',
    id: 'WRD-CHIEF-01',
    name: 'Dr. K. S. Verma',
    email: 'chief.warden@campus.edu',
    designation: 'Chief Hostel Warden',
    avatar: 'KV'
  },
  warden_block: {
    role: 'warden',
    id: 'WRD-BLK-02',
    name: 'Prof. Sunita Rao',
    email: 'warden.blockb@campus.edu',
    designation: 'Block B Resident Warden',
    avatar: 'SR'
  }
};

class AuthManager {
  constructor() {
    this.currentUser = this.loadSession();
    this.listeners = [];
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
    return null;
  }

  saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notifyListeners();
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error('Error in auth listener', e);
      }
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  isStudent() {
    return this.currentUser?.role === 'student';
  }

  isWarden() {
    return this.currentUser?.role === 'warden';
  }

  loginAsDemo(personaKey) {
    const persona = DEMO_PERSONAS[personaKey];
    if (persona) {
      this.saveSession({ ...persona });
      return persona;
    }
    throw new Error('Invalid demo persona selected');
  }

  loginStudent(studentId, password) {
    if (!studentId || !studentId.trim()) {
      throw new Error('Please enter your Student ID or Roll Number');
    }
    // Check if matching registered user or create student profile
    const name = studentId.includes('@') ? studentId.split('@')[0] : `Student (${studentId})`;
    const initials = name.slice(0, 2).toUpperCase();

    const user = {
      role: 'student',
      id: studentId.trim(),
      name: name,
      email: studentId.includes('@') ? studentId : `${studentId.toLowerCase()}@campus.edu`,
      block: 'Block A',
      roomNumber: '201',
      phone: '+91 98765 00000',
      avatar: initials
    };
    this.saveSession(user);
    return user;
  }

  registerStudent({ name, studentId, email, block, roomNumber, phone, password }) {
    if (!name || !studentId || !roomNumber) {
      throw new Error('Please fill in all required fields');
    }
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
    const user = {
      role: 'student',
      id: studentId.trim(),
      name: name.trim(),
      email: email ? email.trim() : `${studentId.trim().toLowerCase()}@campus.edu`,
      block: block || 'Block A',
      roomNumber: roomNumber.trim(),
      phone: phone ? phone.trim() : '',
      avatar: initials
    };
    this.saveSession(user);
    return user;
  }

  loginWarden(wardenId, password) {
    if (!wardenId || !wardenId.trim()) {
      throw new Error('Please enter Warden Staff ID or Email');
    }
    const name = wardenId.includes('@') ? wardenId.split('@')[0] : `Warden (${wardenId})`;
    const initials = name.slice(0, 2).toUpperCase();

    const user = {
      role: 'warden',
      id: wardenId.trim(),
      name: name,
      email: wardenId.includes('@') ? wardenId : `${wardenId.toLowerCase()}@campus.edu`,
      designation: 'Hostel Authority Warden',
      avatar: initials
    };
    this.saveSession(user);
    return user;
  }

  logout() {
    this.saveSession(null);
  }
}

export const auth = new AuthManager();
