// Database utility for Employee Payment Tracking System
// Currently uses localStorage, can be upgraded to real database later

const DB_KEYS = {
  EMPLOYEES: 'payroll_employees',
  DEPARTMENTS: 'payroll_departments',
  PAYMENTS: 'payroll_payments',
  SETTINGS: 'payroll_settings'
};

// Initialize database with default data
export const initializeDatabase = () => {
  // Check if database is already initialized
  if (!localStorage.getItem(DB_KEYS.EMPLOYEES)) {
    // Initialize with sample data
    const initialEmployees = [
      {
        id: 1,
        employeeId: "EMP001",
        name: "John Smith",
        email: "john.smith@company.com",
        phone: "+1 555-0101",
        department: "Engineering",
        position: "Senior Developer",
        baseSalary: 5000,
        joiningDate: "2023-01-15",
        status: "Active",
        bankAccount: "****1234",
        address: "123 Main St, New York, NY",
        paymentHistory: [
          { 
            id: 1, 
            date: "2024-01-31", 
            month: "January 2024",
            baseSalary: 5000, 
            deductions: 500,
            bonuses: 1000,
            netSalary: 5500,
            method: "Bank Transfer", 
            status: "Paid",
            notes: "Regular monthly salary",
            paymentId: 1001
          },
          { 
            id: 2, 
            date: "2024-02-29", 
            month: "February 2024",
            baseSalary: 5000, 
            deductions: 500,
            bonuses: 0,
            netSalary: 4500,
            method: "Bank Transfer", 
            status: "Paid",
            notes: "Regular monthly salary",
            paymentId: 1002
          }
        ],
        totalPaid: 10000,
        lastPaymentDate: "2024-02-29",
        paymentStatus: "Paid"
      },
      {
        id: 2,
        employeeId: "EMP002",
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        phone: "+1 555-0102",
        department: "Marketing",
        position: "Marketing Manager",
        baseSalary: 4500,
        joiningDate: "2023-03-20",
        status: "Active",
        bankAccount: "****5678",
        address: "456 Oak Ave, Los Angeles, CA",
        paymentHistory: [
          { 
            id: 1, 
            date: "2024-01-31", 
            month: "January 2024",
            baseSalary: 4500, 
            deductions: 450,
            bonuses: 500,
            netSalary: 4550,
            method: "Bank Transfer", 
            status: "Paid",
            notes: "Regular monthly salary + performance bonus",
            paymentId: 1003
          }
        ],
        totalPaid: 4550,
        lastPaymentDate: "2024-01-31",
        paymentStatus: "Pending"
      },
      {
        id: 3,
        employeeId: "EMP003",
        name: "Michael Chen",
        email: "michael.chen@company.com",
        phone: "+1 555-0103",
        department: "Sales",
        position: "Sales Executive",
        baseSalary: 4000,
        joiningDate: "2023-06-10",
        status: "Active",
        bankAccount: "****9012",
        address: "789 Pine Rd, Chicago, IL",
        paymentHistory: [
          { 
            id: 1, 
            date: "2024-01-31", 
            month: "January 2024",
            baseSalary: 4000, 
            deductions: 400,
            bonuses: 2000,
            netSalary: 5600,
            method: "Bank Transfer", 
            status: "Paid",
            notes: "Regular salary + sales commission",
            paymentId: 1004
          },
          { 
            id: 2, 
            date: "2024-02-29", 
            month: "February 2024",
            baseSalary: 4000, 
            deductions: 400,
            bonuses: 1500,
            netSalary: 5100,
            method: "Bank Transfer", 
            status: "Paid",
            notes: "Regular salary + sales commission",
            paymentId: 1005
          }
        ],
        totalPaid: 10700,
        lastPaymentDate: "2024-02-29",
        paymentStatus: "Paid"
      }
    ];

    const initialDepartments = [
      { id: 1, name: "Engineering", employeeCount: 1 },
      { id: 2, name: "Marketing", employeeCount: 1 },
      { id: 3, name: "Sales", employeeCount: 1 },
      { id: 4, name: "Human Resources", employeeCount: 0 },
      { id: 5, name: "Finance", employeeCount: 0 }
    ];

    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(initialEmployees));
    localStorage.setItem(DB_KEYS.DEPARTMENTS, JSON.stringify(initialDepartments));
    
    console.log('Database initialized with sample employee data');
  }
};

// Employee operations
export const getAllEmployees = () => {
  try {
    const employees = localStorage.getItem(DB_KEYS.EMPLOYEES);
    return employees ? JSON.parse(employees) : [];
  } catch (error) {
    console.error('Error loading employees:', error);
    return [];
  }
};

export const saveEmployees = (employees) => {
  try {
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
    return true;
  } catch (error) {
    console.error('Error saving employees:', error);
    return false;
  }
};

export const addEmployee = (employee) => {
  try {
    const employees = getAllEmployees();
    const newEmployee = { 
      ...employee, 
      id: Math.max(...employees.map(e => e.id), 0) + 1,
      paymentHistory: employee.paymentHistory || [],
      totalPaid: employee.totalPaid || 0
    };
    employees.push(newEmployee);
    saveEmployees(employees);
    
    // Update department count
    updateDepartmentCount(employee.department, 1);
    
    return newEmployee;
  } catch (error) {
    console.error('Error adding employee:', error);
    return null;
  }
};

export const updateEmployee = (updatedEmployee) => {
  try {
    const employees = getAllEmployees();
    const index = employees.findIndex(e => e.id === updatedEmployee.id);
    if (index !== -1) {
      const oldDepartment = employees[index].department;
      employees[index] = updatedEmployee;
      saveEmployees(employees);
      
      // Update department counts if department changed
      if (oldDepartment !== updatedEmployee.department) {
        updateDepartmentCount(oldDepartment, -1);
        updateDepartmentCount(updatedEmployee.department, 1);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating employee:', error);
    return false;
  }
};

export const deleteEmployee = (employeeId) => {
  try {
    const employees = getAllEmployees();
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      updateDepartmentCount(employee.department, -1);
    }
    const filteredEmployees = employees.filter(e => e.id !== employeeId);
    saveEmployees(filteredEmployees);
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
};

// Department operations
export const getAllDepartments = () => {
  try {
    const departments = localStorage.getItem(DB_KEYS.DEPARTMENTS);
    return departments ? JSON.parse(departments) : [];
  } catch (error) {
    console.error('Error loading departments:', error);
    return [];
  }
};

export const saveDepartments = (departments) => {
  try {
    localStorage.setItem(DB_KEYS.DEPARTMENTS, JSON.stringify(departments));
    return true;
  } catch (error) {
    console.error('Error saving departments:', error);
    return false;
  }
};

export const updateDepartmentCount = (departmentName, change) => {
  try {
    const departments = getAllDepartments();
    const dept = departments.find(d => d.name === departmentName);
    if (dept) {
      dept.employeeCount += change;
      saveDepartments(departments);
    }
    return true;
  } catch (error) {
    console.error('Error updating department count:', error);
    return false;
  }
};

// Payment operations
export const addPayment = (employeeId, payment) => {
  try {
    const employees = getAllEmployees();
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      const newPayment = {
        ...payment,
        id: employee.paymentHistory.length + 1,
        paymentId: payment.paymentId || Date.now(),
        timestamp: new Date().toISOString()
      };
      
      employee.paymentHistory.push(newPayment);
      employee.totalPaid += payment.netSalary;
      employee.paymentStatus = "Paid";
      employee.lastPaymentDate = payment.date;
      saveEmployees(employees);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding payment:', error);
    return false;
  }
};

export const calculateNetSalary = (baseSalary, deductions, bonuses) => {
  return baseSalary - deductions + bonuses;
};

// Backup and restore
export const exportData = () => {
  try {
    const data = {
      employees: getAllEmployees(),
      departments: getAllDepartments(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    if (data.employees && data.departments) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(data.employees));
      localStorage.setItem(DB_KEYS.DEPARTMENTS, JSON.stringify(data.departments));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Clear all data
export const clearDatabase = () => {
  try {
    localStorage.removeItem(DB_KEYS.EMPLOYEES);
    localStorage.removeItem(DB_KEYS.DEPARTMENTS);
    localStorage.removeItem(DB_KEYS.PAYMENTS);
    localStorage.removeItem(DB_KEYS.SETTINGS);
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
};

// Database statistics
export const getDatabaseStats = () => {
  try {
    const employees = getAllEmployees();
    const departments = getAllDepartments();
    
    // Calculate payment statistics
    const allPayments = employees.flatMap(e => e.paymentHistory || []);
    const totalPayments = allPayments.length;
    const totalPaid = employees.reduce((sum, e) => sum + e.totalPaid, 0);
    
    // Monthly payment statistics
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const thisMonthPayments = allPayments.filter(p => p.month === currentMonth);
    const thisMonthPaid = thisMonthPayments.reduce((sum, p) => sum + p.netSalary, 0);
    
    // Pending payments
    const pendingEmployees = employees.filter(e => e.paymentStatus === 'Pending');
    const pendingAmount = pendingEmployees.reduce((sum, e) => sum + e.baseSalary, 0);
    
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'Active').length,
      totalDepartments: departments.length,
      totalPaid,
      totalPayments,
      thisMonthPaid,
      thisMonthPayments: thisMonthPayments.length,
      pendingPayments: pendingEmployees.length,
      pendingAmount,
      averageSalary: employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + e.baseSalary, 0) / employees.length) : 0
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

// Generate unique employee ID
export const generateEmployeeId = () => {
  const employees = getAllEmployees();
  const maxId = employees.reduce((max, e) => {
    const num = parseInt(e.employeeId.replace('EMP', ''));
    return num > max ? num : max;
  }, 0);
  return `EMP${String(maxId + 1).padStart(3, '0')}`;
};
