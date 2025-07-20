const API_KEY = 'cc5175108a6220906a5790b74539b1b9';
const API_URL = 'https://api.themoviedb.org/3';

// Performance optimizations
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300; // 300ms debounce for search
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Cache for API responses
const apiCache = new Map();

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cached fetch function
async function cachedFetch(url, cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        apiCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Optimized image loading with lazy loading
function createOptimizedImage(src, alt, className, size = 'w300') {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = `${IMAGE_BASE_URL}${size}${src}`;
    img.alt = alt;
    if (className) img.className = className;
    
    // Add error handling for broken images
    img.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    };
    
    return img;
}

// Batch fetch movie details to avoid N+1 problem
async function fetchMovieDetailsBatch(movieIds) {
    const promises = movieIds.map(id => 
        cachedFetch(
            `${API_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=watch/providers`,
            `movie_${id}`
        )
    );
    
    try {
        const results = await Promise.allSettled(promises);
        return results.map(result => 
            result.status === 'fulfilled' ? result.value : null
        ).filter(Boolean);
    } catch (error) {
        console.error('Error fetching movie details batch:', error);
        return [];
    }
}

// Optimized function to fetch movie details
async function fetchMovieDetails(query) {
    try {
        const data = await cachedFetch(
            `${API_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
            `search_${query}`
        );
        
        if (data.results && data.results.length > 0) {
            displayMovie(data.results[0]);
        } else {
            showNotification('Movie not found!', 'error');
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        showNotification('Error fetching movie details', 'error');
    }
}

// Optimized function to fetch top movies
async function fetchTopMovies() {
    try {
        const data = await cachedFetch(
            `${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`,
            'top_movies'
        );
        
        if (data.results) {
            const top10Movies = data.results.slice(0, 10);
            await displayTopMoviesOptimized(top10Movies);
        }
    } catch (error) {
        console.error('Error fetching top movies:', error);
        showNotification('Error loading top movies', 'error');
    }
}

// Optimized display function with batch API calls
async function displayTopMoviesOptimized(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = '<div class="loading">Loading movies...</div>';

    try {
        // Fetch all movie details in parallel
        const movieIds = movies.map(movie => movie.id);
        const movieDetails = await fetchMovieDetailsBatch(movieIds);
        
        movieList.innerHTML = '';
        
        movies.forEach((movie, index) => {
            const details = movieDetails[index];
            const streamingProviders = details?.['watch/providers']?.results?.US?.flatrate || [];
            const streamingServices = streamingProviders.map(provider => provider.provider_name).join(', ') || "Not Available";

            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');

            const posterImg = createOptimizedImage(movie.poster_path, movie.title, 'movie-poster', 'w200');

            movieCard.innerHTML = `
                <div class="movie-poster-container"></div>
                <div class="movie-info">
                    <h4>${movie.title}</h4>
                    <p class="movie-rating">⭐ ${movie.vote_average || 'N/A'}</p>
                    <p class="movie-release-date">Release Date: ${movie.release_date || 'N/A'}</p>
                    <p class="movie-streaming"><strong>Streaming on:</strong> ${streamingServices}</p>
                </div>
            `;

            // Append optimized image
            const posterContainer = movieCard.querySelector('.movie-poster-container');
            posterContainer.appendChild(posterImg);

            movieList.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Error displaying movies:', error);
        movieList.innerHTML = '<div class="error">Error loading movies</div>';
    }
}

// Optimized function to display detailed movie information
async function displayMovie(movie) {
    const movieDetails = document.getElementById('movie-details');
    movieDetails.innerHTML = '<div class="loading">Loading movie details...</div>';

    try {
        const details = await cachedFetch(
            `${API_URL}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits,watch/providers`,
            `movie_details_${movie.id}`
        );

        const actors = details.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Not Available';
        const countries = details.production_countries?.map(country => country.name).join(', ') || 'Not Available';
        const streaming = details['watch/providers']?.results?.US?.flatrate || [];
        const streamingServices = streaming.map(provider => provider.provider_name).join(', ') || 'Not Available';

        const posterImg = createOptimizedImage(movie.poster_path, movie.title, 'movie-poster');

        movieDetails.innerHTML = `
            <div class="movie-info-container">
                <div class="movie-poster-container"></div>
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p><i class="fas fa-calendar-alt"></i> <strong>Release Date:</strong> ${movie.release_date}</p>
                    <p><i class="fas fa-info-circle"></i> <strong>Overview:</strong> ${movie.overview}</p>
                    <p><i class="fas fa-users"></i> <strong>Actors:</strong> ${actors}</p>
                    <p><i class="fas fa-globe"></i> <strong>Country:</strong> ${countries}</p>
                    <p><i class="fas fa-tv"></i> <strong>Streaming on:</strong> ${streamingServices}</p>
                </div>
            </div>
        `;

        // Append optimized image
        const posterContainer = movieDetails.querySelector('.movie-poster-container');
        posterContainer.appendChild(posterImg);

    } catch (error) {
        console.error('Error displaying movie:', error);
        movieDetails.innerHTML = '<div class="error">Error loading movie details</div>';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px; 
        border-radius: 5px; color: white; z-index: 1000; 
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Optimized suggestions with debouncing
const debouncedFetchSuggestions = debounce(async (query) => {
    if (!query.trim()) {
        document.getElementById('suggestions-list').innerHTML = '';
        return;
    }

    try {
        const data = await cachedFetch(
            `${API_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
            `suggestions_${query}`
        );
        displaySuggestions(data.results);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}, DEBOUNCE_DELAY);

// Optimized display suggestions
function displaySuggestions(movies) {
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';

    movies.slice(0, 5).forEach(movie => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');

        const posterImg = createOptimizedImage(movie.poster_path, movie.title, '', 'w92');

        suggestionItem.innerHTML = `<p>${movie.title}</p>`;
        suggestionItem.insertBefore(posterImg, suggestionItem.firstChild);

        suggestionItem.addEventListener('click', () => {
            displayMovie(movie);
            suggestionsList.innerHTML = '';
            document.getElementById('search-bar').value = movie.title;
        });

        suggestionsList.appendChild(suggestionItem);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const searchBar = document.getElementById('search-bar');
    const suggestionsList = document.getElementById('suggestions-list');

    // Search button event
    searchButton.addEventListener('click', () => {
        const query = searchBar.value.trim();
        if (query) {
            fetchMovieDetails(query);
        }
    });

    // Search input event with debouncing
    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        debouncedFetchSuggestions(query);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.innerHTML = '';
        }
    });

    // Optimized scroll handler with throttling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        
        scrollTimeout = setTimeout(() => {
            const backToTopButton = document.getElementById('back-to-top');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 200) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
            scrollTimeout = null;
        }, 100);
    });

    // Load initial data
    fetchTopMovies();
});

// Optimized scroll to top function
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cache cleanup every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of apiCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            apiCache.delete(key);
        }
    }
}, 10 * 60 * 1000);

// Refresh top movies every 10 minutes instead of 5
setInterval(fetchTopMovies, 10 * 60 * 1000);