# SRCS Volunteer Management System

A comprehensive web-based volunteer management application for the Sudanese Red Crescent Society (SRCS), built with React, TypeScript, Tailwind CSS, and Supabase.

## 🎯 Features

### Authentication & User Management
- ✅ Email/password authentication via Supabase Auth
- ✅ Role-based access control (Volunteer/Admin)
- ✅ User profile management
- ✅ Secure session management

### Volunteer Management
- ✅ Volunteer registration and profile creation
- ✅ Personal information management (name, phone, location, skills)
- ✅ Skills and expertise tracking
- ✅ Bio and motivation capture

### Event Management
- ✅ Event creation and management (Admin only)
- ✅ Event browsing and search
- ✅ Event participation (join/leave)
- ✅ Event filtering (upcoming, all, joined)
- ✅ Real-time participant tracking

### Admin Dashboard
- ✅ Comprehensive admin analytics
- ✅ Volunteer activity tracking
- ✅ Event performance reports
- ✅ Participation statistics
- ✅ CSV export functionality

### Notifications
- ✅ In-app notification system
- ✅ Real-time notifications via Supabase
- ✅ Event announcements
- ✅ Activity updates

### Mobile-First Design
- ✅ Responsive design for all screen sizes
- ✅ Mobile-optimized navigation
- ✅ Touch-friendly interface
- ✅ Progressive Web App ready

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Date Handling**: date-fns
- **Routing**: React Router DOM

## 📱 User Interface

### Color Scheme
- **Primary Red**: #D32F2F (SRCS Red)
- **Dark Red**: #B71C1C 
- **Light Gray**: #F5F5F5
- **White**: #FFFFFF

### Navigation
- Bottom navigation bar with 4 sections:
  - 🏠 Home (Dashboard)
  - 📅 Events (Browse & Join)
  - 👤 Profile (Manage Profile)
  - ⚙️ Admin (Admin Only)

## 🗄️ Database Schema

### Tables
- `users` - User accounts with roles
- `volunteers` - Volunteer profile information
- `events` - Event details and management
- `event_participants` - Event participation tracking
- `notifications` - In-app notifications

### Key Features
- Row Level Security (RLS) for data protection
- Real-time subscriptions for notifications
- Automatic timestamp management
- Foreign key relationships with cascading deletes

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd srcs-volunteer-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Run the SQL script to create all tables and policies

#### Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase project details:
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the Development Server
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 👥 Demo Accounts

For testing purposes, you can create demo accounts:

### Admin Account
- Email: admin@srcs.org
- Password: admin123
- Role: Administrator

### Volunteer Account  
- Email: volunteer@srcs.org
- Password: volunteer123
- Role: Volunteer

## 📋 Usage Guide

### For Volunteers
1. **Register**: Create an account with email/password
2. **Complete Profile**: Add personal info, location, and skills
3. **Browse Events**: View upcoming volunteer opportunities
4. **Join Events**: Sign up for events you're interested in
5. **Track Participation**: View your volunteer history

### For Administrators
1. **Create Events**: Add new volunteer opportunities
2. **Manage Events**: Edit event details and track participation
3. **View Reports**: Access detailed analytics and reports
4. **Export Data**: Download participation data as CSV
5. **Monitor Activity**: Track volunteer engagement

## 🔒 Security Features

- **Authentication**: Secure email/password via Supabase Auth
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security (RLS) policies
- **Session Management**: Automatic session handling
- **Input Validation**: Client and server-side validation

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📟 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🔔 Real-time Features

- **Live Notifications**: Instant notification delivery
- **Event Updates**: Real-time event participation updates
- **Activity Tracking**: Live volunteer activity monitoring

## 📊 Admin Analytics

The admin dashboard provides:
- Total volunteer count
- Event participation statistics
- Volunteer activity reports
- Event performance metrics
- Exportable CSV reports

## 🌐 PWA Features

The app is Progressive Web App ready with:
- Service worker support
- Offline capability preparation
- Mobile app-like experience
- Install prompts on mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is developed for the Sudanese Red Crescent Society (SRCS) volunteer management purposes.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the database schema
- Test with demo accounts
- Check Supabase logs for backend issues

## 🔄 Future Enhancements

Potential future features:
- Push notifications via Firebase
- Calendar integration
- SMS notifications
- Multi-language support
- Advanced reporting
- Event categories
- Volunteer certifications
- Time tracking
- Photo uploads
- Chat system

---

Built with ❤️ for humanitarian work and community service.