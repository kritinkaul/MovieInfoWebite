const API_KEY = 'cc5175108a6220906a5790b74539b1b9';
const API_URL = 'https://api.themoviedb.org/3';

// Function to fetch movie details
async function fetchMovieDetails(query) {
    const response = await fetch(`${API_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        displayMovie(data.results[0]);
    } else {
        alert('Movie not found!');
    }
}

// Function to fetch the top 10 popular movies
async function fetchTopMovies() {
    try {
        const response = await fetch(`${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        displayTopMovies(data.results.slice(0, 10));
    } catch (error) {
        console.error('Error fetching top movies:', error);
    }
}

// Function to display the top 10 movies with streaming availability
async function displayTopMovies(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = ''; // Clear any existing movies

    for (let movie of movies) {
        const response = await fetch(`${API_URL}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=watch/providers`);
        const details = await response.json();
        const streamingProviders = details['watch/providers'].results.US?.flatrate || [];
        const streamingServices = streamingProviders.map(provider => provider.provider_name).join(', ') || "Not Available";

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        movieCard.innerHTML = `
            <div class="movie-poster-container">
                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" class="movie-poster">
            </div>
            <div class="movie-info">
                <h4>${movie.title}</h4>
                <p class="movie-rating">⭐ ${movie.vote_average || 'N/A'}</p>
                <p class="movie-release-date">Release Date: ${movie.release_date || 'N/A'}</p>
                <p class="movie-streaming"><strong>Streaming on:</strong> ${streamingServices}</p>
            </div>
        `;

        movieList.appendChild(movieCard);
    }
}

// Function to display detailed movie information
async function displayMovie(movie) {
    const movieDetails = document.getElementById('movie-details');

    const response = await fetch(`${API_URL}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits,watch/providers`);
    const details = await response.json();

    const actors = details.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
    const countries = details.production_countries.map(country => country.name).join(', ');
    const streaming = details['watch/providers'].results.US ? details['watch/providers'].results.US.flatrate || [] : [];
    const streamingServices = streaming.map(provider => provider.provider_name).join(', ');

    movieDetails.innerHTML = `
        <div class="movie-info-container">
            <img class="movie-poster" src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p><i class="fas fa-calendar-alt"></i> <strong>Release Date:</strong> ${movie.release_date}</p>
                <p><i class="fas fa-info-circle"></i> <strong>Overview:</strong> ${movie.overview}</p>
                <p><i class="fas fa-users"></i> <strong>Actors:</strong> ${actors || 'Not Available'}</p>
                <p><i class="fas fa-globe"></i> <strong>Country:</strong> ${countries || 'Not Available'}</p>
                <p><i class="fas fa-tv"></i> <strong>Streaming on:</strong> ${streamingServices || 'Not Available'}</p>
            </div>
        </div>
    `;
}

// Event listener for search button
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-bar').value;
    if (query) {
        fetchMovieDetails(query);
    }
});

// Load top movies when the page loads
fetchTopMovies();

// Refresh the top movies every 5 minutes (300,000 milliseconds)
setInterval(fetchTopMovies, 300000);

// Elements for suggestions
const searchBar = document.getElementById('search-bar');
const suggestionsList = document.getElementById('suggestions-list');

// Fetch and display suggestions
async function fetchSuggestions(query) {
    if (!query) {
        suggestionsList.innerHTML = ''; // Clear suggestions if input is empty
        return;
    }

    try {
        const response = await fetch(`${API_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
        const data = await response.json();
        displaySuggestions(data.results);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Display suggestions as a dropdown
function displaySuggestions(movies) {
    suggestionsList.innerHTML = ''; // Clear previous suggestions

    movies.slice(0, 5).forEach(movie => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');

        suggestionItem.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w92${movie.poster_path}" alt="${movie.title}">
            <p>${movie.title}</p>
        `;

        suggestionItem.addEventListener('click', () => {
            displayMovie(movie);
            suggestionsList.innerHTML = ''; // Clear suggestions after selection
            searchBar.value = movie.title; // Fill the search bar with selected movie title
        });

        suggestionsList.appendChild(suggestionItem);
    });
}

// Event listener for typing in the search bar
searchBar.addEventListener('input', () => {
    const query = searchBar.value.trim();
    fetchSuggestions(query); // Fetch suggestions as the user types
});

// Hide suggestions when clicking outside the search section
document.addEventListener('click', (e) => {
    if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.innerHTML = ''; // Clear suggestions
    }
});

// Show the "Back to Top" button when scrolled down
window.onscroll = function() {
    const backToTopButton = document.getElementById('back-to-top');
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
};

// Scroll smoothly to the top when clicking "Back to Top"
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}