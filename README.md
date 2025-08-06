# 🎬 CineVerse - Your Ultimate Movie Experience

A modern, feature-rich movie discovery platform built with HTML, CSS, and JavaScript using the TMDB API. Experience the future of movie browsing with advanced search, personalized watchlists, and stunning visual effects.

## ✨ Features

### 🎯 Core Features
- **Advanced Movie Search**: Search by title, actor, director with real-time suggestions
- **Advanced Filters**: Filter by year range, rating, and genre
- **Trending Movies**: Discover what's popular right now
- **Genre Exploration**: Browse movies by category
- **Personal Watchlist**: Save and manage your favorite movies
- **Movie Details**: Comprehensive information including cast, trailers, and streaming availability

### 🚀 Enhanced Features
- **PWA Support**: Install as a mobile app with offline functionality
- **Loading Skeletons**: Smooth loading experience with animated placeholders
- **Keyboard Navigation**: Full keyboard support (Ctrl+K for search, arrow keys, Escape)
- **Responsive Design**: Optimized for all devices
- **Animated Background**: Stunning starfield animation
- **Toast Notifications**: User-friendly feedback system
- **Service Worker**: Offline caching for better performance

### 🎨 Visual Enhancements
- **Modern UI**: Glassmorphism design with blur effects
- **Smooth Animations**: Hover effects and transitions
- **Dark Theme**: Easy on the eyes
- **Floating Elements**: Dynamic visual elements
- **Professional Footer**: Complete with social links and API credits

## 🛠️ Setup

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_URL>
cd MovieInfoWebsite
```

### 2. Add API Key
- Sign up on [TMDB](https://www.themoviedb.org/) and get an API key
- Open `script.js` and replace `'YOUR_API_KEY'` with your actual API key

### 3. Run the Project
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Or simply open index.html in your browser
```

## 🎮 Usage

### Search & Discovery
- **Quick Search**: Type in the search bar for instant results
- **Advanced Search**: Click the filter icon for year, rating, and genre filters
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + K`: Focus search bar
  - `Arrow Keys`: Navigate suggestions
  - `Enter`: Select suggestion
  - `Escape`: Close modals

### Navigation
- **Trending**: See what's popular now
- **Genres**: Explore by movie category
- **Watchlist**: Your saved movies
- **Featured**: Daily spotlight movie

### Watchlist Management
- Click the bookmark icon on any movie to add to watchlist
- View your watchlist in the dedicated section
- Clear all items with the "Clear All" button

## 🏗️ Project Structure

```
MovieInfoWebsite/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling with animations
├── script.js           # Core functionality and API integration
├── manifest.json       # PWA manifest for mobile installation
├── sw.js              # Service worker for offline support
└── README.md          # This file
```

## 🎯 Key Improvements

### Performance
- ✅ Service Worker for offline caching
- ✅ Resource preloading
- ✅ Optimized animations
- ✅ Lazy loading support

### User Experience
- ✅ Loading skeletons
- ✅ Keyboard navigation
- ✅ Advanced search filters
- ✅ Toast notifications
- ✅ Responsive design

### Modern Features
- ✅ PWA capabilities
- ✅ Advanced search
- ✅ Professional footer
- ✅ Enhanced error handling

## 🛡️ Error Handling

The app includes comprehensive error handling:
- Global error boundaries
- Network error recovery
- User-friendly error messages
- Graceful degradation

## 📱 Mobile Experience

- **PWA Ready**: Install as a mobile app
- **Touch Optimized**: All interactions work on touch devices
- **Responsive**: Adapts to all screen sizes
- **Offline Support**: Cached content available offline

## 🎨 Design System

### Colors
- Primary Gold: `#FFD700`
- Deep Purple: `#1a0b2e`
- Electric Blue: `#0f3460`
- Neon Cyan: `#00f5ff`

### Typography
- **Orbitron**: Headers and branding
- **Inter**: Body text and UI elements
- **Cinzel**: Decorative elements

## 🔧 Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Modern JavaScript features
- **TMDB API**: Movie data and images
- **Font Awesome**: Icons
- **Google Fonts**: Typography

## 📄 License

This project is open-source under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🙏 Acknowledgments

- **TMDB**: For providing the movie database API
- **Font Awesome**: For the beautiful icons
- **Google Fonts**: For the typography

---

**Built with ❤️ for movie lovers everywhere**

