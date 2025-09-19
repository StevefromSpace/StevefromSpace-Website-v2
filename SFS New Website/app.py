import os
import time
from flask import Flask, jsonify, send_from_directory
from googleapiclient.discovery import build

app = Flask(__name__, static_folder='.', static_url_path='')

# --- SECURE PRODUCTION VERSION ---
# The API key is now read from the server's environment variables.
API_KEY = os.environ.get('YOUTUBE_API_KEY')
CHANNEL_ID = 'UCt2aQJmbRJ03JT_fDN7bSZQ'

# --- CACHING SETUP ---
# We will store results for 1 hour (3600 seconds) to save API quota
CACHE_DURATION = 3600 
stats_cache = {'data': None, 'timestamp': 0}
youtube_content_cache = {'data': None, 'timestamp': 0}

# --- UPDATED FUNCTION WITH CACHING ---
def get_channel_stats():
    """Fetches channel statistics from cache or the YouTube API."""
    current_time = time.time()
    # If cache is valid, return the cached data
    if stats_cache['data'] and (current_time - stats_cache['timestamp'] < CACHE_DURATION):
        print("Returning cached channel stats.")
        return stats_cache['data']
    
    print("Fetching new channel stats from API...")
    try:
        # Check if API_KEY is available
        if not API_KEY:
            print("Error: YOUTUBE_API_KEY environment variable not set")
            return None
            
        youtube = build('youtube', 'v3', developerKey=API_KEY)
        request = youtube.channels().list(part='statistics', id=CHANNEL_ID)
        response = request.execute()
        stats = response['items'][0]['statistics'] if 'items' in response and response['items'] else None
        
        # If the fetch was successful, update the cache
        if stats:
            stats_cache['data'] = stats
            stats_cache['timestamp'] = current_time
            print("Channel stats cached successfully")
        return stats
    except Exception as e:
        print(f"An error occurred fetching channel stats: {e}")
        return None

# --- UPDATED FUNCTION WITH CACHING ---
def get_youtube_content():
    """Fetches YouTube content from cache or the API."""
    current_time = time.time()
    # If cache is valid, return the cached data
    if youtube_content_cache['data'] and (current_time - youtube_content_cache['timestamp'] < CACHE_DURATION):
        print("Returning cached YouTube content.")
        return youtube_content_cache['data']
    
    print("Fetching new YouTube content from API...")
    try:
        # Check if API_KEY is available
        if not API_KEY:
            print("Error: YOUTUBE_API_KEY environment variable not set")
            return None
            
        youtube = build('youtube', 'v3', developerKey=API_KEY)
        
        videos_request = youtube.search().list(
            part="snippet", 
            channelId=CHANNEL_ID, 
            maxResults=4, 
            order="date", 
            type="video"
        )
        videos_response = videos_request.execute()
        latest_videos = []
        for item in videos_response.get("items", []):
            latest_videos.append({
                'id': item['id']['videoId'], 
                'title': item['snippet']['title'], 
                'thumbnail': item['snippet']['thumbnails']['high']['url']
            })

        playlists_request = youtube.playlists().list(
            part="snippet,contentDetails", 
            channelId=CHANNEL_ID, 
            maxResults=25
        )
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
        
        # If the fetch was successful, update the cache
        if content and (latest_videos or playlists):
            youtube_content_cache['data'] = content
            youtube_content_cache['timestamp'] = current_time
            print("YouTube content cached successfully")
        return content
    except Exception as e:
        print(f"An error occurred while fetching YouTube content: {e}")
        return None

@app.route('/api/media')
def get_media_files():
    """Scans the slideshow folders and returns a list of media files."""
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

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/channel-stats')
def api_channel_stats():
    stats = get_channel_stats()
    if stats:
        return jsonify(subscribers=stats.get('subscriberCount'), views=stats.get('viewCount'))
    else:
        return jsonify(error="Could not retrieve channel stats"), 500
    
@app.route('/api/youtube_content')
def api_youtube_content():
    content = get_youtube_content()
    if content:
        return jsonify(content)
    else:
        return jsonify(error="Could not retrieve YouTube content"), 500