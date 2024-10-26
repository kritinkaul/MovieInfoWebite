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

// Display the movie details in the movie-details section
function displayMovie(movie) {
    const movieDetails = document.getElementById('movie-details');
    movieDetails.innerHTML = `
        <div class="movie-card">
            <h3>${movie.title}</h3>
            <p>Release Date: ${movie.release_date}</p>
            <p>Overview: ${movie.overview}</p>
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
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
