# Real Estate CMS

A content management system for a real estate company, where the public can view available/sold room projects, and the admin can manage room listings via a private panel.

## Features

### Public User Features
- Homepage showing all rooms with title, price, size, location, image, and status
- Room details page with full room information and image gallery
- Visual indication for sold-out rooms

### Admin Panel Features
- Secure login/logout
- Dashboard to view all posted rooms
- Add, edit, and delete room functionality
- Change room status between "Available" and "Sold Out"
- Image management

## Tech Stack

- **Frontend**: EJS Templates + Bootstrap
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: express-session + bcrypt
- **Image Upload**: Multer

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd real-estate-cms
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/real-estate-cms
   SESSION_SECRET=your-secret-key
   NODE_ENV=development
   ```

4. Seed the database with an admin user:
   ```
   node seed.js
   ```

5. Start the application:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

6. Access the application:
   - Public site: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login
     - Default credentials: 
       - Username: admin
       - Password: admin123

## Project Structure

```
real-estate-cms/
├── views/             # EJS templates
│   └── partials/      # Reusable template parts
├── public/            # Static files
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── uploads/       # Uploaded images
├── routes/            # Route definitions
├── models/            # Database models
├── controllers/       # Route controllers
├── middleware/        # Custom middleware
├── config/            # Configuration files
├── app.js             # Main application file
└── .env               # Environment variables
```

## License

This project is licensed under the MIT License.
