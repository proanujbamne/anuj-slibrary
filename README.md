# Anuj's Library Management System

A modern, responsive web application for managing library seating, student registrations, and fee collections. Built with React and Vite.

## 🚀 Features

- **Student Management**: Add, edit, and delete student records
- **Seat Allocation**: Visual seat map with 80 available seats
- **Fee Management**: Track payments and pending fees
- **Dashboard**: Real-time statistics and overview
- **Responsive Design**: Works on desktop and mobile devices
- **Data Export/Import**: Backup and restore functionality
- **Search & Filter**: Find students quickly

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Local Storage (with SQL schema ready for production)
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/proanujbamne/anujs-library.git
   cd anujs-library
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Usage

### Dashboard
- View total students, occupied seats, and pending fees
- Quick access to recent activities
- Plan distribution overview

### Students
- Add new students with contact information
- Assign seats and plan types
- Track fee payments
- Search and filter students

### Seat Map
- Visual representation of all 80 seats
- Color-coded availability status
- Click on occupied seats to view student details

### Database Management
- Export/import data for backup
- View database statistics
- Clear data when needed

## 🗄️ Database Schema

The application includes a complete SQL schema for production deployment:

- **Students Table**: Student information and details
- **Payment History**: Complete payment records
- **Seats Table**: Seat allocation and status

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 🌐 Deployment

### GitHub Pages
1. Build the project: `npm run build`
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Set source to `/docs` or deploy from main branch

### Netlify/Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

## 📊 Features in Detail

### Student Registration
- Name, email, phone validation
- Address and contact details
- Plan selection (Full-time: ₹800/month, Half-time: ₹500/month)
- Seat assignment with availability check

### Fee Management
- Monthly fee tracking
- Payment history with timestamps
- Multiple payment methods (Cash, UPI, Card, Bank Transfer)
- Automatic fee status updates

### Seat Management
- 80 total seats available
- Real-time occupancy tracking
- Visual seat map interface
- Click to view student details

## 🔧 Configuration

The application uses local storage by default. For production, you can:

1. Replace the database functions in `database.js`
2. Implement the provided SQL schema
3. Connect to a real database (MySQL, PostgreSQL, etc.)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please open an issue on GitHub.

---

**Built with ❤️ using React and Vite**
