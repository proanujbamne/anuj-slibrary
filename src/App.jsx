import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, BookOpen, Users, DollarSign, MapPin, Clock, Eye, X, Calendar, History, Phone, Mail, User, CreditCard, AlertCircle, CheckCircle, Database, Download, Upload } from 'lucide-react';
import { 
  initializeDatabase, 
  getAllStudents, 
  saveStudents, 
  addStudent as dbAddStudent, 
  updateStudent as dbUpdateStudent, 
  deleteStudent as dbDeleteStudent,
  getSeatLayout,
  saveSeatLayout,
  addPayment as dbAddPayment,
  exportData,
  importData,
  getDatabaseStats
} from './database';

const StudyLibraryManagementSystem = () => {
  // Initialize database and load data
  const [students, setStudents] = useState([]);
  const [seatLayout, setSeatLayout] = useState({
    total: 80,
    occupied: [],
    fullTimeSeats: [],
    halfTimeSeats: []
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    notes: ''
  });
  const [timingForm, setTimingForm] = useState({
    fullTimeStart: '09:00',
    fullTimeEnd: '21:00',
    halfTimeStart: '09:00',
    halfTimeEnd: '14:00'
  });
  const [showTimingModal, setShowTimingModal] = useState(false);
  const [showStudentTimingModal, setShowStudentTimingModal] = useState(false);
  const [selectedStudentForTiming, setSelectedStudentForTiming] = useState(null);
  const [studentTimingForm, setStudentTimingForm] = useState({
    customStartTime: '',
    customEndTime: '',
    useCustomTiming: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Load data from database on component mount
  useEffect(() => {
    initializeDatabase();
    const loadedStudents = getAllStudents();
    const loadedSeatLayout = getSeatLayout();
    setStudents(loadedStudents);
    setSeatLayout(loadedSeatLayout);
  }, []);

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    address: '',
    planType: 'half-time',
    feesPaid: false,
    seatNumber: '',
    paymentMethod: 'Cash',
    useCustomTiming: false,
    customStartTime: '',
    customEndTime: ''
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const resetForm = () => {
    setStudentForm({
      name: '',
      email: '',
      phone: '+91 ',
      address: '',
      planType: 'half-time',
      feesPaid: false,
      seatNumber: '',
      paymentMethod: 'Cash',
      useCustomTiming: false,
      customStartTime: '',
      customEndTime: ''
    });
    setEditingStudent(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!studentForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!studentForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(studentForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!studentForm.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!/^\+91\s\d{10}$/.test(studentForm.phone)) {
      errors.phone = 'Phone format should be +91 XXXXXXXXXX';
    }
    
    if (!studentForm.seatNumber) {
      errors.seatNumber = 'Please select a seat';
    }

    // Check for duplicate email or phone (except when editing)
    const existingStudent = students.find(s => 
      s.id !== (editingStudent?.id || 0) && 
      (s.email === studentForm.email || s.phone === studentForm.phone)
    );
    
    if (existingStudent) {
      if (existingStudent.email === studentForm.email) {
        errors.email = 'Email already exists';
      }
      if (existingStudent.phone === studentForm.phone) {
        errors.phone = 'Phone number already exists';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getAvailableSeats = (planType) => {
    const availableSeats = [];
    
    for (let i = 1; i <= seatLayout.total; i++) {
      const seatNum = i.toString().padStart(2, '0');
      if (!seatLayout.occupied.includes(seatNum) || 
          (editingStudent && editingStudent.seatNumber === seatNum)) {
        availableSeats.push(seatNum);
      }
    }
    return availableSeats;
  };

  const generateStudentId = () => {
    return Math.max(...students.map(s => s.id), 0) + 1;
  };

  const handleAddStudent = (e) => {
    if (e) {
      e.preventDefault();
    }

    // Clear previous errors
    setFormErrors({});
    
    if (!validateForm()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    try {
      const feeAmount = studentForm.planType === 'full-time' ? 800 : 500;
      const studyHours = studentForm.useCustomTiming && studentForm.customStartTime && studentForm.customEndTime
        ? `${studentForm.customStartTime} - ${studentForm.customEndTime}`
        : studentForm.planType === 'full-time' 
          ? `${timingForm.fullTimeStart} - ${timingForm.fullTimeEnd}` 
          : `${timingForm.halfTimeStart} - ${timingForm.halfTimeEnd}`;
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (editingStudent) {
        // Update existing student
        const updatedStudent = {
          ...editingStudent,
          name: studentForm.name,
          email: studentForm.email,
          phone: studentForm.phone,
          address: studentForm.address,
          planType: studentForm.planType,
          seatNumber: studentForm.seatNumber,
          feeAmount,
          studyHours,
          feesPaid: studentForm.feesPaid,
          useCustomTiming: studentForm.useCustomTiming,
          customStartTime: studentForm.customStartTime,
          customEndTime: studentForm.customEndTime,
          lastFeeDate: studentForm.feesPaid && !editingStudent.feesPaid ? currentDate : editingStudent.lastFeeDate,
          paymentHistory: studentForm.feesPaid && !editingStudent.feesPaid ? [
            ...editingStudent.paymentHistory,
            {
              id: editingStudent.paymentHistory.length + 1,
              date: currentDate,
              amount: feeAmount,
              method: studentForm.paymentMethod,
              status: 'Paid',
              month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            }
          ] : editingStudent.paymentHistory,
          totalPaid: studentForm.feesPaid && !editingStudent.feesPaid ? 
            editingStudent.totalPaid + feeAmount : editingStudent.totalPaid
        };
        
        if (dbUpdateStudent(updatedStudent)) {
          setStudents(getAllStudents());
        }
        
        // Update seat layout if seat changed
        if (editingStudent.seatNumber !== studentForm.seatNumber) {
          const newLayout = { ...seatLayout };
          // Remove old seat
          newLayout.occupied = newLayout.occupied.filter(
            seat => seat !== editingStudent.seatNumber
          );
          // Add new seat
          newLayout.occupied.push(studentForm.seatNumber);
          setSeatLayout(newLayout);
          saveSeatLayout(newLayout);
        }
        
        showNotification('Student updated successfully!', 'success');
      } else {
        // Add new student
        const newStudent = {
          name: studentForm.name,
          email: studentForm.email,
          phone: studentForm.phone,
          address: studentForm.address,
          planType: studentForm.planType,
          seatNumber: studentForm.seatNumber,
          joinDate: currentDate,
          lastFeeDate: studentForm.feesPaid ? currentDate : null,
          feeAmount,
          studyHours,
          status: 'Active',
          feesPaid: studentForm.feesPaid,
          useCustomTiming: studentForm.useCustomTiming,
          customStartTime: studentForm.customStartTime,
          customEndTime: studentForm.customEndTime,
          paymentHistory: studentForm.feesPaid ? [{
            id: 1,
            date: currentDate,
            amount: feeAmount,
            method: studentForm.paymentMethod,
            status: 'Paid',
            month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }] : [],
          totalPaid: studentForm.feesPaid ? feeAmount : 0
        };
        
        const addedStudent = dbAddStudent(newStudent);
        if (addedStudent) {
          setStudents(getAllStudents());
          
          // Update seat layout
          const newLayout = { ...seatLayout };
          newLayout.occupied.push(studentForm.seatNumber);
          setSeatLayout(newLayout);
          saveSeatLayout(newLayout);
          
          showNotification('Student added successfully!', 'success');
        } else {
          showNotification('Error adding student. Please try again.', 'error');
        }
      }
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Error adding/updating student:', error);
      showNotification('Error saving student. Please try again.', 'error');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address || '',
      planType: student.planType,
      feesPaid: student.feesPaid,
      seatNumber: student.seatNumber,
      paymentMethod: 'Cash',
      useCustomTiming: student.useCustomTiming || false,
      customStartTime: student.customStartTime || '',
      customEndTime: student.customEndTime || ''
    });
    setShowModal(true);
  };

  const handleDelete = (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      if (dbDeleteStudent(student.id)) {
        // Update students list
        setStudents(getAllStudents());
        
        // Free up the seat
        const newLayout = { ...seatLayout };
        newLayout.occupied = newLayout.occupied.filter(seat => seat !== student.seatNumber);
        setSeatLayout(newLayout);
        saveSeatLayout(newLayout);
        
        // Close profile modal if the deleted student was being viewed
        if (selectedStudent && selectedStudent.id === student.id) {
          setShowStudentProfile(false);
          setSelectedStudent(null);
        }
        
        showNotification('Student deleted successfully!', 'success');
      } else {
        showNotification('Error deleting student. Please try again.', 'error');
      }
    }
  };

  const addPayment = (studentId, amount, method = 'Cash', notes = '') => {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const payment = {
      date: currentDate,
      amount: amount,
      method: method,
      status: 'Paid',
      month: currentMonth,
      notes: notes,
      paymentId: Date.now() // Unique payment ID for tracking
    };
    
    if (dbAddPayment(studentId, payment)) {
      setStudents(getAllStudents());
      
      // Update selected student if viewing their profile
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent(getAllStudents().find(s => s.id === studentId));
      }
      
      showNotification('Payment recorded successfully!', 'success');
    } else {
      showNotification('Error recording payment. Please try again.', 'error');
    }
  };

  const toggleFeePayment = (studentId) => {
    const student = students.find(s => s.id === studentId);
    console.log('Toggling payment for student:', student?.name, 'Current status:', student?.feesPaid);
    
    if (student && !student.feesPaid) {
      addPayment(studentId, student.feeAmount);
    } else if (student && student.feesPaid) {
      // Mark as unpaid
      setStudents(prev => {
        const updatedStudents = prev.map(s => 
          s.id === studentId 
            ? { ...s, feesPaid: false }
            : s
        );
        console.log('Updated payment status to unpaid');
        return updatedStudents;
      });
      
      // Update selected student if viewing their profile
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent(prev => ({ ...prev, feesPaid: false }));
      }
      
      showNotification('Payment status updated!', 'success');
    }
  };

  const viewStudentProfile = (student) => {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  };

  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    setPaymentForm({
      amount: student.feeAmount.toString(),
      method: 'Cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    addPayment(selectedStudent.id, parseFloat(paymentForm.amount), paymentForm.method, paymentForm.notes);
    setShowPaymentModal(false);
    setPaymentForm({ amount: '', method: 'Cash', notes: '' });
  };

  const handleTimingSubmit = (e) => {
    e.preventDefault();
    
    // Validate timing
    if (timingForm.fullTimeStart >= timingForm.fullTimeEnd) {
      showNotification('Full-time start time must be before end time', 'error');
      return;
    }
    
    if (timingForm.halfTimeStart >= timingForm.halfTimeEnd) {
      showNotification('Half-time start time must be before end time', 'error');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('library_timings', JSON.stringify(timingForm));
    
    showNotification('Study timings updated successfully!', 'success');
    setShowTimingModal(false);
  };

  const loadTimings = () => {
    const savedTimings = localStorage.getItem('library_timings');
    if (savedTimings) {
      setTimingForm(JSON.parse(savedTimings));
    }
  };

  const openStudentTimingModal = (student) => {
    setSelectedStudentForTiming(student);
    setStudentTimingForm({
      customStartTime: student.customStartTime || '',
      customEndTime: student.customEndTime || '',
      useCustomTiming: student.useCustomTiming || false
    });
    setShowStudentTimingModal(true);
  };

  const handleStudentTimingSubmit = (e) => {
    e.preventDefault();
    
    if (studentTimingForm.useCustomTiming) {
      if (!studentTimingForm.customStartTime || !studentTimingForm.customEndTime) {
        showNotification('Please set both start and end times for custom timing', 'error');
        return;
      }
      
      if (studentTimingForm.customStartTime >= studentTimingForm.customEndTime) {
        showNotification('Start time must be before end time', 'error');
        return;
      }
    }
    
    // Update student with custom timing
    const updatedStudent = {
      ...selectedStudentForTiming,
      customStartTime: studentTimingForm.customStartTime,
      customEndTime: studentTimingForm.customEndTime,
      useCustomTiming: studentTimingForm.useCustomTiming
    };
    
    // Update in database
    dbUpdateStudent(updatedStudent);
    
    // Update local state
    setStudents(prev => prev.map(s => 
      s.id === updatedStudent.id ? updatedStudent : s
    ));
    
    showNotification('Student timing updated successfully!', 'success');
    setShowStudentTimingModal(false);
  };

  const getStudentDisplayTiming = (student) => {
    if (student.useCustomTiming && student.customStartTime && student.customEndTime) {
      return `${convertTo12Hour(student.customStartTime)} - ${convertTo12Hour(student.customEndTime)} (Custom)`;
    }
    
    if (student.planType === 'full-time') {
      return `${convertTo12Hour(timingForm.fullTimeStart)} - ${convertTo12Hour(timingForm.fullTimeEnd)}`;
    } else {
      return `${convertTo12Hour(timingForm.halfTimeStart)} - ${convertTo12Hour(timingForm.halfTimeEnd)}`;
    }
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  const convertTo24Hour = (time12) => {
    if (!time12) return '';
    
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  );

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'Active').length,
    feesPending: students.filter(s => !s.feesPaid).length,
    fullTimeStudents: students.filter(s => s.planType === 'full-time').length,
    halfTimeStudents: students.filter(s => s.planType === 'half-time').length,
    occupiedSeats: seatLayout.occupied.length,
    totalSeats: seatLayout.total
  };

  // SQL Database Schema (for reference)
  const sqlSchema = `-- Vishwkarma Library Database Schema

-- Students Table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    join_date DATE NOT NULL,
    plan_type ENUM('full-time', 'half-time') NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    seat_number VARCHAR(10) UNIQUE NOT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    study_hours VARCHAR(50) NOT NULL,
    fees_paid BOOLEAN DEFAULT FALSE,
    last_fee_date DATE,
    total_paid DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment History Table
CREATE TABLE payment_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NOT NULL,
    month_year VARCHAR(20) NOT NULL,
    status ENUM('Paid', 'Pending', 'Failed') DEFAULT 'Paid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Seats Table
CREATE TABLE seats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seat_number VARCHAR(10) UNIQUE NOT NULL,
    seat_type ENUM('full-time', 'half-time') NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    student_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- Sample SQL Queries for Vishwkarma Library
-- Get all students with pending fees
SELECT * FROM students WHERE fees_paid = FALSE;

-- Get payment history for a student
SELECT * FROM payment_history WHERE student_id = 1 ORDER BY payment_date DESC;

-- Get seat occupancy report
SELECT 
    COUNT(*) as occupied_seats,
    (SELECT COUNT(*) FROM seats) as total_seats
FROM seats 
WHERE is_occupied = TRUE;

-- Monthly revenue report
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') as month,
    SUM(amount) as total_revenue,
    COUNT(*) as total_payments
FROM payment_history 
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month DESC;`;

  const renderSeatMap = () => {
    const seatsPerRow = 10; // 10 seats per row for better horizontal layout
    const totalRows = Math.ceil(seatLayout.total / seatsPerRow);
    
    return (
      <div className="w-full max-w-6xl">
        <h3 className="text-lg font-semibold mb-6 text-center">Vishwkarma Library Seats (80 Total)</h3>
        
        {/* Legend */}
        <div className="flex justify-center mb-6 space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm">Occupied</span>
          </div>
        </div>
        
        {/* Seat rows */}
        <div className="seat-map-container">
          {Array.from({ length: totalRows }, (_, rowIndex) => {
            const startSeat = rowIndex * seatsPerRow + 1;
            const endSeat = Math.min((rowIndex + 1) * seatsPerRow, seatLayout.total);
            
            return (
              <div key={rowIndex} className="seat-row">
                {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                  const seatNumber = startSeat + colIndex;
                  if (seatNumber > seatLayout.total) return <div key={colIndex} className="w-16"></div>; // Empty space
                  
                  const seatNum = seatNumber.toString().padStart(2, '0');
                  const isOccupied = seatLayout.occupied.includes(seatNum);
                  const occupant = students.find(s => s.seatNumber === seatNum);
                  
                  return (
                    <div
                      key={seatNum}
                      className={`seat-item ${
                        isOccupied 
                          ? 'bg-red-100 border-red-300 text-red-800 border' 
                          : 'bg-green-100 border-green-300 text-green-800 border'
                      }`}
                      title={isOccupied ? `Occupied by ${occupant?.name}` : 'Available'}
                      onClick={() => isOccupied && occupant && viewStudentProfile(occupant)}
                    >
                      <div className="seat-number">{seatNum}</div>
                      <div className="seat-status">
                        {isOccupied ? 'Occupied' : 'Available'}
                      </div>
                      {isOccupied && occupant && (
                        <div className="seat-occupant">
                          {occupant.name.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Row labels */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Front of Library →</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ show: false, message: '', type: 'success' })}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="modern-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Vishwkarma Library</h1>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('students')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'students'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setCurrentView('seats')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'seats'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Seat Map
              </button>
              <button
                onClick={() => setCurrentView('database')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'database'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Database
              </button>
              <button
                onClick={() => setCurrentView('sql')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'sql'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                SQL Schema
              </button>
              {/* Timing settings nav removed (keep SQL only) */}
            </nav>
          </div>
        </div>
      </header>

      <main className="modern-container py-8">
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 justify-center">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MapPin className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Occupied Seats</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.occupiedSeats}/{stats.totalSeats}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Fees</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.feesPending}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Plan Distribution</h3>
                    <button
                      onClick={() => setShowTimingModal(true)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center space-x-2"
                    >
                      <Clock size={14} />
                      <span>Settings</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Full Time ({convertTo12Hour(timingForm.fullTimeStart)} - {convertTo12Hour(timingForm.fullTimeEnd)})</span>
                      <span className="text-lg font-bold text-blue-600">{stats.fullTimeStudents}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-sm font-medium">Half Time ({convertTo12Hour(timingForm.halfTimeStart)} - {convertTo12Hour(timingForm.halfTimeEnd)})</span>
                      <span className="text-lg font-bold text-green-600">{stats.halfTimeStudents}</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* Students with Pending Fees */}
            {stats.feesPending > 0 && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    Students with Pending Fees
                  </h3>
                  <div className="space-y-3">
                    {students.filter(s => !s.feesPaid).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-600">Seat: {student.seatNumber} | Plan: {student.planType}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-red-600">₹{student.feeAmount}</span>
                          <button
                            onClick={() => toggleFeePayment(student.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => viewStudentProfile(student)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Students</h3>
                <div className="space-y-3">
                  {students.slice(-5).reverse().map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">Joined: {student.joinDate} | Seat: {student.seatNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          student.feesPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.feesPaid ? 'Paid' : 'Pending'}
                        </span>
                        <button
                          onClick={() => viewStudentProfile(student)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students View */}
        {currentView === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Students</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add Student</span>
              </button>
            </div>

            {/* Search */}
            <div className="search-container">
              <Search className="search-icon h-4 w-4" />
              <input
                type="text"
                placeholder="Search students by name, email, phone or seat number..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Students Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan & Seat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Study Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">Joined: {student.joinDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{student.planType}</div>
                        <div className="text-sm text-gray-500">Seat: {student.seatNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getStudentDisplayTiming(student)}
                        </div>
                        {student.useCustomTiming && (
                          <div className="text-xs text-purple-600 font-medium">Custom Timing</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.feesPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.feesPaid ? 'Paid' : 'Pending'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">₹{student.feeAmount}/month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewStudentProfile(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openStudentTimingModal(student)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Change Study Timing"
                          >
                            ⏰
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => toggleFeePayment(student.id)}
                            className={`${student.feesPaid ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={student.feesPaid ? 'Mark Unpaid' : 'Mark Paid'}
                          >
                            <CreditCard size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seat Map View */}
        {currentView === 'seats' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Seat Map</h2>
            
            {/* Legend */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-3">Legend</h3>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm">Occupied</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Click on occupied seats to view student details</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-center">
                {renderSeatMap()}
              </div>
            </div>
          </div>
        )}

        {/* Database Management View */}
        {currentView === 'database' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Database className="mr-2" size={20} />
                  Database Statistics
                </h3>
                {(() => {
                  const stats = getDatabaseStats();
                  return stats ? (
                                      <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Students:</span>
                      <span className="font-semibold">{stats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Students:</span>
                      <span className="font-semibold">{stats.activeStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Seats:</span>
                      <span className="font-semibold">{stats.totalSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Occupied Seats:</span>
                      <span className="font-semibold">{stats.occupiedSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Seats:</span>
                      <span className="font-semibold">{stats.availableSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-semibold text-green-600">₹{stats.totalRevenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Payments:</span>
                      <span className="font-semibold text-blue-600">{stats.totalPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month Revenue:</span>
                      <span className="font-semibold text-green-600">₹{stats.thisMonthRevenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Fees:</span>
                      <span className="font-semibold text-red-600">{stats.pendingFees}</span>
                    </div>
                  </div>
                  ) : (
                    <p className="text-gray-500">Unable to load statistics</p>
                  );
                })()}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      const data = exportData();
                      if (data) {
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `vishwkarma-library-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showNotification('Data exported successfully!', 'success');
                      } else {
                        showNotification('Error exporting data', 'error');
                      }
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Export Data</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (importData(e.target.result)) {
                              setStudents(getAllStudents());
                              setSeatLayout(getSeatLayout());
                              showNotification('Data imported successfully!', 'success');
                            } else {
                              showNotification('Error importing data', 'error');
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Import Data</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                        localStorage.clear();
                        setStudents([]);
                        setSeatLayout({ total: 80, occupied: [], fullTimeSeats: [], halfTimeSeats: [] });
                        showNotification('All data cleared', 'success');
                      }
                    }}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SQL Schema view removed */}
      </main>

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={studentForm.name}
                    onChange={(e) => {
                      setStudentForm(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter student name"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    value={studentForm.email}
                    onChange={(e) => {
                      setStudentForm(prev => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-2 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {formErrors.email}
                  </p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 XXXXXXXXXX"
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    value={studentForm.phone}
                    onChange={(e) => {
                      setStudentForm(prev => ({ ...prev, phone: e.target.value }));
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-2 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {formErrors.phone}
                  </p>}
                  <p className="text-xs text-gray-500 mt-2">Format: +91 XXXXXXXXXX</p>
                </div>

                                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                      rows="2"
                      value={studentForm.address}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Type *</label>
                                      <select
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-400"
                    value={studentForm.planType}
                    onChange={(e) => {
                      setStudentForm(prev => ({ ...prev, planType: e.target.value, seatNumber: '' }));
                      if (formErrors.seatNumber) {
                        setFormErrors(prev => ({ ...prev, seatNumber: '' }));
                      }
                    }}
                  >
                                            <option value="half-time">Half Time - ₹500/month ({convertTo12Hour(timingForm.halfTimeStart)} - {convertTo12Hour(timingForm.halfTimeEnd)})</option>
                        <option value="full-time">Full Time - ₹800/month ({convertTo12Hour(timingForm.fullTimeStart)} - {convertTo12Hour(timingForm.fullTimeEnd)})</option>
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Seat Number *</label>
                    <select
                      required
                      className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                        formErrors.seatNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      value={studentForm.seatNumber}
                      onChange={(e) => {
                        setStudentForm(prev => ({ ...prev, seatNumber: e.target.value }));
                        if (formErrors.seatNumber) {
                          setFormErrors(prev => ({ ...prev, seatNumber: '' }));
                        }
                      }}
                    >
                      <option value="">Select Available Seat</option>
                      {getAvailableSeats(studentForm.planType).map(seat => (
                        <option key={seat} value={seat}>{seat}</option>
                      ))}
                    </select>
                    {formErrors.seatNumber && <p className="text-red-500 text-xs mt-2 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {formErrors.seatNumber}
                    </p>}
                    <p className="text-xs text-gray-500 mt-2">
                      Available seats: {getAvailableSeats(studentForm.planType).length}
                    </p>
                  </div>

                  {/* Custom Timing Section */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="useCustomTiming"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        checked={studentForm.useCustomTiming}
                        onChange={(e) => setStudentForm(prev => ({ 
                          ...prev, 
                          useCustomTiming: e.target.checked,
                          customStartTime: e.target.checked ? studentForm.customStartTime || '09:00' : '',
                          customEndTime: e.target.checked ? studentForm.customEndTime || '17:00' : ''
                        }))}
                      />
                      <label htmlFor="useCustomTiming" className="text-sm font-medium text-purple-700">
                        Use Custom Study Timing
                      </label>
                    </div>

                    {studentForm.useCustomTiming && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-purple-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              required={studentForm.useCustomTiming}
                              className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              value={studentForm.customStartTime}
                              onChange={(e) => setStudentForm(prev => ({ ...prev, customStartTime: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-purple-700 mb-1">End Time</label>
                            <input
                              type="time"
                              required={studentForm.useCustomTiming}
                              className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              value={studentForm.customEndTime}
                              onChange={(e) => setStudentForm(prev => ({ ...prev, customEndTime: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        {studentForm.customStartTime && studentForm.customEndTime && (
                          <div className="p-2 bg-white rounded border border-purple-200">
                            <div className="text-xs text-purple-700">
                              <p><strong>Custom Timing:</strong> {convertTo12Hour(studentForm.customStartTime)} - {convertTo12Hour(studentForm.customEndTime)}</p>
                              <p className="text-purple-600 mt-1">
                                This will override the default {studentForm.planType} plan timing
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={studentForm.feesPaid}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, feesPaid: e.target.checked }))}
                    />
                    <span className="ml-2 text-sm text-gray-700">Fees Paid for this month</span>
                  </label>

                  {studentForm.feesPaid && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
                      <select
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={studentForm.paymentMethod}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

                    {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Student Profile</h3>
              <button
                onClick={() => setShowStudentProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Details */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-4 flex items-center">
                    <User className="mr-2" size={20} />
                    Personal Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="mr-1" size={14} />
                        {selectedStudent.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="mr-1" size={14} />
                        {selectedStudent.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900">{selectedStudent.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Join Date</label>
                      <p className="text-gray-900 flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {selectedStudent.joinDate}
                      </p>
                    </div>
                  </div>
                </div>

                                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-lg mb-4 flex items-center">
                    <MapPin className="mr-2" size={20} />
                    Plan Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plan Type</label>
                      <p className="text-gray-900 capitalize">{selectedStudent.planType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Study Hours</label>
                      <p className="text-gray-900 flex items-center">
                        <Clock className="mr-1" size={14} />
                        {getStudentDisplayTiming(selectedStudent)}
                      </p>
                      <div className="mt-1 flex items-center space-x-3">
                        {selectedStudent.useCustomTiming && (
                          <span className="text-purple-600 text-sm font-medium flex items-center">✨ Custom Timing Applied</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            openStudentTimingModal(selectedStudent);
                            setShowStudentProfile(false);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                          title="Manage this student's time slot"
                        >
                          Manage time slot
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Seat Number</label>
                      <p className="text-gray-900 font-mono">{selectedStudent.seatNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Monthly Fee</label>
                      <p className="text-gray-900 flex items-center">
                        <DollarSign className="mr-1" size={14} />
                        ₹{selectedStudent.feeAmount}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedStudent.feesPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedStudent.feesPaid ? 'Fees Paid' : 'Fees Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="lg:col-span-2">
                <div className="bg-white border rounded-lg">
                  <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <h4 className="font-semibold text-lg flex items-center">
                      <History className="mr-2" size={20} />
                      Payment History
                    </h4>
                  </div>
                  <div className="p-4">
                    {selectedStudent.paymentHistory && selectedStudent.paymentHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Payment ID</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Month</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Method</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Notes</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStudent.paymentHistory.map((payment, index) => (
                              <tr key={payment.paymentId || index} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="py-2 text-sm font-mono text-gray-500">#{payment.paymentId || (index + 1)}</td>
                                <td className="py-2 text-sm">{payment.date}</td>
                                <td className="py-2 text-sm font-medium">{payment.month}</td>
                                <td className="py-2 text-sm font-semibold text-green-600">₹{payment.amount}</td>
                                <td className="py-2 text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    payment.method === 'Cash' ? 'bg-green-100 text-green-800' :
                                    payment.method === 'UPI' ? 'bg-blue-100 text-blue-800' :
                                    payment.method === 'Card' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.method}
                                  </span>
                                </td>
                                <td className="py-2 text-sm text-gray-600 max-w-32 truncate" title={payment.notes}>
                                  {payment.notes || '-'}
                                </td>
                                <td className="py-2">
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No payment history available</p>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">₹{selectedStudent.totalPaid}</div>
                          <div className="text-sm text-gray-600">Total Paid</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{selectedStudent.paymentHistory.length}</div>
                          <div className="text-sm text-gray-600">Payments Made</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <strong>Payment History:</strong> Complete record of all payments from {selectedStudent.joinDate} to present
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => {
                          setShowStudentProfile(false);
                          handleEdit(selectedStudent);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <Edit size={16} />
                        <span>Edit Details</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowStudentProfile(false);
                          openStudentTimingModal(selectedStudent);
                        }}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center space-x-2"
                      >
                        ⏰
                        <span>Change Timing</span>
                      </button>
                      
                      <button
                        onClick={() => openPaymentModal(selectedStudent)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2"
                      >
                        <CreditCard size={16} />
                        <span>Record Payment</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Student:</strong> {selectedStudent.name} (Seat: {selectedStudent.seatNumber})
              </p>
              <p className="text-sm text-blue-800">
                <strong>Plan:</strong> {selectedStudent.planType} - ₹{selectedStudent.feeAmount}/month
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this payment..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timing Settings Modal */}
      {showTimingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-lg shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ⏰ Study Timings Settings
              </h3>
              <button
                onClick={() => setShowTimingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleTimingSubmit}>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Full Time Plan Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={timingForm.fullTimeStart}
                        onChange={(e) => setTimingForm(prev => ({ ...prev, fullTimeStart: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">End Time</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={timingForm.fullTimeEnd}
                        onChange={(e) => setTimingForm(prev => ({ ...prev, fullTimeEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Half Time Plan Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={timingForm.halfTimeStart}
                        onChange={(e) => setTimingForm(prev => ({ ...prev, halfTimeStart: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">End Time</label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={timingForm.halfTimeEnd}
                        onChange={(e) => setTimingForm(prev => ({ ...prev, halfTimeEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Current Settings</h4>
                  <div className="text-sm text-yellow-700">
                    <p><strong>Full Time:</strong> {convertTo12Hour(timingForm.fullTimeStart)} - {convertTo12Hour(timingForm.fullTimeEnd)}</p>
                    <p><strong>Half Time:</strong> {convertTo12Hour(timingForm.halfTimeStart)} - {convertTo12Hour(timingForm.halfTimeEnd)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowTimingModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Save Timings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Timing Modal */}
      {showStudentTimingModal && selectedStudentForTiming && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-lg shadow-2xl rounded-2xl bg-white/95 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ⏰ Customize Study Timing
              </h3>
              <button
                onClick={() => setShowStudentTimingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Student Information</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {selectedStudentForTiming.name}</p>
                <p><strong>Current Plan:</strong> {selectedStudentForTiming.planType}</p>
                                        <p><strong>Default Timing:</strong> {
                          selectedStudentForTiming.planType === 'full-time' 
                            ? `${convertTo12Hour(timingForm.fullTimeStart)} - ${convertTo12Hour(timingForm.fullTimeEnd)}`
                            : `${convertTo12Hour(timingForm.halfTimeStart)} - ${convertTo12Hour(timingForm.halfTimeEnd)}`
                        }</p>
              </div>
            </div>

            <form onSubmit={handleStudentTimingSubmit}>
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="useCustomTiming"
                    checked={studentTimingForm.useCustomTiming}
                    onChange={(e) => setStudentTimingForm(prev => ({ 
                      ...prev, 
                      useCustomTiming: e.target.checked,
                      customStartTime: e.target.checked ? studentTimingForm.customStartTime || '09:00' : '',
                      customEndTime: e.target.checked ? studentTimingForm.customEndTime || '17:00' : ''
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useCustomTiming" className="text-sm font-medium text-gray-700">
                    Use Custom Study Timing
                  </label>
                </div>

                {studentTimingForm.useCustomTiming && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-3">Custom Timing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          required={studentTimingForm.useCustomTiming}
                          className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={studentTimingForm.customStartTime}
                          onChange={(e) => setStudentTimingForm(prev => ({ ...prev, customStartTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-2">End Time</label>
                        <input
                          type="time"
                          required={studentTimingForm.useCustomTiming}
                          className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={studentTimingForm.customEndTime}
                          onChange={(e) => setStudentTimingForm(prev => ({ ...prev, customEndTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                                            {studentTimingForm.customStartTime && studentTimingForm.customEndTime && (
                          <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                            <div className="text-sm text-purple-700">
                              <p><strong>Custom Timing:</strong> {convertTo12Hour(studentTimingForm.customStartTime)} - {convertTo12Hour(studentTimingForm.customEndTime)}</p>
                              <p className="text-xs text-purple-600 mt-1">
                                This will override the default {selectedStudentForTiming.planType} plan timing
                              </p>
                            </div>
                          </div>
                        )}
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Timing Summary</h4>
                  <div className="text-sm text-blue-700">
                                            <p><strong>Current Display:</strong> {getStudentDisplayTiming(selectedStudentForTiming)}</p>
                        <p><strong>After Update:</strong> {
                          studentTimingForm.useCustomTiming && studentTimingForm.customStartTime && studentTimingForm.customEndTime
                            ? `${convertTo12Hour(studentTimingForm.customStartTime)} - ${convertTo12Hour(studentTimingForm.customEndTime)} (Custom)`
                            : selectedStudentForTiming.planType === 'full-time'
                              ? `${convertTo12Hour(timingForm.fullTimeStart)} - ${convertTo12Hour(timingForm.fullTimeEnd)}`
                              : `${convertTo12Hour(timingForm.halfTimeStart)} - ${convertTo12Hour(timingForm.halfTimeEnd)}`
                        }</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowStudentTimingModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Update Timing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyLibraryManagementSystem;
