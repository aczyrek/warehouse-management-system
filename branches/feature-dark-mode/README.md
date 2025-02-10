# WareFlow - Warehouse Management System

WareFlow is a modern, full-featured warehouse management system built with React, TypeScript, and Supabase. It provides a comprehensive solution for managing inventory, tracking stock levels, and generating reports.

![WareFlow Dashboard](https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000)

## Live Demo

Check out the live demo: [WareFlow Demo](https://stunning-queijadas-605806.netlify.app)

## Features

### 🏠 Dashboard
- Real-time overview of inventory statistics
- Low stock alerts
- Recent activity tracking
- Key performance indicators

### 📦 Inventory Management
- Add, update, and track inventory items
- Automatic low stock notifications
- Batch import/export capabilities
- Advanced filtering and search
- SKU and barcode management

### 📊 Reports & Analytics
- Comprehensive inventory reports
- Stock level analysis
- Activity logs
- Export data to Excel

### 🔄 Import/Export
- Excel file support
- Bulk data operations
- Data validation
- Template-based imports

### ⚙️ Settings & Configuration
- User profile management
- Company settings
- Notification preferences
- Security settings

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide Icons
  - React Hot Toast

- **Backend:**
  - Supabase
  - PostgreSQL
  - Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wareflow.git
   cd wareflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [Supabase](https://supabase.com/)