document.addEventListener('DOMContentLoaded', () => {
    // --- NEW: A function to send the content height to the parent page ---
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
        const allPosts = document.querySelectorAll('.announcement-post');

        allPosts.forEach(post => {
            const postText = post.textContent.toLowerCase();
            if (postText.includes(searchTerm)) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
        // Send new height after filtering
        sendHeightToParent();
    });

    // --- ARCHIVE BUTTON LOGIC ---
    const toggleBtn = document.getElementById('toggle-archive-btn');
    const archiveContainer = document.getElementById('archive-container');
    let isArchiveLoaded = false;

    toggleBtn.addEventListener('click', async () => {
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
        
        const isHidden = archiveContainer.style.display === 'none';
        if (isHidden) {
            archiveContainer.style.display = 'block';
            toggleBtn.textContent = 'Hide Archive';
        } else {
            archiveContainer.style.display = 'none';
            toggleBtn.textContent = 'Show Archive';
        }
        // Send new height after toggling the archive
        sendHeightToParent();
    });
});