/**
 * @file main.js
 * @description This script handles all the dynamic functionality for the main index.html page,
 * including the background slideshow, YouTube channel stats, and iframe resizing.
 */

// ==============================================================================
// IFRAME RESIZING LISTENER
// Listens for messages from child pages (e.g., announcements.html) and resizes
// the iframe to fit their content, preventing double scrollbars.
// ==============================================================================
window.addEventListener('message', event => {
    // Check if the received message is the one we're looking for
    if (event.data && event.data.type === 'resize-iframe') {
        const iframe = document.querySelector('iframe[name="contentFrame"]');
        if (iframe) {
            // Set the iframe height to the height sent by the child, plus some extra padding
            iframe.style.height = (event.data.height + 20) + 'px';
        }
    }
});

// ==============================================================================
// MAIN SCRIPT EXECUTION
// Runs when the main page has finished loading.
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Fetch channel stats once on initial load
    fetchChannelStats();
    
    // Build the background slideshow
    buildSlideshow();
});

/**
 * Builds and controls the dynamic background slideshow.
 * Fetches media from the /api/media endpoint and cycles through them.
 */
async function buildSlideshow() {
    try {
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Network response was not ok');
        const mediaFiles = await response.json();
        
        const slideshowContainer = document.getElementById('slideshow-container');
        if (!slideshowContainer || mediaFiles.length === 0) return;

        // Create and append an <img> or <video> element for each media file
        mediaFiles.forEach(media => {
            let element;
            if (media.type === 'image') {
                element = document.createElement('img');
                element.src = media.path;
            } else if (media.type === 'video') {
                element = document.createElement('video');
                element.src = media.path;
                element.muted = true;
                element.playsInline = true;
            }
            element.classList.add('slideshow-item');
            slideshowContainer.appendChild(element);
        });

        // Slideshow cycling logic
        const slides = document.querySelectorAll('.slideshow-item');
        let currentIndex = -1;

        function playNextSlide() {
            if (currentIndex > -1) {
                slides[currentIndex].classList.remove('active');
            }
            currentIndex = (currentIndex + 1) % slides.length;
            const currentSlide = slides[currentIndex];
            currentSlide.classList.add('active');

            // Handle variable duration for videos
            if (currentSlide.tagName === 'VIDEO') {
                currentSlide.currentTime = 0;
                currentSlide.play();
                currentSlide.onended = playNextSlide;
            } else {
                // Use a fixed duration for images
                setTimeout(playNextSlide, 5000);
            }
        }
        playNextSlide(); // Start the slideshow
    } catch (error) {
        console.error('There was a problem building the slideshow:', error);
    }
}

/**
 * Fetches the YouTube channel stats (subscribers and views) from the backend.
 * The backend API handles caching to protect the API quota.
 */
async function fetchChannelStats() {
    try {
        const response = await fetch('/api/channel-stats');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const subscriberElement = document.getElementById('subscriber-count');
        const viewElement = document.getElementById('view-count');
        
        // Update subscriber count with number formatting
        if (subscriberElement && data.subscribers) {
            subscriberElement.textContent = new Intl.NumberFormat().format(data.subscribers);
        } else {
            subscriberElement.textContent = "Error";
        }

        // Update view count with number formatting
        if (viewElement && data.views) {
            viewElement.textContent = new Intl.NumberFormat().format(data.views);
        } else {
            viewElement.textContent = "Error";
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        const subscriberElement = document.getElementById('subscriber-count');
        const viewElement = document.getElementById('view-count');
        if (subscriberElement) subscriberElement.textContent = "Unavailable";
        if (viewElement) viewElement.textContent = "Unavailable";
    }
}
