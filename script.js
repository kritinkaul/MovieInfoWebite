// ===== CINEVERESE MOVIE APP =====
// Complete movie information app with modal functionality

// API Configuration
const API_KEY = 'cc5175108a6220906a5790b74539b1b9';
const API_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Alternative image URLs for fallback
const IMG_SIZES = {
    small: 'https://image.tmdb.org/t/p/w300',
    medium: 'https://image.tmdb.org/t/p/w500',
    large: 'https://image.tmdb.org/t/p/w780',
    original: 'https://image.tmdb.org/t/p/original'
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('hero-search-input'),
    searchDropdown: document.getElementById('search-dropdown'),
    moviesGrid: document.getElementById('movies-grid'),
    sectionTitle: document.getElementById('section-title'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    modal: document.getElementById('movie-modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.querySelector('.modal-close'),
    modalBackdrop: document.querySelector('.modal-backdrop')
};

// State Management
let currentMovies = [];
let currentFilter = 'popular';
let searchTimeout = null;
let trendingMovies = [];
let carouselPosition = 0;

// Hero Text Animation
let heroTextIndex = 0;
const heroTexts = [
    "Cinematic Journey",
    "Movie Adventure", 
    "Perfect Film",
    "Epic Story",
    "Great Movie",
    "Film Discovery",
    "Cinema Experience"
];

function initializeHeroTextAnimation() {
    const rotatingText = document.getElementById('rotating-text');
    if (!rotatingText) return;
    
    // Start the rotation after initial load
    setTimeout(() => {
        setInterval(() => {
            heroTextIndex = (heroTextIndex + 1) % heroTexts.length;
            
            // Add animation class
            rotatingText.classList.add('text-change');
            
            // Change text after animation starts
            setTimeout(() => {
                rotatingText.textContent = heroTexts[heroTextIndex];
            }, 200);
            
            // Remove animation class after completion
            setTimeout(() => {
                rotatingText.classList.remove('text-change');
            }, 800);
            
        }, 3000); // Change every 3 seconds
    }, 2000); // Start after 2 seconds
}



// Initialize App
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    console.log('🎬 Initializing CineVerse app...');
    console.log('Elements found:', {
        searchInput: !!elements.searchInput,
        moviesGrid: !!elements.moviesGrid,
        sectionTitle: !!elements.sectionTitle,
        filterBtns: elements.filterBtns.length,
        modal: !!elements.modal,
        modalBody: !!elements.modalBody,
        modalClose: !!elements.modalClose,
        modalBackdrop: !!elements.modalBackdrop
    });
    
    setupEventListeners();
    cleanupUnwantedElements(); // Clean up any unwanted text overlays
    initializeHeroTextAnimation(); // Initialize the rotating hero text
    await loadTrendingContent();
    await loadMovies('popular');
    console.log('✅ CineVerse app initialized successfully!');
}

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
        elements.searchInput.addEventListener('keydown', handleSearchKeydown);
        elements.searchInput.addEventListener('focus', handleSearchFocus);
    }
    
    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Modal close events
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    if (elements.modalBackdrop) {
        elements.modalBackdrop.addEventListener('click', closeModal);
    }
    
    // Click outside to close search dropdown
    document.addEventListener('click', (e) => {
        if (!elements.searchInput?.contains(e.target) && !elements.searchDropdown?.contains(e.target)) {
            hideSearchDropdown();
        }
    });
    
    // Escape key to close modal and dropdown
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.modal && elements.modal.style.display === 'flex') {
                closeModal();
            } else if (elements.searchDropdown?.classList.contains('active')) {
                hideSearchDropdown();
            }
        }
    });
}

// API Functions
async function fetchFromAPI(endpoint, params = {}) {
    try {
        const url = new URL(API_URL + endpoint);
        url.searchParams.append('api_key', API_KEY);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        console.log('Fetching from API:', url.toString());
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

async function fetchMovies(category = 'popular') {
    const endpoints = {
        popular: '/movie/popular',
        top_rated: '/movie/top_rated',
        upcoming: '/movie/upcoming',
        now_playing: '/movie/now_playing'
    };
    
    const endpoint = endpoints[category] || endpoints.popular;
    return await fetchFromAPI(endpoint);
}

async function searchMovies(query) {
    return await fetchFromAPI('/search/movie', { query });
}

async function fetchMovieDetails(movieId) {
    return await fetchFromAPI(`/movie/${movieId}`, {
        append_to_response: 'credits,videos,similar'
    });
}

async function fetchActorDetails(actorId) {
    return await fetchFromAPI(`/person/${actorId}`, {
        append_to_response: 'movie_credits,tv_credits,images'
    });
}

// Debug function to test image URLs
function testImageUrl(url, movieTitle) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            console.log(`✅ Image loads successfully: ${movieTitle} - ${url}`);
            resolve(true);
        };
        img.onerror = () => {
            console.error(`❌ Image failed to load: ${movieTitle} - ${url}`);
            resolve(false);
        };
        img.src = url;
    });
}

// Robust image error handling with multiple fallbacks
function handleImageError(imgElement, posterPath, backdropPath, movieTitle) {
    console.error(`🖼️ Image failed to load for ${movieTitle}:`, imgElement.src);
    
    // Store original onerror to prevent infinite loops
    imgElement.onerror = null;
    
    // Try different image sizes and types with proper IMG_URL prefix
    const fallbackUrls = [];
    
    if (posterPath) {
        fallbackUrls.push(
            `${IMG_URL}${IMG_SIZES.small}${posterPath}`,
            `${IMG_URL}${IMG_SIZES.medium}${posterPath}`,
            `${IMG_URL}${IMG_SIZES.large}${posterPath}`,
            `${IMG_URL}${IMG_SIZES.original}${posterPath}`
        );
    }
    
    if (backdropPath) {
        fallbackUrls.push(
            `${IMG_URL}${IMG_SIZES.small}${backdropPath}`,
            `${IMG_URL}${IMG_SIZES.medium}${backdropPath}`,
            `${IMG_URL}${IMG_SIZES.large}${backdropPath}`
        );
    }
    
    // Add placeholder fallbacks with movie title
    const safeTitle = movieTitle ? encodeURIComponent(movieTitle.substring(0, 20)) : 'Movie';
    fallbackUrls.push(
        `https://via.placeholder.com/300x450/1a0b2e/FFD700?text=${safeTitle}`,
        `https://via.placeholder.com/300x450/ff4444/fff?text=${safeTitle}`,
        'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster'
    );
    
    // Try next fallback URL
    let currentIndex = 0;
    
    function tryNextFallback() {
        if (currentIndex < fallbackUrls.length) {
            const nextUrl = fallbackUrls[currentIndex];
            currentIndex++;
            
            console.log(`🔄 Trying fallback ${currentIndex}/${fallbackUrls.length} for ${movieTitle}:`, nextUrl);
            
            // Test if URL works before setting it
            testImageUrl(nextUrl, movieTitle).then((works) => {
                if (works) {
                    imgElement.src = nextUrl;
                    console.log(`✅ Fallback successful for ${movieTitle}`);
                } else {
                    tryNextFallback();
                }
            }).catch(() => {
                tryNextFallback();
            });
        } else {
            console.error(`❌ All fallbacks failed for ${movieTitle}`);
            imgElement.src = 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster';
        }
    }
    
    tryNextFallback();
}

// Movie Loading and Display
// Filter out problematic movies that ruin the visual appeal
function filterOutProblematicMovies(movies) {
    if (!movies || !Array.isArray(movies)) return [];
    
    return movies.filter(movie => {
        const title = movie.title ? movie.title.toLowerCase() : '';
        
        // Block all Jurassic World movies completely
        if (title.includes('jurassic world') || title.includes('jurassic park')) {
            console.log('🚫 Filtered out problematic movie:', movie.title);
            return false;
        }
        
        return true;
    });
}

async function loadMovies(category) {
    try {
        console.log('Loading movies for category:', category);
        showLoading();
        
        const data = await fetchMovies(category);
        const allMovies = data.results || [];
        
        // Filter out problematic movies
        currentMovies = filterOutProblematicMovies(allMovies);
        
        console.log('Loaded movies:', allMovies.length, '-> Filtered to:', currentMovies.length);
        displayMovies(currentMovies);
        updateSectionTitle(category);
        
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please try again.');
    }
}

async function performSearch(query) {
    try {
        if (!query.trim()) {
            await loadMovies(currentFilter);
            return;
        }
        
        console.log('Searching for:', query);
        showLoading();
        
        const data = await searchMovies(query);
        const allSearchResults = data.results || [];
        
        // Filter out problematic movies from search results too
        currentMovies = filterOutProblematicMovies(allSearchResults);
        
        console.log('Search results:', allSearchResults.length, '-> Filtered to:', currentMovies.length);
        displayMovies(currentMovies);
        updateSectionTitle('search', query);
        
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Search failed. Please try again.');
    }
}

// UI Functions
function displayMovies(movies) {
    if (!elements.moviesGrid) {
        console.error('Movies grid element not found!');
        return;
    }
    
    if (!movies || movies.length === 0) {
        elements.moviesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-film"></i>
                <h3>No movies found</h3>
                <p>Try a different search term or filter.</p>
            </div>
        `;
        return;
    }
    
    elements.moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    
    // Add click events to movie cards
    const movieCards = elements.moviesGrid.querySelectorAll('.movie-card');
    movieCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            console.log('Opening modal for movie:', movies[index].title);
            openMovieModal(movies[index].id);
        });
    });
    
    console.log('Displayed', movies.length, 'movies');
    
    // Clean up any unwanted text overlays that might have appeared
    setTimeout(() => {
        cleanupUnwantedElements();
    }, 100);
}

function createMovieCard(movie) {
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Enhanced poster URL handling with proper TMDB image sizes
    let posterUrl = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
    
    if (movie.poster_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.poster_path}`;
    } else if (movie.backdrop_path) {
        // Fallback to backdrop if no poster
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.backdrop_path}`;
    }
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster">
                <img src="${posterUrl}" 
                     alt="${movie.title}" 
                     loading="lazy"
                     onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movie.title.replace(/'/g, "\\'")}');">
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${releaseYear}</p>
                <div class="movie-genres">
                    ${createGenreTags(movie.genre_ids)}
                </div>
            </div>
        </div>
    `;
}

function createGenreTags(genreIds) {
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
        99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
        27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    
    if (!genreIds || genreIds.length === 0) {
        return '<span class="genre-tag">Unknown</span>';
    }
    
    return genreIds.slice(0, 3).map(id => 
        `<span class="genre-tag">${genreMap[id] || 'Unknown'}</span>`
    ).join('');
}

function updateSectionTitle(category, searchQuery = '') {
    if (!elements.sectionTitle) return;
    
    const titles = {
        popular: 'Popular Movies',
        top_rated: 'Top Rated Movies',
        upcoming: 'Coming Soon',
        now_playing: 'Now in Theaters',
        search: `Search Results for "${searchQuery}"`
    };
    
    elements.sectionTitle.textContent = titles[category] || 'Movies';
}

function showLoading() {
    if (!elements.moviesGrid) return;
    
    elements.moviesGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner-ring"></div>
            <p>Loading amazing movies...</p>
        </div>
    `;
}

function showError(message) {
    if (!elements.moviesGrid) return;
    
    elements.moviesGrid.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">Try Again</button>
        </div>
    `;
}

// Event Handlers
function handleSearch(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Hide dropdown if empty query
    if (!query) {
        hideSearchDropdown();
        return;
    }
    
    // Show loading state
    showSearchLoading();
    
    // Debounce search
    searchTimeout = setTimeout(() => {
        searchMovies(query);
    }, 300);
}

async function searchMovies(query) {
    try {
        console.log('Searching for:', query);
        
        const data = await fetchFromAPI('/search/movie', { query });
        const movies = data.results || [];
        
        if (movies.length > 0) {
            showSearchSuggestions(movies.slice(0, 8)); // Show max 8 suggestions
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        showNoResults();
    }
}

function showSearchLoading() {
    if (!elements.searchDropdown) return;
    
    const content = elements.searchDropdown.querySelector('.search-dropdown-content');
    content.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <span>Searching...</span>
        </div>
    `;
    
    elements.searchDropdown.classList.add('active');
}

function showSearchSuggestions(movies) {
    if (!elements.searchDropdown) return;
    
    // Filter out problematic movies from search suggestions too
    const filteredMovies = filterOutProblematicMovies(movies);
    
    const content = elements.searchDropdown.querySelector('.search-dropdown-content');
    
    content.innerHTML = filteredMovies.map(movie => {
        const posterUrl = movie.poster_path 
            ? `${IMG_URL}${IMG_SIZES.small}${movie.poster_path}` 
            : 'https://via.placeholder.com/60x90/1a0b2e/FFD700?text=No+Poster';
        
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
        return `
            <div class="search-suggestion" data-movie-id="${movie.id}">
                <div class="search-suggestion-poster">
                    <img src="${posterUrl}" 
                         alt="${movie.title}" 
                         loading="lazy"
                         onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movie.title.replace(/'/g, "\\'")}');">
                </div>
                <div class="search-suggestion-info">
                    <div class="search-suggestion-title">${movie.title}</div>
                    <div class="search-suggestion-details">
                        <span class="search-suggestion-year">${year}</span>
                        <div class="search-suggestion-rating">
                            <i class="fas fa-star"></i>
                            <span>${rating}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to suggestions
    content.querySelectorAll('.search-suggestion').forEach((suggestion, index) => {
        // Click event
        suggestion.addEventListener('click', () => {
            const movieId = suggestion.dataset.movieId;
            const movieTitle = suggestion.querySelector('.search-suggestion-title').textContent;
            hideSearchDropdown();
            elements.searchInput.value = movieTitle;
            openMovieModal(movieId);
        });
        
        // Hover events for keyboard navigation
        suggestion.addEventListener('mouseenter', () => {
            // Remove selected class from all suggestions
            content.querySelectorAll('.search-suggestion').forEach(s => s.classList.remove('selected'));
            // Add selected class to hovered suggestion
            suggestion.classList.add('selected');
        });
        
        suggestion.addEventListener('mouseleave', () => {
            suggestion.classList.remove('selected');
        });
    });
    
    elements.searchDropdown.classList.add('active');
}

function showNoResults() {
    if (!elements.searchDropdown) return;
    
    const content = elements.searchDropdown.querySelector('.search-dropdown-content');
    content.innerHTML = `
        <div class="search-no-results">
            <i class="fas fa-search"></i>
            <div>No movies found</div>
            <small>Try different keywords or check your spelling</small>
        </div>
    `;
    
    elements.searchDropdown.classList.add('active');
}

function hideSearchDropdown() {
    if (elements.searchDropdown) {
        elements.searchDropdown.classList.remove('active');
    }
}

function handleFilterClick(e) {
    const filter = e.target.dataset.filter;
    if (!filter) return;
    
    console.log('Filter clicked:', filter);
    
    // Update active state
    elements.filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Clear search input
    if (elements.searchInput) {
        elements.searchInput.value = '';
    }
    
    // Load movies with new filter
    currentFilter = filter;
    loadMovies(filter);
}

// Navigation handler
function handleNavigation(e) {
    e.preventDefault();
    const href = e.target.getAttribute('href');
    
    // Update active nav state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    e.target.classList.add('active');
    
    switch(href) {
        case '#home':
            showHomePage();
            break;
        case '#movies':
            showMoviesPage();
            break;
        case '#genres':
            showGenresPage();
            break;
        case '#watchlist':
            showWatchlistPage();
            break;
        default:
            showHomePage();
    }
}

// Modal Functions
async function openMovieModal(movieId) {
    console.log('Opening modal for movie ID:', movieId);
    
    if (!elements.modal || !elements.modalBody) {
        console.error('Modal elements not found!');
        return;
    }
    
    try {
        // Show loading state
        elements.modalBody.innerHTML = `
            <div class="modal-loading">
                <div class="spinner-ring"></div>
                <p>Loading movie details...</p>
            </div>
        `;
        
        // Show modal
        elements.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Fetch and render movie details
        const movie = await fetchMovieDetails(movieId);
        console.log('Movie details loaded:', movie.title);
        await renderMovieModal(movie, movieId);
        
    } catch (error) {
        console.error('Error opening modal:', error);
        elements.modalBody.innerHTML = `
            <div class="modal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load movie details</h3>
                <p>Please try again later.</p>
                <button onclick="closeModal()" class="retry-btn">Close</button>
            </div>
        `;
    }
}

async function renderMovieModal(movie, movieId) {
    if (!elements.modalBody) return;
    
    console.log('Rendering modal for:', movie.title);
    
    // Process movie data
    const cast = movie.credits?.cast?.slice(0, 5).map(person => person.name).join(', ') || 'Cast information not available';
    const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || 'Unknown Director';
    const producers = movie.credits?.crew?.filter(person => person.job === 'Producer').slice(0, 2).map(person => person.name).join(', ') || 'Unknown';
    
    const trailer = movie.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    const teaser = movie.videos?.results?.find(video => video.type === 'Teaser' && video.site === 'YouTube');
    const mainVideo = trailer || teaser;
    
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'Runtime not available';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const voteCount = movie.vote_count ? movie.vote_count.toLocaleString() : 'N/A';
    
    // Get streaming services from watch providers
    const streamingServices = await getStreamingServices(movieId);
    
    // Render modal content
    elements.modalBody.innerHTML = `
        <!-- Hero Section with Backdrop -->
        <div class="modal-hero">
            <div class="modal-backdrop-img">
                <img src="https://image.tmdb.org/t/p/w1280${movie.backdrop_path || movie.poster_path}" 
                     alt="${movie.title}" onerror="this.src='https://via.placeholder.com/1280x720/1a1a1a/666?text=No+Image'">
                <div class="modal-backdrop-overlay"></div>
            </div>
            
            <div class="modal-hero-content">
                <div class="modal-poster">
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                         alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster'">
                    <div class="poster-rating">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                </div>
                
                <div class="modal-main-info">
                    <h1 class="modal-title">${movie.title}</h1>
                    ${movie.tagline ? `<p class="modal-tagline">"${movie.tagline}"</p>` : ''}
                    
                    <div class="modal-meta">
                        <span class="meta-item">
                            <i class="fas fa-calendar"></i>
                            ${new Date(movie.release_date).getFullYear() || 'N/A'}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            ${runtime}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-users"></i>
                            ${voteCount} votes
                        </span>
                        ${movie.adult ? '<span class="meta-item adult-rating">18+</span>' : '<span class="meta-item">All Ages</span>'}
                    </div>
                    
                    <div class="modal-genres">
                        ${movie.genres?.map(genre => `<span class="genre-pill">${genre.name}</span>`).join('') || '<span class="genre-pill">Unknown</span>'}
                    </div>
                    
                    <div class="modal-actions">
                        ${mainVideo ? `
                            <button class="action-btn primary" onclick="playTrailer('${mainVideo.key}')">
                                <i class="fas fa-play"></i>
                                Watch ${mainVideo.type}
                            </button>
                        ` : ''}
                        <button class="action-btn secondary" onclick="addToWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-bookmark"></i>
                            Add to Watchlist
                        </button>
                        <button class="action-btn secondary" onclick="shareMovie('${movie.title.replace(/'/g, "\\'")}', ${movie.id})">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Content Sections -->
        <div class="modal-content-sections">
            <!-- Overview Section -->
            <section class="content-section">
                <h2><i class="fas fa-align-left"></i> Overview</h2>
                <p class="overview-text">${movie.overview || 'No overview available for this movie.'}</p>
            </section>
            
            <!-- Streaming Services -->
            ${streamingServices.length ? `
                <section class="content-section">
                    <h2><i class="fas fa-tv"></i> Where to Watch</h2>
                    <div class="streaming-services">
                        ${streamingServices.map(service => `
                            <a href="${service.url}${encodeURIComponent(movie.title)}" 
                               target="_blank" 
                               class="streaming-item" 
                               style="border-color: ${service.color}20; --hover-color: ${service.color};">
                                <div class="streaming-logo">
                                    <img src="${service.logo}" alt="${service.name}" />
                                </div>
                                <div class="streaming-info">
                                    <span class="streaming-name">${service.name}</span>
                                    <span class="streaming-type ${service.type}">${service.type === 'subscription' ? 'Stream' : service.type === 'rent' ? 'Rent' : 'Buy'}</span>
                                </div>
                                <div class="streaming-arrow">
                                    <i class="fas fa-external-link-alt"></i>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                    <p class="streaming-disclaimer">
                        <i class="fas fa-info-circle"></i>
                        Availability may vary by region. Prices and availability are subject to change.
                    </p>
                </section>
            ` : `
                <section class="content-section">
                    <h2><i class="fas fa-tv"></i> Where to Watch</h2>
                    <div class="no-streaming-container">
                        <i class="fas fa-search"></i>
                        <h3>No streaming information available</h3>
                        <p>Check your local theaters or digital rental services like iTunes, Google Play, or Amazon Video.</p>
                    </div>
                </section>
            `}
            
            <!-- Movie Details Grid -->
            <section class="content-section">
                <h2><i class="fas fa-info-circle"></i> Movie Details</h2>
                <div class="details-grid">
                    <div class="detail-card">
                        <i class="fas fa-user-tie"></i>
                        <h4>Director</h4>
                        <p>${director}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-users"></i>
                        <h4>Producers</h4>
                        <p>${producers}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-globe"></i>
                        <h4>Language</h4>
                        <p>${movie.original_language?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-dollar-sign"></i>
                        <h4>Budget</h4>
                        <p>${movie.budget ? '$' + movie.budget.toLocaleString() : 'Not disclosed'}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-chart-line"></i>
                        <h4>Box Office</h4>
                        <p>${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'Not available'}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-building"></i>
                        <h4>Studio</h4>
                        <p>${movie.production_companies?.[0]?.name || 'Unknown'}</p>
                    </div>
                </div>
            </section>
            
            <!-- Cast Section -->
            <section class="content-section">
                <h2><i class="fas fa-theater-masks"></i> Cast</h2>
                <div class="cast-grid">
                    ${movie.credits?.cast?.slice(0, 8).map(actor => `
                        <div class="cast-card" onclick="openActorModal(${actor.id})" data-actor-id="${actor.id}">
                            <img src="https://image.tmdb.org/t/p/w185${actor.profile_path}" 
                                 alt="${actor.name}" 
                                 onerror="this.src='https://via.placeholder.com/185x278/1a1a1a/666?text=No+Photo'">
                            <h4>${actor.name}</h4>
                            <p>${actor.character}</p>
                            <div class="cast-card-overlay">
                                <i class="fas fa-user-circle"></i>
                                <span>View Profile</span>
                            </div>
                        </div>
                    `).join('') || '<p>Cast information not available.</p>'}
                </div>
            </section>
            
            <!-- Similar Movies -->
            ${movie.similar?.results?.length ? `
                <section class="content-section">
                    <h2><i class="fas fa-film"></i> Similar Movies</h2>
                    <div class="similar-movies-grid">
                        ${movie.similar.results.slice(0, 6).map(similar => `
                            <div class="similar-movie-card" onclick="openMovieModal(${similar.id})">
                                <img src="https://image.tmdb.org/t/p/w300${similar.poster_path}" 
                                     alt="${similar.title}"
                                     onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster'">
                                <div class="similar-movie-info">
                                    <h4>${truncateText(similar.title, 25)}</h4>
                                    <p><i class="fas fa-star"></i> ${similar.vote_average?.toFixed(1) || 'N/A'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
        </div>
    `;
    
    console.log('Modal rendered successfully');
}

function closeModal() {
    if (!elements.modal) return;
    
    console.log('Closing modal');
    elements.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset modal scroll position
    if (elements.modal.scrollTop) {
        elements.modal.scrollTop = 0;
    }
    
    // Clear modal content to prevent memory leaks
    if (elements.modalBody) {
        elements.modalBody.innerHTML = '';
    }
}

// Actor Modal Functions
async function openActorModal(actorId) {
    console.log('Opening actor modal for ID:', actorId);
    
    if (!elements.modal || !elements.modalBody) {
        console.error('Modal elements not found!');
        return;
    }
    
    try {
        // Show loading state
        elements.modalBody.innerHTML = `
            <div class="modal-loading">
                <div class="spinner-ring"></div>
                <p>Loading actor details...</p>
            </div>
        `;
        
        // Show modal
        elements.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Fetch and render actor details
        const actor = await fetchActorDetails(actorId);
        console.log('Actor details loaded:', actor.name);
        renderActorModal(actor);
        
    } catch (error) {
        console.error('Error opening actor modal:', error);
        elements.modalBody.innerHTML = `
            <div class="modal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load actor details</h3>
                <p>Please try again later.</p>
                <button onclick="closeModal()" class="retry-btn">Close</button>
            </div>
        `;
    }
}

function renderActorModal(actor) {
    if (!elements.modalBody) return;
    
    console.log('Rendering actor modal for:', actor.name);
    
    // Process actor data
    const birthDate = actor.birthday ? new Date(actor.birthday).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'Not available';
    
    const deathDate = actor.deathday ? new Date(actor.deathday).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    }) : null;
    
    const age = actor.birthday && !actor.deathday ? 
        Math.floor((new Date() - new Date(actor.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    const knownForDepartment = actor.known_for_department || 'Acting';
    const placeOfBirth = actor.place_of_birth || 'Not available';
    const popularity = actor.popularity ? actor.popularity.toFixed(1) : 'N/A';
    
    // Get top movies (sorted by popularity and vote average)
    const movieCredits = actor.movie_credits?.cast || [];
    const topMovies = movieCredits
        .filter(movie => movie.poster_path && movie.vote_average > 6)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12);
    
    // Get recent movies (last 5 years)
    const currentYear = new Date().getFullYear();
    const recentMovies = movieCredits
        .filter(movie => {
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
            return releaseYear >= currentYear - 5 && movie.poster_path;
        })
        .sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0))
        .slice(0, 8);
    
    // Render actor modal content
    elements.modalBody.innerHTML = `
        <!-- Actor Hero Section -->
        <div class="actor-modal-hero">
            <div class="actor-backdrop">
                ${actor.images?.profiles?.[0] ? 
                    `<img src="https://image.tmdb.org/t/p/w1280${actor.images.profiles[0].file_path}" 
                         alt="${actor.name}" class="actor-backdrop-img">` : ''}
                <div class="actor-backdrop-overlay"></div>
            </div>
            
            <div class="actor-hero-content">
                <div class="actor-profile-img">
                    <img src="https://image.tmdb.org/t/p/w500${actor.profile_path}" 
                         alt="${actor.name}" 
                         onerror="this.src='https://via.placeholder.com/500x750/1a1a1a/666?text=No+Photo'">
                </div>
                
                <div class="actor-main-info">
                    <h1 class="actor-name">${actor.name}</h1>
                    ${actor.also_known_as?.length ? 
                        `<p class="actor-aka">Also known as: ${actor.also_known_as.slice(0, 2).join(', ')}</p>` : ''}
                    
                    <div class="actor-meta">
                        <span class="meta-item">
                            <i class="fas fa-theater-masks"></i>
                            ${knownForDepartment}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-star"></i>
                            ${popularity} popularity
                        </span>
                        ${age ? `
                            <span class="meta-item">
                                <i class="fas fa-birthday-cake"></i>
                                ${age} years old
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="actor-actions">
                        <button class="action-btn secondary" onclick="shareActor('${actor.name.replace(/'/g, "\\'")}', ${actor.id})">
                            <i class="fas fa-share"></i>
                            Share Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Actor Content Sections -->
        <div class="actor-content-sections">
            <!-- Biography Section -->
            <section class="content-section">
                <h2><i class="fas fa-user"></i> Biography</h2>
                <div class="actor-biography">
                    ${actor.biography ? 
                        `<p class="biography-text">${actor.biography}</p>` : 
                        '<p class="no-biography">No biography available for this actor.</p>'}
                </div>
            </section>
            
            <!-- Personal Details -->
            <section class="content-section">
                <h2><i class="fas fa-info-circle"></i> Personal Details</h2>
                <div class="actor-details-grid">
                    <div class="detail-card">
                        <i class="fas fa-calendar-alt"></i>
                        <h4>Born</h4>
                        <p>${birthDate}</p>
                    </div>
                    ${deathDate ? `
                        <div class="detail-card">
                            <i class="fas fa-calendar-times"></i>
                            <h4>Died</h4>
                            <p>${deathDate}</p>
                        </div>
                    ` : ''}
                    <div class="detail-card">
                        <i class="fas fa-map-marker-alt"></i>
                        <h4>Place of Birth</h4>
                        <p>${placeOfBirth}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-film"></i>
                        <h4>Known For</h4>
                        <p>${knownForDepartment}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-chart-line"></i>
                        <h4>Popularity</h4>
                        <p>${popularity}</p>
                    </div>
                    <div class="detail-card">
                        <i class="fas fa-video"></i>
                        <h4>Total Credits</h4>
                        <p>${movieCredits.length} movies</p>
                    </div>
                </div>
            </section>
            
            <!-- Top Movies -->
            ${topMovies.length ? `
                <section class="content-section">
                    <h2><i class="fas fa-trophy"></i> Popular Movies</h2>
                    <div class="actor-movies-grid">
                        ${topMovies.map(movie => `
                            <div class="actor-movie-card" onclick="openMovieModal(${movie.id})">
                                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
                                     alt="${movie.title}"
                                     onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster'">
                                <div class="actor-movie-info">
                                    <h4>${truncateText(movie.title, 20)}</h4>
                                    <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                                    <p class="movie-character">${movie.character || 'Unknown Role'}</p>
                                    <div class="movie-rating">
                                        <i class="fas fa-star"></i>
                                        <span>${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
            
            <!-- Recent Movies -->
            ${recentMovies.length ? `
                <section class="content-section">
                    <h2><i class="fas fa-clock"></i> Recent Movies</h2>
                    <div class="actor-movies-grid">
                        ${recentMovies.map(movie => `
                            <div class="actor-movie-card" onclick="openMovieModal(${movie.id})">
                                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" 
                                     alt="${movie.title}"
                                     onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster'">
                                <div class="actor-movie-info">
                                    <h4>${truncateText(movie.title, 20)}</h4>
                                    <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                                    <p class="movie-character">${movie.character || 'Unknown Role'}</p>
                                    <div class="movie-rating">
                                        <i class="fas fa-star"></i>
                                        <span>${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
        </div>
    `;
    
    console.log('Actor modal rendered successfully');
}

// Cleanup function to remove unwanted text overlays
function cleanupUnwantedElements() {
    // List of unwanted text patterns that might appear as overlays
    const unwantedPatterns = [
        'Weapons', '28 Years Later', 'Later', 'Years', 
        // Add more patterns as needed
    ];
    
    const removeUnwantedText = () => {
        // Find all elements that might contain unwanted text
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            // Skip important elements
            if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
            if (element.classList.contains('hero-content') || element.classList.contains('trending-item-title')) return;
            
            // Check for unwanted text patterns
            unwantedPatterns.forEach(pattern => {
                if (element.title && element.title.includes(pattern)) {
                    element.remove();
                } else if (element.textContent.trim() === pattern && !element.querySelector('img, video, input, button')) {
                    // Only remove if it's a standalone text element without important children
                    if (element.children.length === 0 || 
                        (element.children.length === 1 && element.children[0].tagName === 'SPAN')) {
                        element.remove();
                    }
                }
            });
        });
        
        // Also check for floating positioned elements that might be overlays
        const floatingElements = document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"]');
        floatingElements.forEach(element => {
            unwantedPatterns.forEach(pattern => {
                if (element.textContent.includes(pattern) && 
                    element.offsetWidth < 200 && 
                    element.offsetHeight < 100 &&
                    !element.closest('.trending-section, .hero, .movie-card')) {
                    element.remove();
                }
            });
        });
        
        // Remove any stray text nodes that contain unwanted patterns
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip text nodes within important sections
                    if (node.parentNode.closest('.hero-content, .trending-item, .movie-card')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            unwantedPatterns.forEach(pattern => {
                if (textNode.textContent.trim() === pattern) {
                    textNode.remove();
                }
            });
        });
    };
    
    // Run cleanup immediately
    removeUnwantedText();
    
    // Also set up a mutation observer to catch any dynamically added content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    unwantedPatterns.forEach(pattern => {
                        if (node.textContent.trim() === pattern) {
                            node.remove();
                        }
                    });
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    unwantedPatterns.forEach(pattern => {
                        if (node.textContent.trim() === pattern && 
                            !node.querySelector('img, video, input, button') &&
                            !node.closest('.hero-content, .trending-item, .movie-card')) {
                            node.remove();
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('🧹 Cleanup function initialized to remove unwanted overlays');
}

// Trending Content Functions
async function loadTrendingContent() {
    try {
        console.log('Loading trending content...');
        const data = await fetchFromAPI('/trending/movie/day');
        trendingMovies = data.results || [];
        
        console.log('Loaded trending movies:', trendingMovies.length);
        
        // If we have movies, load everything
        if (trendingMovies.length > 0) {
            loadFloatingCards();
            loadCarousel();
            loadSideCards();
        } else {
            console.log('No trending movies found, trying fallback...');
            throw new Error('No trending movies available');
        }
    } catch (error) {
        console.error('Error loading trending content:', error);
        // Fallback to popular movies
        try {
            const fallbackData = await fetchMovies('popular');
            trendingMovies = fallbackData.results || [];
            console.log('Loaded fallback movies:', trendingMovies.length);
            
            loadFloatingCards();
            loadCarousel();
            loadSideCards();
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            // Create dummy movies for testing if API is completely down
            trendingMovies = createDummyMovies();
            loadFloatingCards();
            loadCarousel();
            loadSideCards();
        }
    }
}

function createDummyMovies() {
    return Array.from({length: 20}, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
        poster_path: null,
        vote_average: 7.5 + (Math.random() * 2)
    }));
}

function loadFloatingCards() {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    // Use first 6 trending movies for floating cards
    const selectedMovies = trendingMovies.slice(0, 6);
    
    floatingCards.forEach((card, index) => {
        if (selectedMovies[index]) {
            const movie = selectedMovies[index];
            
            // Improved poster URL handling
            let posterUrl = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
            
            if (movie.poster_path) {
                posterUrl = `${IMG_URL}${movie.poster_path}`;
            } else if (movie.backdrop_path) {
                posterUrl = `${IMG_URL}${movie.backdrop_path}`;
            }
            
            // Set background image and movie data
            card.style.backgroundImage = `url(${posterUrl})`;
            card.setAttribute('data-movie-id', movie.id);
            
            // Add interactive content
            card.innerHTML = `
                <div class="movie-title-overlay">${movie.title}</div>
            `;
            
            // Add staggered appearance animation
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, index * 200);
            
            // Add click event
            card.addEventListener('click', () => {
                console.log('Floating card clicked:', movie.title);
                // Add click animation
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                    openMovieModal(movie.id);
                }, 150);
            });
        }
    });
}

// Load side movie cards
function loadSideCards() {
    if (!trendingMovies || trendingMovies.length === 0) {
        console.log('No trending movies available for side cards');
        return;
    }
    
    console.log('Loading side cards with', trendingMovies.length, 'trending movies available');
    
    // Use different movies for left and right sides, with fallback if not enough movies
    const totalMovies = trendingMovies.length;
    const leftMovies = totalMovies > 6 ? trendingMovies.slice(3, 6) : trendingMovies.slice(0, Math.min(3, totalMovies)); // Movies 4-6 or first 3
    const rightMovies = totalMovies > 9 ? trendingMovies.slice(6, 9) : trendingMovies.slice(Math.min(3, totalMovies), Math.min(6, totalMovies)); // Movies 7-9 or next 3
    
    console.log('Left movies:', leftMovies.length, 'Right movies:', rightMovies.length);
    
    // Load left side cards
    leftMovies.forEach((movie, index) => {
        const card = document.querySelector(`.card-left-${index + 1}`);
        if (card && movie) {
            // Improved poster URL handling
            let posterUrl = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
            
            if (movie.poster_path) {
                posterUrl = `${IMG_URL}${movie.poster_path}`;
            } else if (movie.backdrop_path) {
                posterUrl = `${IMG_URL}${movie.backdrop_path}`;
            }
            
            card.style.backgroundImage = `url(${posterUrl})`;
            card.setAttribute('data-movie-id', movie.id);
            
            card.innerHTML = `<div class="movie-title-overlay">${movie.title}</div>`;
            
            // Add click event
            card.addEventListener('click', () => {
                console.log('Side card clicked:', movie.title);
                openMovieModal(movie.id);
            });
            
            console.log(`Loaded left card ${index + 1}:`, movie.title);
        } else {
            console.log(`Failed to load left card ${index + 1}: card element or movie missing`);
        }
    });
    
    // Load right side cards
    rightMovies.forEach((movie, index) => {
        const card = document.querySelector(`.card-right-${index + 1}`);
        if (card && movie) {
            // Improved poster URL handling
            let posterUrl = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
            
            if (movie.poster_path) {
                posterUrl = `${IMG_URL}${movie.poster_path}`;
            } else if (movie.backdrop_path) {
                posterUrl = `${IMG_URL}${movie.backdrop_path}`;
            }
            
            card.style.backgroundImage = `url(${posterUrl})`;
            card.setAttribute('data-movie-id', movie.id);
            
            card.innerHTML = `<div class="movie-title-overlay">${movie.title}</div>`;
            
            // Add click event
            card.addEventListener('click', () => {
                console.log('Side card clicked:', movie.title);
                openMovieModal(movie.id);
            });
            
            console.log(`Loaded right card ${index + 1}:`, movie.title);
        } else {
            console.log(`Failed to load right card ${index + 1}: card element or movie missing`);
        }
    });
}

function loadCarousel() {
    const carouselTrack = document.getElementById('trending-track');
    if (!carouselTrack) {
        console.error('Carousel track element not found');
        return;
    }
    
    console.log('Loading carousel with', trendingMovies.length, 'trending movies');
    
    // Show loading state
    carouselTrack.innerHTML = `
        <div class="carousel-loading">
            <div class="spinner-ring"></div>
            <p>Loading trending movies...</p>
        </div>
    `;
    
    // Use movies for carousel and duplicate them for infinite scroll
    const carouselMovies = trendingMovies.slice(0, 12); // Use first 12 movies
    console.log('Carousel movies selected:', carouselMovies.length);
    
            setTimeout(() => {
        // Create items twice for infinite scroll effect
        const movieItems = carouselMovies.map((movie, index) => {
            // Improved poster URL handling with multiple fallbacks
            let posterUrl = 'https://via.placeholder.com/220x330/1a1a1a/666?text=No+Poster';
            let debugInfo = '';
            
            if (movie.poster_path) {
                posterUrl = `${IMG_SIZES.medium}${movie.poster_path}`;
                debugInfo = `poster: ${movie.poster_path}`;
            } else if (movie.backdrop_path) {
                // Fallback to backdrop if no poster
                posterUrl = `${IMG_SIZES.medium}${movie.backdrop_path}`;
                debugInfo = `backdrop: ${movie.backdrop_path}`;
            } else {
                debugInfo = 'no image';
            }
            
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
            

            
            console.log(`Movie ${index}: ${movie.title}, ${debugInfo}, URL: ${posterUrl}`);
            
            return `
                <div class="trending-item" data-movie-id="${movie.id}">
                    <img src="${posterUrl}" 
                         alt="${movie.title}" 
                         loading="lazy" 
                         onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movie.title.replace(/'/g, "\\'")}'');">
                    <div class="trending-item-info">
                        <h4 class="trending-item-title">${movie.title}</h4>
                        <div class="trending-item-details">
                            ${year ? `<span class="trending-item-year">${year}</span>` : ''}
                            <div class="trending-item-rating">
                                <i class="fas fa-star"></i>
                                <span>${rating}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Duplicate the items for seamless infinite scroll
        carouselTrack.innerHTML = movieItems.join('') + movieItems.join('');
        
        // Add click events to carousel items
        const carouselItems = carouselTrack.querySelectorAll('.trending-item');
        carouselItems.forEach((item, index) => {
            // Staggered appearance
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, (index % carouselMovies.length) * 100);
            
            item.addEventListener('click', () => {
                const movieIndex = index % carouselMovies.length;
                const movie = carouselMovies[movieIndex];
                console.log('Carousel item clicked:', movie.title);
                
                // Add click animation
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                    openMovieModal(movie.id);
                }, 150);
            });
        });
        

        
        console.log('Carousel loaded successfully with', carouselItems.length, 'items');
    }, 800);
}

// Utility Functions
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Image error handling function
function handleImageError(img, posterPath, backdropPath, movieTitle) {
    if (img.dataset.retryAttempt) {
        // Already tried, use final fallback
        img.src = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
        return;
    }
    
    img.dataset.retryAttempt = 'true';
    
    // Try different image sizes or backdrop as fallback
    if (posterPath && !img.src.includes('w300')) {
        img.src = `${IMG_SIZES.small}${posterPath}`;
    } else if (backdropPath && !img.src.includes(backdropPath)) {
        img.src = `${IMG_SIZES.medium}${backdropPath}`;
    } else {
        // Final fallback
        img.src = 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
    }
}

// Streaming Services Functions
async function getStreamingServices(movieId) {
    try {
        const response = await fetch(`${API_URL}/movie/${movieId}/watch/providers?api_key=${API_KEY}`);
        const data = await response.json();
        
        // Get US providers (you can change this to other countries)
        const usProviders = data.results?.US;
        if (!usProviders) return [];
        
        const providers = [];
        
        // Combine flatrate (subscription) and rent/buy providers
        const allProviders = [
            ...(usProviders.flatrate || []),
            ...(usProviders.rent || []),
            ...(usProviders.buy || [])
        ];
        
        // Remove duplicates and map to our format
        const uniqueProviders = allProviders.filter((provider, index, self) => 
            index === self.findIndex(p => p.provider_id === provider.provider_id)
        );
        
        for (const provider of uniqueProviders) {
            const serviceInfo = mapProviderToService(provider, usProviders);
            if (serviceInfo) {
                providers.push(serviceInfo);
            }
        }
        
        return providers;
    } catch (error) {
        console.error('Error fetching streaming services:', error);
        return [];
    }
}

function mapProviderToService(provider, usProviders) {
    const streamingMap = {
        8: { // Netflix
            name: 'Netflix',
            logo: 'https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
            url: 'https://www.netflix.com/search?q=',
            color: '#E50914',
            type: 'subscription'
        },
        119: { // Amazon Prime Video
            name: 'Amazon Prime Video',
            logo: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
            url: 'https://www.amazon.com/gp/video/search/ref=sr_1_1?phrase=',
            color: '#00A8E1',
            type: 'subscription'
        },
        337: { // Disney+
            name: 'Disney+',
            logo: 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg',
            url: 'https://www.disneyplus.com/search?q=',
            color: '#113CCF',
            type: 'subscription'
        },
        15: { // Hulu
            name: 'Hulu',
            logo: 'https://image.tmdb.org/t/p/original/pqzjCxPVc9TkVgGRWeAoMmyqkZV.jpg',
            url: 'https://www.hulu.com/search?q=',
            color: '#1CE783',
            type: 'subscription'
        },
        384: { // HBO Max (now Max)
            name: 'Max',
            logo: 'https://image.tmdb.org/t/p/original/aS2zvJWn9mwiCOeaVQwlWEA8duj.jpg',
            url: 'https://play.max.com/search?q=',
            color: '#0073E6',
            type: 'subscription'
        },
        387: { // HBO Max (legacy)
            name: 'Max',
            logo: 'https://image.tmdb.org/t/p/original/aS2zvJWn9mwiCOeaVQwlWEA8duj.jpg',
            url: 'https://play.max.com/search?q=',
            color: '#0073E6',
            type: 'subscription'
        },
        350: { // Apple TV+
            name: 'Apple TV+',
            logo: 'https://image.tmdb.org/t/p/original/peURlLlr8jggOwK53fJ5wdQl05y.jpg',
            url: 'https://tv.apple.com/search?term=',
            color: '#000000',
            type: 'subscription'
        },
        2: { // Apple TV (Rent/Buy)
            name: 'Apple TV',
            logo: 'https://image.tmdb.org/t/p/original/peURlLlr8jggOwK53fJ5wdQl05y.jpg',
            url: 'https://tv.apple.com/search?term=',
            color: '#000000',
            type: 'rent'
        },
        3: { // Google Play Movies & TV
            name: 'Google Play',
            logo: 'https://image.tmdb.org/t/p/original/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg',
            url: 'https://play.google.com/store/search?q=',
            color: '#FF6900',
            type: 'rent'
        },
        10: { // Amazon Video (Rent/Buy)
            name: 'Amazon Video',
            logo: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
            url: 'https://www.amazon.com/gp/video/search/ref=sr_1_1?phrase=',
            color: '#00A8E1',
            type: 'rent'
        },
        68: { // Microsoft Store
            name: 'Microsoft Store',
            logo: 'https://image.tmdb.org/t/p/original/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg',
            url: 'https://www.microsoft.com/en-us/search?q=',
            color: '#0078D4',
            type: 'rent'
        },
        7: { // Vudu
            name: 'Vudu',
            logo: 'https://image.tmdb.org/t/p/original/5vfrJQgNe9UnHVgVNAwZTy0Jo9o.jpg',
            url: 'https://www.vudu.com/content/movies/search/',
            color: '#3399CC',
            type: 'rent'
        }
    };
    
    const serviceData = streamingMap[provider.provider_id];
    if (!serviceData) return null;
    
    // Determine availability type
    let availabilityType = 'rent';
    if (usProviders.flatrate?.some(p => p.provider_id === provider.provider_id)) {
        availabilityType = 'subscription';
    } else if (usProviders.buy?.some(p => p.provider_id === provider.provider_id)) {
        availabilityType = 'buy';
    }
    
    return {
        name: serviceData.name,
        logo: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : serviceData.logo,
        url: serviceData.url,
        color: serviceData.color,
        type: availabilityType,
        providerId: provider.provider_id
    };
}

// Interactive Features
function addToWatchlist(movieId, movieTitle) {
    console.log('Adding to watchlist:', movieTitle);
    // Get existing watchlist from localStorage
    let watchlist = JSON.parse(localStorage.getItem('cineverse-watchlist') || '[]');
    
    // Check if movie is already in watchlist
    if (watchlist.some(movie => movie.id === movieId)) {
        showToast(`"${movieTitle}" is already in your watchlist!`, 'info');
        return;
    }
    
    // Add movie to watchlist
    watchlist.push({ id: movieId, title: movieTitle, addedAt: new Date().toISOString() });
    localStorage.setItem('cineverse-watchlist', JSON.stringify(watchlist));
    
    showToast(`"${movieTitle}" added to watchlist!`, 'success');
}

function shareMovie(movieTitle, movieId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${movieId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Check out "${movieTitle}" on CineVerse`,
            text: `I found this amazing movie on CineVerse!`,
            url: shareUrl
        }).then(() => {
            console.log('Movie shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(movieTitle, shareUrl);
        });
    } else {
        fallbackShare(movieTitle, shareUrl);
    }
}

function shareActor(actorName, actorId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?actor=${actorId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Check out ${actorName} on CineVerse`,
            text: `Discover ${actorName}'s filmography and biography on CineVerse!`,
            url: shareUrl
        }).then(() => {
            console.log('Actor shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(actorName, shareUrl);
        });
    } else {
        fallbackShare(actorName, shareUrl);
    }
}

function fallbackShare(movieTitle, shareUrl) {
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`Link to "${movieTitle}" copied to clipboard!`, 'success');
    }).catch(() => {
        showToast('Unable to share. Please copy the URL manually.', 'error');
    });
}

function playTrailer(videoKey) {
    const trailerUrl = `https://www.youtube.com/watch?v=${videoKey}`;
    window.open(trailerUrl, '_blank');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Page Management Functions
function showHomePage() {
    console.log('Showing home page');
    document.querySelector('.hero').style.display = 'flex';
    document.querySelector('.trending-section').style.display = 'block';
    document.querySelector('.main-content').style.display = 'block';
    hideMoviesPage();
    hideGenresPage();
    hideWatchlistPage();
}

function showMoviesPage() {
    console.log('Showing movies page');
    
    // Hide all other sections
    const hero = document.querySelector('.hero');
    const trending = document.querySelector('.trending-section');
    const mainContent = document.querySelector('.main-content');
    
    if (hero) hero.style.display = 'none';
    if (trending) trending.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    
    // Show footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.display = 'block';
    }
    
    hideGenresPage();
    hideWatchlistPage();
    
    console.log('Creating movies page...');
    createMoviesPage();
}

function showGenresPage() {
    console.log('🎭 Showing comprehensive genres page');
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.trending-section').style.display = 'none';
    document.querySelector('.main-content').style.display = 'none';
    
    // Show footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.display = 'block';
    }
    
    hideMoviesPage();
    hideWatchlistPage();
    
    // Show or create genres page
    let genresPageContainer = document.getElementById('genres-page-container');
    if (!genresPageContainer) {
        createGenresPage();
    } else {
        genresPageContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showWatchlistPage() {
    console.log('Showing watchlist page');
    
    // Hide all main sections
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.trending-section').style.display = 'none';
    document.querySelector('.main-content').style.display = 'none';
    
    // Hide footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.display = 'none';
    }
    
    hideMoviesPage();
    hideGenresPage();
    
    // Create or show watchlist page
    let watchlistContainer = document.getElementById('watchlist-page-container');
    if (!watchlistContainer) {
        watchlistContainer = document.createElement('div');
        watchlistContainer.id = 'watchlist-page-container';
        watchlistContainer.className = 'watchlist-page';
        document.body.appendChild(watchlistContainer);
    }
    
    // Load and display watchlist
    displayWatchlist(watchlistContainer);
    watchlistContainer.style.display = 'block';
}

async function displayWatchlist(container) {
    const watchlist = JSON.parse(localStorage.getItem('cineverse-watchlist') || '[]');
    
    container.innerHTML = `
        <div class="watchlist-header">
            <h1 class="watchlist-title">
                <i class="fas fa-bookmark"></i>
                My Watchlist
            </h1>
            <p class="watchlist-subtitle">Movies you want to watch</p>
            ${watchlist.length > 0 ? `
                <button class="clear-watchlist-btn" onclick="clearWatchlist()">
                    <i class="fas fa-trash"></i>
                    Clear All
                </button>
            ` : ''}
        </div>
        <div class="watchlist-content">
            ${watchlist.length === 0 ? `
                <div class="empty-watchlist">
                    <i class="fas fa-bookmark"></i>
                    <h3>Your watchlist is empty</h3>
                    <p>Start adding movies you want to watch!</p>
                    <button class="browse-movies-btn" onclick="showHomePage()">
                        Browse Movies
                    </button>
                </div>
            ` : `
                <div class="watchlist-grid">
                    ${await generateWatchlistItems(watchlist)}
                </div>
            `}
        </div>
    `;
}

async function generateWatchlistItems(watchlist) {
    const moviePromises = watchlist.map(async (item) => {
        try {
            const response = await fetch(`${API_URL}/movie/${item.id}?api_key=${API_KEY}`);
            const movie = await response.json();
            
            const posterUrl = movie.poster_path 
                ? `${IMG_URL}${movie.poster_path}` 
                : 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Poster';
            
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
            
            return `
                <div class="watchlist-item" data-movie-id="${movie.id}">
                    <div class="watchlist-poster" onclick="openMovieModal(${movie.id})">
                        <img src="${posterUrl}" 
                             alt="${movie.title}"
                             onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movie.title.replace(/'/g, "\\'")}'');">
                        <div class="watchlist-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    <div class="watchlist-info">
                        <h3 class="watchlist-movie-title">${movie.title}</h3>
                        <div class="watchlist-details">
                            <span class="watchlist-year">${year}</span>
                            <div class="watchlist-rating">
                                <i class="fas fa-star"></i>
                                <span>${rating}</span>
                            </div>
                        </div>
                        <p class="watchlist-overview">${truncateText(movie.overview, 120)}</p>
                        <button class="remove-from-watchlist-btn" onclick="removeFromWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-times"></i>
                            Remove
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return `
                <div class="watchlist-item error">
                    <div class="watchlist-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading movie</p>
                        <button class="remove-from-watchlist-btn" onclick="removeFromWatchlist(${item.id}, '${item.title.replace(/'/g, "\\'")}')">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    const movieItems = await Promise.all(moviePromises);
    return movieItems.join('');
}

function removeFromWatchlist(movieId, movieTitle) {
    let watchlist = JSON.parse(localStorage.getItem('cineverse-watchlist') || '[]');
    watchlist = watchlist.filter(movie => movie.id !== movieId);
    localStorage.setItem('cineverse-watchlist', JSON.stringify(watchlist));
    
    showToast(`"${movieTitle}" removed from watchlist!`, 'success');
    
    // Refresh the watchlist display
    const container = document.getElementById('watchlist-page-container');
    if (container) {
        displayWatchlist(container);
    }
}

function clearWatchlist() {
    if (confirm('Are you sure you want to clear your entire watchlist?')) {
        localStorage.removeItem('cineverse-watchlist');
        showToast('Watchlist cleared!', 'success');
        
        // Refresh the watchlist display
        const container = document.getElementById('watchlist-page-container');
        if (container) {
            displayWatchlist(container);
        }
    }
}

function hideMoviesPage() {
    const moviesPageContainer = document.getElementById('movies-page-container');
    if (moviesPageContainer) {
        moviesPageContainer.style.display = 'none';
    }
}

function hideGenresPage() {
    const genresPageContainer = document.getElementById('genres-page-container');
    if (genresPageContainer) {
        genresPageContainer.style.display = 'none';
    }
}

function hideWatchlistPage() {
    const watchlistPageContainer = document.getElementById('watchlist-page-container');
    if (watchlistPageContainer) {
        watchlistPageContainer.style.display = 'none';
    }
}

// Netflix-like Movies Page
async function createMoviesPage() {
    let moviesPageContainer = document.getElementById('movies-page-container');
    
    if (!moviesPageContainer) {
        moviesPageContainer = document.createElement('div');
        moviesPageContainer.id = 'movies-page-container';
        moviesPageContainer.className = 'movies-page';
        // Insert after main content, not inside it
        const mainElement = document.querySelector('main');
        mainElement.parentNode.insertBefore(moviesPageContainer, mainElement.nextSibling);
    }
    
    moviesPageContainer.style.display = 'block';
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show loading state
    moviesPageContainer.innerHTML = `
        <div class="movies-page-hero">
            <h1 class="movies-page-title">🎬 Discover Movies</h1>
            <p class="movies-page-subtitle">What genre are you in the mood for today?</p>
        </div>
        <div class="loading-container" style="padding: 4rem 0; text-align: center;">
            <div class="spinner-ring" style="margin: 0 auto 2rem auto;"></div>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">Loading Netflix-style movie experience...</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">Fetching movies from 8 different genres...</p>
        </div>
    `;
    
    console.log('Movies page container created and loading state shown');
    
    try {
        console.log('🎬 Loading massive movie collection...');
        
        // Load ALL categories with multiple pages for a huge collection
        const [
            popularMovies,
            topRatedMovies,
            upcomingMovies,
            nowPlayingMovies,
            actionMovies,
            comedyMovies,
            dramaMovies,
            horrorMovies,
            sciFiMovies,
            romanceMovies,
            thrillerMovies,
            animationMovies,
            // Load multiple pages for more content
            popularPage2,
            topRatedPage2,
            actionPage2,
            comedyPage2
        ] = await Promise.all([
            fetchMovies('popular'),
            fetchMovies('top_rated'),
            fetchMovies('upcoming'),
            fetchMovies('now_playing'),
            fetchMoviesByGenre(28), // Action
            fetchMoviesByGenre(35), // Comedy
            fetchMoviesByGenre(18), // Drama
            fetchMoviesByGenre(27), // Horror
            fetchMoviesByGenre(878), // Sci-Fi
            fetchMoviesByGenre(10749), // Romance
            fetchMoviesByGenre(53), // Thriller
            fetchMoviesByGenre(16), // Animation
            fetchMoviesByGenreWithPage(28, 2), // Action page 2
            fetchMoviesByGenreWithPage(35, 2), // Comedy page 2
            fetchMoviesWithPage('popular', 2),
            fetchMoviesWithPage('top_rated', 2)
        ]);
        
        console.log('🚀 Loaded thousands of movies across all categories!');
        
        // Create massive Netflix-style layout
        moviesPageContainer.innerHTML = `
            <div class="movies-page-hero">
                <div class="hero-background">
                    <img src="https://image.tmdb.org/t/p/w1280${popularMovies.results[0]?.backdrop_path || popularMovies.results[0]?.poster_path}" 
                         alt="Featured" class="hero-backdrop">
                    <div class="hero-backdrop-overlay"></div>
                </div>
                
                <div class="hero-content-wrapper">
                    <h1 class="movies-page-title">🎬 Discover Movies</h1>
                    <p class="movies-page-subtitle">Explore thousands of movies across every genre imaginable</p>
                    
                    <div class="genre-quick-select">
                        <button class="genre-quick-btn" onclick="scrollToSection('trending')">🔥 Trending</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('action')">💥 Action</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('comedy')">😂 Comedy</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('drama')">🎭 Drama</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('horror')">😱 Horror</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('scifi')">🚀 Sci-Fi</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('romance')">💕 Romance</button>
                        <button class="genre-quick-btn" onclick="scrollToSection('thriller')">🔪 Thriller</button>
                    </div>
                </div>
            </div>
            
            <div class="movies-page-content">
                <!-- Trending Now -->
                <section class="movie-category" id="trending-section">
                    <div class="category-header">
                        <h2 class="category-title">🔥 Trending Now</h2>
                        <p class="category-description">What everyone's watching right now</p>
                        <button class="view-all-btn" onclick="viewAllMovies('trending')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${[...popularMovies.results, ...popularPage2.results].slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Now Playing -->
                <section class="movie-category" id="nowplaying-section">
                    <div class="category-header">
                        <h2 class="category-title">🎭 In Theaters Now</h2>
                        <p class="category-description">Currently playing in cinemas worldwide</p>
                        <button class="view-all-btn" onclick="viewAllMovies('nowplaying')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${nowPlayingMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Action Movies -->
                <section class="movie-category" id="action-section">
                    <div class="category-header">
                        <h2 class="category-title">💥 Action & Adventure</h2>
                        <p class="category-description">Heart-pounding thrills and epic adventures</p>
                        <button class="view-all-btn" onclick="viewAllMovies('action')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${[...actionMovies.results, ...actionPage2.results].slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Comedy Movies -->
                <section class="movie-category" id="comedy-section">
                    <div class="category-header">
                        <h2 class="category-title">😂 Comedy Central</h2>
                        <p class="category-description">Laugh out loud with these hilarious films</p>
                        <button class="view-all-btn" onclick="viewAllMovies('comedy')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${[...comedyMovies.results, ...comedyPage2.results].slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Drama Movies -->
                <section class="movie-category" id="drama-section">
                    <div class="category-header">
                        <h2 class="category-title">🎭 Dramatic Masterpieces</h2>
                        <p class="category-description">Compelling stories that touch the soul</p>
                        <button class="view-all-btn" onclick="viewAllMovies('drama')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${dramaMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Horror Movies -->
                <section class="movie-category" id="horror-section">
                    <div class="category-header">
                        <h2 class="category-title">😱 Horror Zone</h2>
                        <p class="category-description">Spine-chilling scares and supernatural thrills</p>
                        <button class="view-all-btn" onclick="viewAllMovies('horror')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${horrorMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Sci-Fi Movies -->
                <section class="movie-category" id="scifi-section">
                    <div class="category-header">
                        <h2 class="category-title">🚀 Sci-Fi Universe</h2>
                        <p class="category-description">Mind-bending adventures from other worlds</p>
                        <button class="view-all-btn" onclick="viewAllMovies('scifi')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${sciFiMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Romance Movies -->
                <section class="movie-category" id="romance-section">
                    <div class="category-header">
                        <h2 class="category-title">💕 Romance Collection</h2>
                        <p class="category-description">Love stories that warm the heart</p>
                        <button class="view-all-btn" onclick="viewAllMovies('romance')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${romanceMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Thriller Movies -->
                <section class="movie-category" id="thriller-section">
                    <div class="category-header">
                        <h2 class="category-title">🔪 Thriller Zone</h2>
                        <p class="category-description">Edge-of-your-seat suspense</p>
                        <button class="view-all-btn" onclick="viewAllMovies('thriller')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${thrillerMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Animation Movies -->
                <section class="movie-category" id="animation-section">
                    <div class="category-header">
                        <h2 class="category-title">🎨 Animation Magic</h2>
                        <p class="category-description">Animated adventures for all ages</p>
                        <button class="view-all-btn" onclick="viewAllMovies('animation')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${animationMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Top Rated -->
                <section class="movie-category" id="toprated-section">
                    <div class="category-header">
                        <h2 class="category-title">⭐ Critically Acclaimed</h2>
                        <p class="category-description">The highest-rated films of all time</p>
                        <button class="view-all-btn" onclick="viewAllMovies('toprated')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${[...topRatedMovies.results, ...topRatedPage2.results].slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
                
                <!-- Coming Soon -->
                <section class="movie-category" id="upcoming-section">
                    <div class="category-header">
                        <h2 class="category-title">🎬 Coming Soon</h2>
                        <p class="category-description">Highly anticipated upcoming releases</p>
                        <button class="view-all-btn" onclick="viewAllMovies('upcoming')">View All</button>
                    </div>
                    <div class="movies-carousel">
                        <div class="movies-carousel-track">
                            ${upcomingMovies.results.slice(0, 20).map(movie => createNetflixMovieCard(movie)).join('')}
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        console.log('🎉 Massive movie collection loaded successfully!');
        
        // Add click events to movie cards
        setTimeout(() => {
            const movieCards = moviesPageContainer.querySelectorAll('.netflix-movie-card');
            console.log('🎮 Adding interactions to', movieCards.length, 'movie cards');
            
            movieCards.forEach(card => {
                card.addEventListener('click', () => {
                    const movieId = card.dataset.movieId;
                    openMovieModal(movieId);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('Error loading movies page:', error);
        moviesPageContainer.innerHTML = `
            <div class="movies-page-hero">
                <h1 class="movies-page-title">🎬 Discover Movies</h1>
                <p class="movies-page-subtitle">Something went wrong!</p>
            </div>
            <div class="error-container" style="padding: 4rem 2rem; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Failed to load movies</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Error: ${error.message}</p>
                <button onclick="createMoviesPage()" class="retry-btn" style="padding: 1rem 2rem; background: var(--primary-gold); color: #000; border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">Retry</button>
            </div>
        `;
    }
}

// Fetch movies by genre
async function fetchMoviesByGenre(genreId) {
    return await fetchFromAPI('/discover/movie', {
        with_genres: genreId,
        sort_by: 'popularity.desc'
    });
}

// Fetch movies by genre with specific page
async function fetchMoviesByGenreWithPage(genreId, page) {
    return await fetchFromAPI('/discover/movie', {
        with_genres: genreId,
        sort_by: 'popularity.desc',
        page: page
    });
}

// Fetch movies with specific page
async function fetchMoviesWithPage(category, page) {
    const endpoints = {
        popular: '/movie/popular',
        top_rated: '/movie/top_rated',
        upcoming: '/movie/upcoming',
        now_playing: '/movie/now_playing'
    };
    
    const endpoint = endpoints[category] || endpoints.popular;
    return await fetchFromAPI(endpoint, { page: page });
}

// Render the complete movies page
function renderMoviesPage(container, movieCategories) {
    const genreInfo = {
        action: { name: '🔥 Action & Adventure', description: 'Heart-pounding thrills and excitement' },
        comedy: { name: '😂 Comedy', description: 'Laugh out loud moments' },
        drama: { name: '🎭 Drama', description: 'Compelling stories and characters' },
        horror: { name: '😱 Horror', description: 'Spine-chilling scares' },
        scifi: { name: '🚀 Sci-Fi & Fantasy', description: 'Mind-bending adventures' },
        romance: { name: '💕 Romance', description: 'Love stories that touch the heart' },
        topRated: { name: '⭐ Top Rated', description: 'Critically acclaimed masterpieces' },
        upcoming: { name: '🎬 Coming Soon', description: 'Highly anticipated releases' }
    };
    
    container.innerHTML = `
        <div class="movies-page-hero">
            <h1 class="movies-page-title">🎬 Discover Movies</h1>
            <p class="movies-page-subtitle">What genre are you in the mood for today?</p>
            
            <!-- Genre Quick Selection -->
            <div class="genre-quick-select">
                <button class="genre-quick-btn" onclick="scrollToSection('action')">🔥 Action</button>
                <button class="genre-quick-btn" onclick="scrollToSection('comedy')">😂 Comedy</button>
                <button class="genre-quick-btn" onclick="scrollToSection('drama')">🎭 Drama</button>
                <button class="genre-quick-btn" onclick="scrollToSection('horror')">😱 Horror</button>
                <button class="genre-quick-btn" onclick="scrollToSection('scifi')">🚀 Sci-Fi</button>
                <button class="genre-quick-btn" onclick="scrollToSection('romance')">💕 Romance</button>
            </div>
        </div>
        
        <div class="movies-page-content">
            ${Object.entries(movieCategories).map(([category, movies]) => {
                if (!movies || movies.length === 0) return '';
                
                const info = genreInfo[category];
                return `
                    <section class="movie-category" id="${category}-section">
                        <div class="category-header">
                            <h2 class="category-title">${info.name}</h2>
                            <p class="category-description">${info.description}</p>
                            <button class="view-all-btn" onclick="viewAllMovies('${category}')">View All</button>
                        </div>
                        
                        <div class="movies-carousel">
                            <div class="movies-carousel-track">
                                ${movies.slice(0, 12).map(movie => createNetflixMovieCard(movie)).join('')}
                            </div>
                        </div>
                    </section>
                `;
            }).join('')}
        </div>
    `;
    
    // Add click events to movie cards
    setTimeout(() => {
        container.querySelectorAll('.netflix-movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const movieId = card.dataset.movieId;
                openMovieModal(movieId);
            });
        });
    }, 100);
}

// Create Netflix-style movie card
function createNetflixMovieCard(movie) {
    // Enhanced poster URL handling with proper IMG_URL prefix and fallbacks
    let posterUrl = 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster';
    
    if (movie.poster_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.poster_path}`;
    } else if (movie.backdrop_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.backdrop_path}`;
    }
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
    
    // Ensure movie title is properly displayed
    const movieTitle = movie.title || movie.name || 'Unknown Title';
    
    return `
        <div class="netflix-movie-card" data-movie-id="${movie.id}">
            <div class="netflix-movie-poster">
                <img src="${posterUrl}" 
                     alt="${movieTitle}" 
                     loading="lazy"
                     onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movieTitle.replace(/'/g, "\\'")}');">
                <div class="netflix-movie-overlay">
                    <div class="netflix-movie-info">
                        <h4 class="netflix-movie-title">${movieTitle}</h4>
                        <div class="netflix-movie-meta">
                            <span class="netflix-movie-year">${year}</span>
                            <div class="netflix-movie-rating">
                                <i class="fas fa-star"></i>
                                <span>${rating}</span>
                            </div>
                        </div>
                        <div class="netflix-movie-actions">
                            <button class="netflix-action-btn play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="netflix-action-btn wishlist-btn" onclick="event.stopPropagation(); addToWatchlist(${movie.id}, '${movieTitle.replace(/'/g, "\\'")}')">
                                <i class="fas fa-bookmark"></i>
                            </button>
                            <button class="netflix-action-btn info-btn">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Utility functions
function scrollToSection(category) {
    const section = document.getElementById(`${category}-section`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

async function viewAllMovies(category) {
    console.log(`🎬 Loading all movies for category: ${category}`);
    
    try {
        // Show loading modal
        document.body.insertAdjacentHTML('beforeend', `
            <div class="view-all-modal" id="viewAllModal">
                <div class="view-all-modal-content">
                    <div class="view-all-header">
                        <h2 class="view-all-title">Loading ${getCategoryTitle(category)}...</h2>
                        <button class="close-view-all" onclick="closeViewAllModal()">&times;</button>
                    </div>
                    <div class="view-all-loading">
                        <div class="loading-spinner"></div>
                        <p>Fetching hundreds of movies...</p>
                    </div>
                </div>
            </div>
        `);
        
        // Fetch multiple pages of movies for the category
        const pages = await Promise.all([
            getCategoryData(category, 1),
            getCategoryData(category, 2),
            getCategoryData(category, 3),
            getCategoryData(category, 4),
            getCategoryData(category, 5)
        ]);
        
        // Combine all movies from all pages
        const allMovies = pages.flatMap(page => page.results || []);
        
        console.log(`✅ Loaded ${allMovies.length} movies for ${category}`);
        
        // Update modal with movies grid
        const modal = document.getElementById('viewAllModal');
        modal.querySelector('.view-all-modal-content').innerHTML = `
            <div class="view-all-header">
                <h2 class="view-all-title">${getCategoryTitle(category)} (${allMovies.length} Movies)</h2>
                <button class="close-view-all" onclick="closeViewAllModal()">&times;</button>
            </div>
            <div class="view-all-grid">
                ${allMovies.map(movie => createViewAllMovieCard(movie)).join('')}
            </div>
        `;
        
        // Add click events to movie cards
        setTimeout(() => {
            const movieCards = modal.querySelectorAll('.view-all-movie-card');
            movieCards.forEach(card => {
                card.addEventListener('click', () => {
                    const movieId = card.dataset.movieId;
                    closeViewAllModal();
                    openMovieModal(movieId);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('❌ Error loading movies for category:', category, error);
        closeViewAllModal();
    }
}

// Get category data based on type
async function getCategoryData(category, page = 1) {
    const categoryMap = {
        trending: () => fetchMoviesWithPage('popular', page),
        nowplaying: () => fetchMoviesWithPage('now_playing', page),
        action: () => fetchMoviesByGenreWithPage(28, page),
        comedy: () => fetchMoviesByGenreWithPage(35, page),
        drama: () => fetchMoviesByGenreWithPage(18, page),
        horror: () => fetchMoviesByGenreWithPage(27, page),
        scifi: () => fetchMoviesByGenreWithPage(878, page),
        romance: () => fetchMoviesByGenreWithPage(10749, page),
        thriller: () => fetchMoviesByGenreWithPage(53, page),
        animation: () => fetchMoviesByGenreWithPage(16, page),
        toprated: () => fetchMoviesWithPage('top_rated', page),
        upcoming: () => fetchMoviesWithPage('upcoming', page)
    };
    
    const fetchFunction = categoryMap[category];
    return fetchFunction ? await fetchFunction() : await fetchMoviesWithPage('popular', page);
}

// Get display title for category
function getCategoryTitle(category) {
    const titles = {
        trending: '🔥 Trending Now',
        nowplaying: '🎭 In Theaters Now',
        action: '💥 Action & Adventure',
        comedy: '😂 Comedy Central',
        drama: '🎭 Dramatic Masterpieces',
        horror: '😱 Horror Zone',
        scifi: '🚀 Sci-Fi Universe',
        romance: '💕 Romance Collection',
        thriller: '🔪 Thriller Zone',
        animation: '🎨 Animation Magic',
        toprated: '⭐ Critically Acclaimed',
        upcoming: '🎬 Coming Soon'
    };
    
    return titles[category] || '🎬 Movies';
}

// Create movie card for view all modal
function createViewAllMovieCard(movie) {
    // Enhanced poster URL handling with proper fallbacks
    let posterUrl = 'https://via.placeholder.com/300x450/1a0b2e/FFD700?text=No+Poster';
    
    if (movie.poster_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.poster_path}`;
    } else if (movie.backdrop_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.backdrop_path}`;
    }
    
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Ensure movie title is properly displayed
    const movieTitle = movie.title || movie.name || 'Unknown Title';
    
    return `
        <div class="view-all-movie-card" data-movie-id="${movie.id}">
            <div class="view-all-poster">
                <img src="${posterUrl}" 
                     alt="${movieTitle}" 
                     loading="lazy"
                     onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movieTitle.replace(/'/g, "\\'")}')">
                <div class="view-all-overlay">
                    <div class="view-all-movie-info">
                        <h3 class="view-all-movie-title">${movieTitle}</h3>
                        <div class="view-all-movie-meta">
                            <span class="view-all-year">${year}</span>
                            <span class="view-all-rating">⭐ ${rating}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Close view all modal
function closeViewAllModal() {
    const modal = document.getElementById('viewAllModal');
    if (modal) {
        modal.remove();
    }
}

function loadMoreCategories() {
    console.log('Loading more movie categories...');
    showToast('Loading more categories...', 'info');
    // TODO: Implement loading more categories
}

// Export functions for global access (needed for inline event handlers)
window.openMovieModal = openMovieModal;
window.openActorModal = openActorModal;
window.closeModal = closeModal;
window.addToWatchlist = addToWatchlist;
window.shareMovie = shareMovie;
window.shareActor = shareActor;
window.removeFromWatchlist = removeFromWatchlist;
window.clearWatchlist = clearWatchlist;
window.showHomePage = showHomePage;

function showHomePage() {
    // Hide all other pages
    hideWatchlistPage();
    hideMoviesPage();
    hideGenresPage();
    
    // Show main sections
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.trending-section').style.display = 'block';
    document.querySelector('.main-content').style.display = 'block';
    
    // Show footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[href="#home"]').classList.add('active');
}

// Create comprehensive Genres page
async function createGenresPage() {
    console.log('🎭 Creating comprehensive genres page with all movie genres...');
    
    try {
        const mainElement = document.querySelector('main');
        
        // Create genres page container
        let genresPageContainer = document.getElementById('genres-page-container');
        if (!genresPageContainer) {
            genresPageContainer = document.createElement('div');
            genresPageContainer.id = 'genres-page-container';
            genresPageContainer.className = 'genres-page';
            mainElement.parentNode.insertBefore(genresPageContainer, mainElement.nextSibling);
        }
        
        // Show loading state
        genresPageContainer.innerHTML = `
            <div class="genres-page-hero">
                <div class="genres-hero-background">
                    <div class="genres-hero-overlay"></div>
                </div>
                <div class="genres-hero-content">
                    <h1 class="genres-page-title">🎭 Explore by Genre</h1>
                    <p class="genres-page-subtitle">Discover movies across every imaginable genre</p>
                </div>
            </div>
            
            <div class="genres-loading">
                <div class="loading-spinner"></div>
                <p>Loading all movie genres...</p>
            </div>
        `;
        
        genresPageContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Define all movie genres with TMDB IDs
        const allGenres = [
            { id: 28, name: 'Action', emoji: '💥', description: 'Heart-pounding action and adventure' },
            { id: 12, name: 'Adventure', emoji: '🗺️', description: 'Epic journeys and thrilling quests' },
            { id: 16, name: 'Animation', emoji: '🎨', description: 'Animated masterpieces for all ages' },
            { id: 35, name: 'Comedy', emoji: '😂', description: 'Laugh-out-loud entertainment' },
            { id: 80, name: 'Crime', emoji: '🕵️', description: 'Gripping crime stories and mysteries' },
            { id: 99, name: 'Documentary', emoji: '📽️', description: 'Real stories and fascinating documentaries' },
            { id: 18, name: 'Drama', emoji: '🎭', description: 'Compelling dramatic narratives' },
            { id: 10751, name: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'Perfect for family movie nights' },
            { id: 14, name: 'Fantasy', emoji: '🧙‍♂️', description: 'Magical worlds and fantastical adventures' },
            { id: 36, name: 'History', emoji: '🏛️', description: 'Historical epics and period pieces' },
            { id: 27, name: 'Horror', emoji: '😱', description: 'Spine-chilling scares and thrills' },
            { id: 10402, name: 'Music', emoji: '🎵', description: 'Musical films and soundtracks' },
            { id: 9648, name: 'Mystery', emoji: '🔍', description: 'Puzzling mysteries and whodunits' },
            { id: 10749, name: 'Romance', emoji: '💕', description: 'Love stories and romantic comedies' },
            { id: 878, name: 'Science Fiction', emoji: '🚀', description: 'Futuristic worlds and sci-fi adventures' },
            { id: 10770, name: 'TV Movie', emoji: '📺', description: 'Made-for-television films' },
            { id: 53, name: 'Thriller', emoji: '🔪', description: 'Edge-of-your-seat suspense' },
            { id: 10752, name: 'War', emoji: '⚔️', description: 'War epics and battlefield stories' },
            { id: 37, name: 'Western', emoji: '🤠', description: 'Wild West adventures and cowboys' }
        ];
        
        // Fetch movies for all genres in parallel
        console.log('🚀 Fetching movies for all', allGenres.length, 'genres...');
        
        const genreMovies = await Promise.all(
            allGenres.map(async (genre) => {
                try {
                    const [page1, page2] = await Promise.all([
                        fetchMoviesByGenre(genre.id),
                        fetchMoviesByGenreWithPage(genre.id, 2)
                    ]);
                    
                    // Filter out problematic movies from genre results
                    const allMovies = [...(page1.results || []), ...(page2.results || [])];
                    const filteredMovies = filterOutProblematicMovies(allMovies);
                    
                    return {
                        ...genre,
                        movies: filteredMovies
                    };
                } catch (error) {
                    console.error(`Error fetching ${genre.name} movies:`, error);
                    return { ...genre, movies: [] };
                }
            })
        );
        
        console.log('✅ Successfully loaded movies for all genres!');
        
        // Create comprehensive genres page
        genresPageContainer.innerHTML = `
            <div class="genres-page-hero">
                <div class="genres-hero-background">
                    <div class="genres-hero-overlay"></div>
                </div>
                <div class="genres-hero-content">
                    <h1 class="genres-page-title">🎭 Explore by Genre</h1>
                    <p class="genres-page-subtitle">Discover thousands of movies across ${allGenres.length} different genres</p>
                    
                    <div class="genres-quick-nav">
                        ${allGenres.map(genre => `
                            <button class="genre-nav-btn" onclick="scrollToGenre('${genre.name.toLowerCase().replace(' ', '-')}')" title="${genre.description}">
                                ${genre.emoji} ${genre.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="genres-page-content">
                ${genreMovies.filter(genre => genre.movies.length > 0).map(genre => `
                    <section class="genre-category" id="${genre.name.toLowerCase().replace(' ', '-')}-section">
                        <div class="genre-header">
                            <div class="genre-title-section">
                                <h2 class="genre-title">${genre.emoji} ${genre.name}</h2>
                                <p class="genre-description">${genre.description}</p>
                            </div>
                            <div class="genre-header-actions">
                                <button class="view-all-btn" onclick="viewAllMovies('genre-${genre.id}')">View All ${genre.movies.length}+</button>
                            </div>
                        </div>
                        
                        <div class="genre-carousel">
                            <div class="genre-carousel-track">
                                ${genre.movies.slice(0, 20).map(movie => createHorizontalMovieCard(movie)).join('')}
                            </div>
                        </div>
                    </section>
                `).join('')}
            </div>
        `;
        
        // Add click events to movie cards
        setTimeout(() => {
            const movieCards = genresPageContainer.querySelectorAll('.horizontal-movie-card');
            console.log('🎮 Adding interactions to', movieCards.length, 'genre movie cards');
            
            movieCards.forEach(card => {
                card.addEventListener('click', () => {
                    const movieId = card.dataset.movieId;
                    openMovieModal(movieId);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('❌ Error creating genres page:', error);
    }
}

// Create horizontal movie card for genres page
function createHorizontalMovieCard(movie) {
    // Enhanced poster URL handling with proper fallbacks
    let posterUrl = 'https://via.placeholder.com/300x450/1a0b2e/FFD700?text=No+Poster';
    
    if (movie.poster_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.poster_path}`;
    } else if (movie.backdrop_path) {
        posterUrl = `${IMG_URL}${IMG_SIZES.medium}${movie.backdrop_path}`;
    }
    
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Ensure movie title is properly displayed
    const movieTitle = movie.title || movie.name || 'Unknown Title';
    
    return `
        <div class="horizontal-movie-card" data-movie-id="${movie.id}">
            <div class="horizontal-movie-poster">
                <img src="${posterUrl}" 
                     alt="${movieTitle}" 
                     loading="lazy"
                     onerror="handleImageError(this, '${movie.poster_path || ''}', '${movie.backdrop_path || ''}', '${movieTitle.replace(/'/g, "\\'")}')">
                <div class="horizontal-movie-overlay">
                    <div class="horizontal-movie-info">
                        <h3 class="horizontal-movie-title">${movieTitle}</h3>
                        <div class="horizontal-movie-meta">
                            <span class="horizontal-movie-year">${year}</span>
                            <span class="horizontal-movie-rating">⭐ ${rating}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Scroll to specific genre section
function scrollToGenre(genreId) {
    const section = document.getElementById(`${genreId}-section`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.playTrailer = playTrailer;
window.handleImageError = handleImageError;
window.testImageUrl = testImageUrl;
window.createMoviesPage = createMoviesPage;
window.createGenresPage = createGenresPage;
window.scrollToSection = scrollToSection;
window.scrollToGenre = scrollToGenre;
window.viewAllMovies = viewAllMovies;
window.loadMoreCategories = loadMoreCategories;
window.closeTrailer = null; // Will be set dynamically

// Development helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = {
        currentMovies,
        elements,
        fetchMovieDetails,
        openMovieModal,
        API_KEY
    };
    console.log('🎬 CineVerse Debug Mode - Use window.debugApp to access app state');
}

function handleSearchKeydown(e) {
    const dropdown = elements.searchDropdown;
    if (!dropdown || !dropdown.classList.contains('active')) return;
    
    const suggestions = dropdown.querySelectorAll('.search-suggestion');
    let currentSelected = dropdown.querySelector('.search-suggestion.selected');
    let currentIndex = currentSelected ? Array.from(suggestions).indexOf(currentSelected) : -1;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (currentSelected) currentSelected.classList.remove('selected');
            currentIndex = (currentIndex + 1) % suggestions.length;
            suggestions[currentIndex].classList.add('selected');
            suggestions[currentIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (currentSelected) currentSelected.classList.remove('selected');
            currentIndex = currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1;
            suggestions[currentIndex].classList.add('selected');
            suggestions[currentIndex].scrollIntoView({ block: 'nearest' });
            break;
            
        case 'Enter':
            e.preventDefault();
            if (currentSelected) {
                const movieId = currentSelected.dataset.movieId;
                hideSearchDropdown();
                elements.searchInput.value = currentSelected.querySelector('.search-suggestion-title').textContent;
                openMovieModal(movieId);
            } else if (suggestions.length > 0) {
                // Select first suggestion if none selected
                const movieId = suggestions[0].dataset.movieId;
                hideSearchDropdown();
                elements.searchInput.value = suggestions[0].querySelector('.search-suggestion-title').textContent;
                openMovieModal(movieId);
            }
            break;
            
        case 'Escape':
            hideSearchDropdown();
            elements.searchInput.blur();
            break;
    }
}

function handleSearchFocus(e) {
    const query = e.target.value.trim();
    if (query) {
        // Show existing suggestions if there are any
        const dropdown = elements.searchDropdown;
        if (dropdown && dropdown.querySelector('.search-dropdown-content').children.length > 0) {
            dropdown.classList.add('active');
        }
    }
}
