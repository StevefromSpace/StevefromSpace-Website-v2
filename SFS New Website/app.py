# ==============================================================================
# IMPORTS & INITIAL SETUP
# ==============================================================================
import os
import time
import threading  # --- ADDED FOR CACHE WARMING ---
from flask import Flask, jsonify, send_from_directory
from googleapiclient.discovery import build

# Initialize the Flask application
app = Flask(__name__, static_folder='.', static_url_path='')


# ==============================================================================
# CONFIGURATION & CACHING
# ==============================================================================

# --- SECURE PRODUCTION CONFIGURATION ---
# The API key is read from the server's environment variables.
# This is a security best practice to avoid exposing secret keys in the code.
API_KEY = os.environ.get('YOUTUBE_API_KEY')
CHANNEL_ID = 'UCt2aQJmbRJ03JT_fDN7bSZQ'

# --- CACHING SETUP ---
# A simple in-memory cache to store API results and reduce quota usage.
# The cache is valid for 5 hours (18000 seconds).
CACHE_DURATION = 18000
stats_cache = {'data': None, 'timestamp': 0}
youtube_content_cache = {'data': None, 'timestamp': 0}


# ==============================================================================
# YOUTUBE API HELPER FUNCTIONS
# ==============================================================================

def get_channel_stats():
    """
    Fetches channel statistics (subscribers and views) from the YouTube API.
    It uses an in-memory cache to avoid excessive API calls.
    Includes a failsafe to return stale data if a live API call fails.
    """
    current_time = time.time()
    # Check if valid, non-expired data exists in the cache
    if stats_cache['data'] and (current_time - stats_cache['timestamp'] < CACHE_DURATION):
        print("Returning cached channel stats.")
        return stats_cache['data']

    print("Fetching new channel stats from API...")
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY environment variable not set.")
        return None # Return None if the key is missing

    try:
        youtube = build('youtube', 'v3', developerKey=API_KEY)
        request = youtube.channels().list(part='statistics', id=CHANNEL_ID)
        response = request.execute()
        stats = response['items'][0]['statistics'] if 'items' in response and response['items'] else None

        # If the fetch was successful, update the cache
        if stats:
            stats_cache['data'] = stats
            stats_cache['timestamp'] = current_time
        return stats
    except Exception as e:
        # Failsafe: Log the error and return the old (stale) data if it exists
        print(f"!!! YOUTUBE API ERROR (get_channel_stats): {e}. Serving stale data from cache. !!!")
        return stats_cache['data']

def get_youtube_content():
    """
    Fetches recent videos and playlists from the YouTube channel.
    Uses an in-memory cache and includes a failsafe to return stale data on error.
    """
    current_time = time.time()
    # Check if valid, non-expired data exists in the cache
    if youtube_content_cache['data'] and (current_time - youtube_content_cache['timestamp'] < CACHE_DURATION):
        print("Returning cached YouTube content.")
        return youtube_content_cache['data']

    print("Fetching new YouTube content from API...")
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY environment variable not set.")
        return None # Return None if the key is missing

    try:
        youtube = build('youtube', 'v3', developerKey=API_KEY)

        # Fetch the 4 most recent videos
        videos_request = youtube.search().list(part="snippet", channelId=CHANNEL_ID, maxResults=4, order="date", type="video")
        videos_response = videos_request.execute()
        latest_videos = []
        for item in videos_response.get("items", []):
            latest_videos.append({
                'id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'thumbnail': item['snippet']['thumbnails']['high']['url']
            })

        # Fetch the channel's public playlists
        playlists_request = youtube.playlists().list(part="snippet,contentDetails", channelId=CHANNEL_ID, maxResults=25)
        playlists_response = playlists_request.execute()
        playlists = []
        for item in playlists_response.get("items", []):
            playlists.append({
                'id': item['id'],
                'title': item['snippet']['title'],
                'video_count': item['contentDetails']['itemCount'],
                'thumbnail': item['snippet']['thumbnails']['high']['url']
            })

        content = {'latest_videos': latest_videos, 'playlists': playlists}

        # Update the cache only if we received valid data
        if content and (latest_videos or playlists):
            youtube_content_cache['data'] = content
            youtube_content_cache['timestamp'] = current_time
        return content
    except Exception as e:
        # Failsafe: Log the error and return the old (stale) data if it exists
        print(f"!!! YOUTUBE API ERROR (get_youtube_content): {e}. Serving stale data from cache. !!!")
        return youtube_content_cache['data']

# --- ADDED FOR CACHE WARMING ---
def warm_up_cache():
    """
    A target function to run in a background thread on startup.
    It calls the YouTube API functions to populate the cache.
    """
    print("Background cache warming started...")
    get_channel_stats()
    get_youtube_content()
    print("...background cache warming finished.")
# --- END ADDED SECTION ---


# ==============================================================================
# FLASK API ROUTES & STATIC FILE SERVING
# ==============================================================================

@app.route('/api/media')
def get_media_files():
    """Provides a list of local images and videos for the background slideshow."""
    media_list = []
    image_dir = 'images/slideshow'
    video_dir = 'videos/slideshow'
    try:
        for filename in os.listdir(image_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                media_list.append({'type': 'image', 'path': os.path.join(image_dir, filename)})
    except FileNotFoundError:
        print(f"Warning: The directory '{image_dir}' was not found.")
    try:
        for filename in os.listdir(video_dir):
            if filename.lower().endswith(('.mp4', '.webm', '.ogg')):
                media_list.append({'type': 'video', 'path': os.path.join(video_dir, filename)})
    except FileNotFoundError:
        print(f"Warning: The directory '{video_dir}' was not found.")
    return jsonify(media_list)

@app.route('/api/channel-stats')
def api_channel_stats():
    """API endpoint to provide YouTube channel stats to the frontend."""
    stats = get_channel_stats()
    if stats:
        return jsonify(subscribers=stats.get('subscriberCount'), views=stats.get('viewCount'))
    else:
        return jsonify(error="Could not retrieve channel stats"), 500

@app.route('/api/youtube_content')
def api_youtube_content():
    """API endpoint to provide YouTube videos and playlists to the frontend."""
    content = get_youtube_content()
    if content:
        return jsonify(content)
    else:
        return jsonify(error="Could not retrieve YouTube content"), 500

@app.route('/')
def index():
    """Serves the main index.html page."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serves all other static files (css, js, images, etc.)."""
    return send_from_directory('.', filename)

# --- ADDED FOR CACHE WARMING ---
# This block ensures the cache warming runs only when the app is started
# by a production server like Gunicorn, not when run directly for local testing.
if __name__ != '__main__':
    print("Starting background cache warming thread...")
    cache_thread = threading.Thread(target=warm_up_cache)
    cache_thread.daemon = True  # Allows main app to exit even if thread is running
    cache_thread.start()
# --- END ADDED SECTION ---