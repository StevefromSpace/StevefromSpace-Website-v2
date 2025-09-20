/**
 * @file videos.js
 * @description Handles all functionality for the videos.html page, including fetching
 * YouTube content from the backend and dynamically building the video gallery.
 */

/**
 * A reusable function to send the content height to the parent page (index.html).
 * This allows the iframe to resize automatically to prevent internal scrollbars.
 */
function sendHeightToParent() {
    // A small delay helps ensure all content (like thumbnails) has rendered before we measure.
    setTimeout(() => {
        const height = document.body.scrollHeight;
        parent.postMessage({ type: 'resize-iframe', height: height }, '*');
    }, 100);
}

// When the page is fully loaded, begin fetching the content.
document.addEventListener('DOMContentLoaded', () => {
    loadYoutubeContent();
    // Send an initial height measurement.
    sendHeightToParent();
});

/**
 * Fetches the latest videos and playlists from the /api/youtube_content endpoint
 * and populates the gallery on the page.
 */
async function loadYoutubeContent() {
    const latestContainer = document.getElementById('latest-videos-container');
    const playlistsContainer = document.getElementById('playlists-container');
    
    try {
        const response = await fetch('/api/youtube_content');
        if (!response.ok) throw new Error('Failed to fetch YouTube content.');
        
        const data = await response.json();
        
        // Clear the initial "Loading..." messages
        latestContainer.innerHTML = '';
        playlistsContainer.innerHTML = '';

        // Populate the "Latest Videos" grid if data exists
        if (data.latest_videos && data.latest_videos.length > 0) {
            data.latest_videos.forEach(video => {
                const videoCard = createVideoCard(video);
                latestContainer.appendChild(videoCard);
            });
        } else {
            latestContainer.innerHTML = '<p>No recent videos found.</p>';
        }

        // Populate the "Playlists" grid if data exists
        if (data.playlists && data.playlists.length > 0) {
            data.playlists.forEach(playlist => {
                const playlistCard = createPlaylistCard(playlist);
                playlistsContainer.appendChild(playlistCard);
            });
        }
        
        // Send the new page height to the parent after content has been added
        sendHeightToParent();

    } catch (error) {
        console.error('Error loading YouTube content:', error);
        latestContainer.innerHTML = '<p>Could not load video content at this time.</p>';
        // Send height even on error to size the error message correctly
        sendHeightToParent();
    }
}

/**
 * Creates a clickable HTML card element for a single video.
 * @param {object} video - The video data object from our API.
 * @returns {HTMLElement} An <a> element styled as a card.
 */
function createVideoCard(video) {
    const cardLink = document.createElement('a');
    cardLink.href = `https://www.youtube.com/watch?v=${video.id}`;
    cardLink.target = '_blank'; // Opens the video in a new tab
    cardLink.classList.add('video-card');

    cardLink.innerHTML = `
        <div class="video-card-thumbnail">
            <img src="${video.thumbnail}" alt="">
        </div>
        <div class="video-card-info">
            <p class="video-card-title">${video.title}</p>
        </div>
    `;
    return cardLink;
}

/**
 * Creates a clickable HTML card element for a single playlist.
 * @param {object} playlist - The playlist data object from our API.
 * @returns {HTMLElement} An <a> element styled as a card.
 */
function createPlaylistCard(playlist) {
    const cardLink = document.createElement('a');
    cardLink.href = `https://www.youtube.com/playlist?list=${playlist.id}`;
    cardLink.target = '_blank'; // Opens the playlist in a new tab
    cardLink.classList.add('video-card');

    cardLink.innerHTML = `
        <div class="video-card-thumbnail">
            <img src="${playlist.thumbnail}" alt="">
        </div>
        <div class="video-card-info">
            <p class="video-card-title">${playlist.title}</p>
            <p class="video-card-details">${playlist.video_count} videos</p>
        </div>
    `;
    return cardLink;
}