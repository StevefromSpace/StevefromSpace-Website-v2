// A function to send the content height to the parent page
function sendHeightToParent() {
    // A small delay helps ensure all content has rendered before we measure
    setTimeout(() => {
        const height = document.body.scrollHeight;
        parent.postMessage({ type: 'resize-iframe', height: height }, '*');
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    loadYoutubeContent();
    // Send the initial height in case loading takes time
    sendHeightToParent();
});

async function loadYoutubeContent() {
    const latestContainer = document.getElementById('latest-videos-container');
    const playlistsContainer = document.getElementById('playlists-container');
    
    try {
        const response = await fetch('/api/youtube_content');
        if (!response.ok) throw new Error('Failed to fetch YouTube content.');
        const data = await response.json();
        
        latestContainer.innerHTML = '';
        playlistsContainer.innerHTML = '';

        if (data.latest_videos && data.latest_videos.length > 0) {
            data.latest_videos.forEach(video => {
                const videoCard = createVideoCard(video);
                latestContainer.appendChild(videoCard);
            });
        } else {
            latestContainer.innerHTML = '<p>No recent videos found.</p>';
        }

        if (data.playlists && data.playlists.length > 0) {
            data.playlists.forEach(playlist => {
                const playlistCard = createPlaylistCard(playlist);
                playlistsContainer.appendChild(playlistCard);
            });
        }
        
        // Send the new height after the content has been added to the page
        sendHeightToParent();

    } catch (error) {
        console.error('Error loading YouTube content:', error);
        latestContainer.innerHTML = '<p>Could not load video content at this time.</p>';
        // Send height even on error to size the error message correctly
        sendHeightToParent();
    }
}

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