import { createComplaint } from './db.js';

export const SAMPLE_COMPLAINTS = [
  {
    title: 'Ceiling fan making loud grinding noise and vibrating',
    description: 'The ceiling fan in Room 304 started making a harsh rattling and grinding noise yesterday night. The regulator is also sparking slightly when switched to speed 5.',
    category: 'Electrical',
    block: 'Block B',
    roomNumber: '304',
    studentId: '22BCE1045',
    studentName: 'Rahul Sharma',
    studentPhone: '+91 98765 43210',
    priority: 'high',
    preferredTime: 'Evening (3 PM - 6 PM)',
    imageUrl: 'https://images.unsplash.com/photo-1590483736427-4a0d91d6bbd0?w=600&auto=format&fit=crop&q=80'
  },
  {
    title: 'Bathroom washbasin tap leaking continuously',
    description: 'The tap on the left washbasin does not shut off completely and water is leaking constantly. Drain is also slow.',
    category: 'Plumbing',
    block: 'Block A',
    roomNumber: '112',
    studentId: '22BCE1180',
    studentName: 'Ananya Iyer',
    studentPhone: '+91 98765 43211',
    priority: 'medium',
    preferredTime: 'Morning (9 AM - 12 PM)',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'
  },
  {
    title: 'Wi-Fi access point in 3rd floor corridor disconnected',
    description: 'No internet access in Block B 3rd floor rooms since 8 AM today. SSID "Hostel-B-3F" is not broadcasting signal.',
    category: 'Wi-Fi & Internet',
    block: 'Block B',
    roomNumber: '308',
    studentId: '22BCE1090',
    studentName: 'Vikram Mehta',
    studentPhone: '+91 98765 43215',
    priority: 'urgent',
    preferredTime: 'Any Time',
    imageUrl: ''
  },
  {
    title: 'Study table drawer lock broken and drawer jammed',
    description: 'The study table lock broke when turning the key, and now the wooden drawer is stuck shut with notebooks inside.',
    category: 'Carpentry',
    block: 'Block C',
    roomNumber: '215',
    studentId: '22BCE1340',
    studentName: 'Sneha Patel',
    studentPhone: '+91 98765 43220',
    priority: 'low',
    preferredTime: 'Afternoon (12 PM - 3 PM)',
    imageUrl: ''
  },
  {
    title: 'Water cooler purifier filter indicator red & slow flow',
    description: 'The drinking water cooler on Block A 1st floor shows filter replacement warning LED and water taste is odd.',
    category: 'Mess & Food',
    block: 'Block A',
    roomNumber: 'Common-1F',
    studentId: '22BCE1002',
    studentName: 'Karthik Raja',
    studentPhone: '+91 98765 43235',
    priority: 'high',
    preferredTime: 'Any Time',
    imageUrl: ''
  }
];

export async function seedRealisticComplaints() {
  for (const complaint of SAMPLE_COMPLAINTS) {
    try {
      await createComplaint(complaint);
    } catch (e) {
      console.error('Failed to seed complaint', complaint.title, e);
    }
  }
}
