import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users, DollarSign, Building2, Eye, X, Calendar, History, Phone, Mail, User, CreditCard, AlertCircle, CheckCircle, Database, Download, Upload, Briefcase, TrendingUp } from 'lucide-react';
import { 
  initializeDatabase, 
  getAllEmployees, 
  saveEmployees, 
  addEmployee as dbAddEmployee, 
  updateEmployee as dbUpdateEmployee, 
  deleteEmployee as dbDeleteEmployee,
  getAllDepartments,
  addPayment as dbAddPayment,
  calculateNetSalary,
  exportData,
  importData,
  getDatabaseStats,
  generateEmployeeId
} from './database';

const EmployeePaymentTracker = () => {
  // Initialize database and load data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    baseSalary: '',
    bankAccount: '',
    address: '',
    paymentStatus: 'Pending'
  });

  const [paymentForm, setPaymentForm] = useState({
    month: '',
    baseSalary: '',
    deductions: '0',
    bonuses: '0',
    netSalary: '0',
    method: 'Bank Transfer',
    notes: ''
  });

  // Load data from database on component mount
  useEffect(() => {
    initializeDatabase();
    const loadedEmployees = getAllEmployees();
    const loadedDepartments = getAllDepartments();
    setEmployees(loadedEmployees);
    setDepartments(loadedDepartments);
  }, []);

  // Calculate net salary when payment form changes
  useEffect(() => {
    if (paymentForm.baseSalary) {
      const base = parseFloat(paymentForm.baseSalary) || 0;
      const deduct = parseFloat(paymentForm.deductions) || 0;
      const bonus = parseFloat(paymentForm.bonuses) || 0;
      const net = calculateNetSalary(base, deduct, bonus);
      setPaymentForm(prev => ({ ...prev, netSalary: net.toString() }));
    }
  }, [paymentForm.baseSalary, paymentForm.deductions, paymentForm.bonuses]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const resetForm = () => {
    setEmployeeForm({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      baseSalary: '',
      bankAccount: '',
      address: '',
      paymentStatus: 'Pending'
    });
    setEditingEmployee(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!employeeForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!employeeForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(employeeForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!employeeForm.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    if (!employeeForm.department) {
      errors.department = 'Department is required';
    }

    if (!employeeForm.position.trim()) {
      errors.position = 'Position is required';
    }

    if (!employeeForm.baseSalary || parseFloat(employeeForm.baseSalary) <= 0) {
      errors.baseSalary = 'Valid salary is required';
    }

    // Check for duplicate email (except when editing)
    const existingEmployee = employees.find(e => 
      e.id !== (editingEmployee?.id || 0) && 
      e.email === employeeForm.email
    );
    
    if (existingEmployee) {
      errors.email = 'Email already exists';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = (e) => {
    if (e) {
      e.preventDefault();
    }

    setFormErrors({});
    
    if (!validateForm()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee = {
          ...editingEmployee,
          name: employeeForm.name,
          email: employeeForm.email,
          phone: employeeForm.phone,
          department: employeeForm.department,
          position: employeeForm.position,
          baseSalary: parseFloat(employeeForm.baseSalary),
          bankAccount: employeeForm.bankAccount,
          address: employeeForm.address,
          paymentStatus: employeeForm.paymentStatus
        };
        
        if (dbUpdateEmployee(updatedEmployee)) {
          setEmployees(getAllEmployees());
          showNotification('Employee updated successfully!', 'success');
        } else {
          showNotification('Error updating employee. Please try again.', 'error');
        }
      } else {
        // Add new employee
        const newEmployee = {
          employeeId: generateEmployeeId(),
          name: employeeForm.name,
          email: employeeForm.email,
          phone: employeeForm.phone,
          department: employeeForm.department,
          position: employeeForm.position,
          baseSalary: parseFloat(employeeForm.baseSalary),
          bankAccount: employeeForm.bankAccount,
          address: employeeForm.address,
          joiningDate: currentDate,
          status: 'Active',
          paymentStatus: 'Pending',
          paymentHistory: [],
          totalPaid: 0,
          lastPaymentDate: null
        };
        
        const addedEmployee = dbAddEmployee(newEmployee);
        if (addedEmployee) {
          setEmployees(getAllEmployees());
          showNotification('Employee added successfully!', 'success');
        } else {
          showNotification('Error adding employee. Please try again.', 'error');
        }
      }
      
      setShowModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Error adding/updating employee:', error);
      showNotification('Error saving employee. Please try again.', 'error');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      baseSalary: employee.baseSalary.toString(),
      bankAccount: employee.bankAccount || '',
      address: employee.address || '',
      paymentStatus: employee.paymentStatus
    });
    setShowModal(true);
  };

  const handleDelete = (employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      if (dbDeleteEmployee(employee.id)) {
        setEmployees(getAllEmployees());
        
        if (selectedEmployee && selectedEmployee.id === employee.id) {
          setShowEmployeeProfile(false);
          setSelectedEmployee(null);
        }
        
        showNotification('Employee deleted successfully!', 'success');
      } else {
        showNotification('Error deleting employee. Please try again.', 'error');
      }
    }
  };

  const viewEmployeeProfile = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeProfile(true);
  };

  const openPaymentModal = (employee) => {
    setSelectedEmployee(employee);
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setPaymentForm({
      month: currentMonth,
      baseSalary: employee.baseSalary.toString(),
      deductions: '0',
      bonuses: '0',
      netSalary: employee.baseSalary.toString(),
      method: 'Bank Transfer',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    const netSalary = parseFloat(paymentForm.netSalary);
    if (!paymentForm.month || netSalary <= 0) {
      showNotification('Please enter valid payment details', 'error');
      return;
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const payment = {
      date: currentDate,
      month: paymentForm.month,
      baseSalary: parseFloat(paymentForm.baseSalary),
      deductions: parseFloat(paymentForm.deductions),
      bonuses: parseFloat(paymentForm.bonuses),
      netSalary: netSalary,
      method: paymentForm.method,
      status: 'Paid',
      notes: paymentForm.notes,
      paymentId: Date.now()
    };
    
    if (dbAddPayment(selectedEmployee.id, payment)) {
      setEmployees(getAllEmployees());
      
      if (selectedEmployee) {
        setSelectedEmployee(getAllEmployees().find(e => e.id === selectedEmployee.id));
      }
      
      showNotification('Payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      setPaymentForm({
        month: '',
        baseSalary: '',
        deductions: '0',
        bonuses: '0',
        netSalary: '0',
        method: 'Bank Transfer',
        notes: ''
      });
    } else {
      showNotification('Error recording payment. Please try again.', 'error');
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getDatabaseStats() || {
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    totalPaid: 0,
    thisMonthPaid: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    averageSalary: 0
  };

  const renderDepartmentView = () => {
    const deptGroups = {};
    employees.forEach(emp => {
      if (!deptGroups[emp.department]) {
        deptGroups[emp.department] = [];
      }
      deptGroups[emp.department].push(emp);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(deptGroups).map(([dept, emps]) => (
          <div key={dept} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="mr-2 text-blue-600" size={20} />
                {dept}
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {emps.length} {emps.length === 1 ? 'Employee' : 'Employees'}
              </span>
            </div>
            <div className="space-y-2">
              {emps.map(emp => (
                <div 
                  key={emp.id} 
                  className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => viewEmployeeProfile(emp)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.position}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      emp.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {emp.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Employee Payment Tracker</h1>
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
                onClick={() => setCurrentView('employees')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'employees'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setCurrentView('departments')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'departments'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Departments
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
            </nav>
          </div>
        </div>
      </header>

      <main className="modern-container py-8">
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                        <dd className="text-lg font-medium text-gray-900">${stats.totalPaid.toLocaleString()}</dd>
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
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingPayments}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalDepartments}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">This Month Paid</span>
                    <span className="text-lg font-bold text-blue-600">${stats.thisMonthPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Average Salary</span>
                    <span className="text-lg font-bold text-green-600">${stats.averageSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm font-medium">Pending Amount</span>
                    <span className="text-lg font-bold text-red-600">${stats.pendingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add New Employee</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('employees')}
                    className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 flex items-center justify-center space-x-2"
                  >
                    <Users size={20} />
                    <span>View All Employees</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('departments')}
                    className="w-full bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 flex items-center justify-center space-x-2"
                  >
                    <Building2 size={20} />
                    <span>View Departments</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Employees with Pending Payments */}
            {stats.pendingPayments > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    Employees with Pending Payments
                  </h3>
                  <div className="space-y-3">
                    {employees.filter(e => e.paymentStatus === 'Pending').map(employee => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-gray-600">{employee.department} | {employee.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-red-600">${employee.baseSalary.toLocaleString()}</span>
                          <button
                            onClick={() => openPaymentModal(employee)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Pay Now
                          </button>
                          <button
                            onClick={() => viewEmployeeProfile(employee)}
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
          </div>
        )}

        {/* Employees View */}
        {currentView === 'employees' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add Employee</span>
              </button>
            </div>

            {/* Search */}
            <div className="search-container">
              <Search className="search-icon h-4 w-4" />
              <input
                type="text"
                placeholder="Search employees by name, email, ID, department or position..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Employees Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department & Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.email}</div>
                          <div className="text-sm text-gray-500">{employee.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.department}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${employee.baseSalary.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">per month</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              employee.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewEmployeeProfile(employee)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Profile"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openPaymentModal(employee)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Record Payment"
                            >
                              <CreditCard size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(employee)}
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
              
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No employees found matching your search.' : 'No employees registered yet.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Departments View */}
        {currentView === 'departments' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Departments</h2>
            {renderDepartmentView()}
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
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <span className="font-semibold">{stats.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Employees:</span>
                    <span className="font-semibold">{stats.activeEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Departments:</span>
                    <span className="font-semibold">{stats.totalDepartments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-semibold text-green-600">${stats.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month Paid:</span>
                    <span className="font-semibold text-green-600">${stats.thisMonthPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Payments:</span>
                    <span className="font-semibold text-red-600">{stats.pendingPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Salary:</span>
                    <span className="font-semibold text-blue-600">${stats.averageSalary.toLocaleString()}</span>
                  </div>
                </div>
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
                        a.download = `employee-payroll-backup-${new Date().toISOString().split('T')[0]}.json`;
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
                              setEmployees(getAllEmployees());
                              setDepartments(getAllDepartments());
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
                        setEmployees([]);
                        setDepartments([]);
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
      </main>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
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

            <form onSubmit={handleAddEmployee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.name}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter employee name"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.email}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.phone}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, phone: e.target.value }));
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="Enter phone number"
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department *</label>
                  <select
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.department}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, department: e.target.value }));
                      if (formErrors.department) {
                        setFormErrors(prev => ({ ...prev, department: '' }));
                      }
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                  {formErrors.department && <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Position *</label>
                  <input
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.position ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.position}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, position: e.target.value }));
                      if (formErrors.position) {
                        setFormErrors(prev => ({ ...prev, position: '' }));
                      }
                    }}
                    placeholder="Enter position/title"
                  />
                  {formErrors.position && <p className="text-red-500 text-xs mt-1">{formErrors.position}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Salary ($/month) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.baseSalary ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={employeeForm.baseSalary}
                    onChange={(e) => {
                      setEmployeeForm(prev => ({ ...prev, baseSalary: e.target.value }));
                      if (formErrors.baseSalary) {
                        setFormErrors(prev => ({ ...prev, baseSalary: '' }));
                      }
                    }}
                    placeholder="Enter base salary"
                  />
                  {formErrors.baseSalary && <p className="text-red-500 text-xs mt-1">{formErrors.baseSalary}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={employeeForm.bankAccount}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                    placeholder="Enter bank account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    value={employeeForm.address}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full address"
                  />
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
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {showEmployeeProfile && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Employee Profile</h3>
              <button
                onClick={() => setShowEmployeeProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employee Details */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-4 flex items-center">
                    <User className="mr-2" size={20} />
                    Personal Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employee ID</label>
                      <p className="text-gray-900 font-mono">{selectedEmployee.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">{selectedEmployee.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="mr-1" size={14} />
                        {selectedEmployee.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="mr-1" size={14} />
                        {selectedEmployee.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900">{selectedEmployee.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Joining Date</label>
                      <p className="text-gray-900 flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {selectedEmployee.joiningDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-lg mb-4 flex items-center">
                    <Briefcase className="mr-2" size={20} />
                    Employment Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Position</label>
                      <p className="text-gray-900">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Base Salary</label>
                      <p className="text-gray-900 flex items-center">
                        <DollarSign className="mr-1" size={14} />
                        ${selectedEmployee.baseSalary.toLocaleString()}/month
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bank Account</label>
                      <p className="text-gray-900">{selectedEmployee.bankAccount || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedEmployee.paymentStatus === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedEmployee.paymentStatus}
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
                    {selectedEmployee.paymentHistory && selectedEmployee.paymentHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Month</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Base</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Deductions</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Bonuses</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Net Salary</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmployee.paymentHistory.map((payment, index) => (
                              <tr key={payment.paymentId || index} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="py-2 text-sm">{payment.date}</td>
                                <td className="py-2 text-sm font-medium">{payment.month}</td>
                                <td className="py-2 text-sm">${payment.baseSalary.toLocaleString()}</td>
                                <td className="py-2 text-sm text-red-600">-${payment.deductions.toLocaleString()}</td>
                                <td className="py-2 text-sm text-green-600">+${payment.bonuses.toLocaleString()}</td>
                                <td className="py-2 text-sm font-semibold text-blue-600">${payment.netSalary.toLocaleString()}</td>
                                <td className="py-2 text-sm">
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    {payment.method}
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
                          <div className="text-2xl font-bold text-green-600">${selectedEmployee.totalPaid.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Total Paid</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{selectedEmployee.paymentHistory.length}</div>
                          <div className="text-sm text-gray-600">Payments Made</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => {
                          setShowEmployeeProfile(false);
                          handleEdit(selectedEmployee);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <Edit size={16} />
                        <span>Edit Details</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowEmployeeProfile(false);
                          openPaymentModal(selectedEmployee);
                        }}
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
      {showPaymentModal && selectedEmployee && (
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
                <strong>Employee:</strong> {selectedEmployee.name} ({selectedEmployee.employeeId})
              </p>
              <p className="text-sm text-blue-800">
                <strong>Department:</strong> {selectedEmployee.department} | {selectedEmployee.position}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month/Period *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, month: e.target.value }))}
                    placeholder="e.g., January 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.baseSalary}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, baseSalary: e.target.value }))}
                    placeholder="Enter base salary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.deductions}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, deductions: e.target.value }))}
                    placeholder="Enter deductions (tax, insurance, etc.)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonuses ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.bonuses}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, bonuses: e.target.value }))}
                    placeholder="Enter bonuses"
                  />
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-1">Net Salary</label>
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(paymentForm.netSalary || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Base ({paymentForm.baseSalary || 0}) - Deductions ({paymentForm.deductions || 0}) + Bonuses ({paymentForm.bonuses || 0})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="UPI">UPI</option>
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
    </div>
  );
};

export default EmployeePaymentTracker;
