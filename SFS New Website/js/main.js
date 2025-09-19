document.addEventListener('DOMContentLoaded', () => {
    fetchChannelStats();
    setInterval(fetchChannelStats, 60000); // 60000 milliseconds = 60 seconds
    
    buildSlideshow();
});

async function buildSlideshow() {
    try {
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Network response was not ok');
        const mediaFiles = await response.json();
        
        const slideshowContainer = document.getElementById('slideshow-container');
        if (!slideshowContainer || mediaFiles.length === 0) return;

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

        const slides = document.querySelectorAll('.slideshow-item');
        let currentIndex = -1;

        function playNextSlide() {
            if (currentIndex > -1) {
                slides[currentIndex].classList.remove('active');
            }
            currentIndex = (currentIndex + 1) % slides.length;
            const currentSlide = slides[currentIndex];
            currentSlide.classList.add('active');

            if (currentSlide.tagName === 'VIDEO') {
                currentSlide.currentTime = 0;
                currentSlide.play();
                currentSlide.onended = playNextSlide;
            } else {
                setTimeout(playNextSlide, 5000);
            }
        }
        playNextSlide();
    } catch (error) {
        console.error('There was a problem building the slideshow:', error);
    }
}

async function fetchChannelStats() {
    try {
        const response = await fetch('/api/channel-stats');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const subscriberElement = document.getElementById('subscriber-count');
        const viewElement = document.getElementById('view-count');
        
        if (subscriberElement && data.subscribers) {
            subscriberElement.textContent = new Intl.NumberFormat().format(data.subscribers);
        } else {
            subscriberElement.textContent = "Error";
        }

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