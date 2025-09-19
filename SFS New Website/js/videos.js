document.addEventListener('DOMContentLoaded', () => {
    // This function runs when the videos.html page has loaded
    loadYoutubeContent();
});

async function loadYoutubeContent() {
    const container = document.getElementById('video-gallery-container');
    try {
        const response = await fetch('/api/youtube_content');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();

        // Clear the initial "Loading..." message
        container.innerHTML = '';

        // Check for and display the latest video
        if (data.latest_video) {
            const latestSection = createVideoElement('Latest Video', data.latest_video);
            container.appendChild(latestSection);
        }

        // Check for and display the most popular video
        if (data.popular_video) {
            const popularSection = createVideoElement('Most Popular Video', data.popular_video);
            container.appendChild(popularSection);
        }

        if (!data.latest_video && !data.popular_video) {
            container.innerHTML = '<p>Could not find any videos to display.</p>';
        }

    } catch (error) {
        console.error('Error loading YouTube content:', error);
        container.innerHTML = '<p>There was an error loading video content.</p>';
    }
}

/**
 * Creates a complete video section with a title and an embedded player.
 * @param {string} heading - The title for this section (e.g., "Latest Video").
 * @param {object} video - The video data object from our API.
 * @returns {HTMLElement} - The complete HTML element for the video section.
 */
function createVideoElement(heading, video) {
    const section = document.createElement('div');
    section.classList.add('video-section');

    const title = document.createElement('h3');
    title.textContent = heading;
    section.appendChild(title);

    // Create a responsive wrapper for the video player
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add('video-wrapper');
    
    // Create the YouTube iframe embed
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${video.id}`;
    iframe.title = video.title;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    
    videoWrapper.appendChild(iframe);
    section.appendChild(videoWrapper);

    // Add the video's title below the player
    const videoTitle = document.createElement('p');
    videoTitle.classList.add('video-title');
    videoTitle.textContent = video.title;
    section.appendChild(videoTitle);

    return section;
}