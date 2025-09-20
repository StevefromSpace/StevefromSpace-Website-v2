/**
 * @file announcements.js
 * @description Handles all interactive features for the announcements.html page,
 * including the real-time search filter and the toggleable post archive.
 */

document.addEventListener('DOMContentLoaded', () => {
    /**
     * A reusable function to send the content height to the parent page (index.html).
     * This allows the iframe to resize automatically to prevent internal scrollbars.
     */
    function sendHeightToParent() {
        // A small delay helps ensure all content has rendered before we measure
        setTimeout(() => {
            const height = document.body.scrollHeight;
            parent.postMessage({ type: 'resize-iframe', height: height }, '*');
        }, 100);
    }
    
    // Send the initial height when the page loads
    sendHeightToParent();
    
    // --- SEARCH BAR LOGIC ---
    const searchInput = document.getElementById('announcement-search');
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        // This selector finds all announcement posts, whether new or archived
        const allPosts = document.querySelectorAll('.announcement-post');

        allPosts.forEach(post => {
            const postText = post.textContent.toLowerCase();
            // If the post text includes the search term, show it. Otherwise, hide it.
            if (postText.includes(searchTerm)) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
        // After filtering, recalculate and send the new page height
        sendHeightToParent();
    });

    // --- ARCHIVE BUTTON LOGIC ---
    const toggleBtn = document.getElementById('toggle-archive-btn');
    const archiveContainer = document.getElementById('archive-container');
    let isArchiveLoaded = false; // Flag to prevent fetching the archive more than once

    toggleBtn.addEventListener('click', async () => {
        // If the archive hasn't been loaded yet, fetch it from the HTML file
        if (!isArchiveLoaded) {
            try {
                const response = await fetch('previous_announcements.html');
                if (!response.ok) throw new Error('Could not fetch the archive file.');
                const archiveHtml = await response.text();
                archiveContainer.innerHTML = archiveHtml;
                isArchiveLoaded = true;
            } catch (error) {
                console.error('Failed to load archive:', error);
                archiveContainer.innerHTML = '<p>Error: Could not load archive content.</p>';
            }
        }
        
        // Toggle the visibility of the archive container
        const isHidden = archiveContainer.style.display === 'none';
        if (isHidden) {
            archiveContainer.style.display = 'block';
            toggleBtn.textContent = 'Hide Archive';
        } else {
            archiveContainer.style.display = 'none';
            toggleBtn.textContent = 'Show Archive';
        }
        // After showing/hiding, recalculate and send the new page height
        sendHeightToParent();
    });
});