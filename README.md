# Hotel Booking Frontend

This is the React frontend for the Hotel Booking MERN stack project.

## Features
- User registration and login
- Room listing and details
- Booking flow (with payment and COD)
- User reviews (add, view)
- Profile management
- Responsive UI


## Getting Started
1. Install dependencies:
	```bash
	npm install
	```
2. Start the development server:
	```bash
	npm start
	```
3. The app runs on `http://localhost:3000` by default.

## Deployment
To build the app for production:
```bash
npm run build
```
This will create a `build/` folder with optimized static files.

You can deploy the contents of the `build/` folder to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

For more details, see the official React deployment guide: [https://create-react-app.dev/docs/deployment/](https://create-react-app.dev/docs/deployment/)

## Environment Variables
- Configure API base URL in `src/utils/api.js` if needed.


## Folder Structure & Functionality

```
hotel-booking-frontend/
├── public/            # Static files and index.html
├── src/
│   ├── components/    # Reusable UI components (Navbar, Roomcard, ReviewList, etc.)
│   ├── context/       # React context for global state (AuthContext)
│   ├── pages/         # Main app pages (Home, RoomDetails, Profile, AdminDashboard, etc.)
│   ├── utils/         # Utility functions (api.js for Axios setup)
│   ├── App.js         # Main app component and routes
│   ├── index.js       # App entry point
│   └── ...            # Other config and style files
├── .env               # Environment variables (frontend)
├── package.json        # Project dependencies and scripts
├── README.md
```

### Key Functionalities
- **components/**: Contains all reusable UI elements (navigation, room cards, review display, etc.)
- **context/**: Manages authentication state and user info across the app.
- **pages/**: Each file is a main page/route (e.g., Home, RoomDetails, Profile, AdminDashboard, etc.).
- **utils/api.js**: Axios instance with JWT token handling for API requests.
- **App.js**: Sets up React Router and main layout.

## Notes
- Requires the backend server to be running.
- Make sure MongoDB and backend are set up as per backend README.



