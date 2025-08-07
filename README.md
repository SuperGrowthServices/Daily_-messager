# WhatsApp Messaging App

A React-based front-end application for managing automated WhatsApp messaging campaigns. Built with React, Tailwind CSS, and modern web technologies.

## Features

### Dashboard
- Overview of active campaigns
- Key statistics and metrics
- Quick access to campaign management

### Campaign Management
- View all campaigns with search and filtering
- Campaign status tracking (Active, Paused, Draft)
- Edit, duplicate, and delete campaigns
- Real-time campaign performance metrics

### Campaign Creation
- Multi-step wizard for creating campaigns
- Audience selection (All, Premium, New, Inactive users)
- Message type selection with templates
- Timezone-sensitive scheduling
- Recurring patterns (Daily or specific days of the week)
- Time window configuration (e.g., 9 AM - 10 AM)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── Sidebar.jsx          # Navigation sidebar
├── pages/
│   ├── Dashboard.jsx        # Dashboard overview
│   ├── Campaigns.jsx        # Campaign list and management
│   └── CreateCampaign.jsx   # Campaign creation wizard
├── App.jsx                  # Main app component with routing
├── main.jsx                 # App entry point
└── index.css               # Global styles and Tailwind imports
```

## Key Features

### Audience Selection
- **All Users**: Send to entire user base
- **Premium Users**: Target premium subscribers
- **New Users**: Recently registered users
- **Inactive Users**: Users who haven't been active recently

### Scheduling Options
- **Daily**: Send every day at specified time
- **Weekly**: Send on specific days of the week
- **Time Windows**: Configure start and end times
- **Timezone Support**: Full timezone awareness

### Message Types
- Welcome messages for new users
- Newsletter updates
- Promotional offers
- Reminder notifications
- Custom messages

## Mock Data

The application currently uses mock data to demonstrate functionality. In a real implementation, this would be replaced with API calls to your backend service.

## Styling

The application uses Tailwind CSS for styling with a custom color scheme:
- Primary colors for main actions
- WhatsApp green for success states
- Responsive design for all screen sizes

## Next Steps

1. **Backend Integration**: Connect to your WhatsApp API backend
2. **User Authentication**: Add login/signup functionality
3. **Real-time Updates**: Implement WebSocket connections for live campaign status
4. **Analytics**: Add detailed campaign performance metrics
5. **Message Templates**: Expand message type options
6. **User Management**: Add user creation and management features

## Technologies Used

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Vite**: Fast build tool and dev server

## License

This project is for demonstration purposes. Customize as needed for your specific use case. 