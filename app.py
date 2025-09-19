import os
from flask import Flask, jsonify, send_from_directory
from googleapiclient.discovery import build

app = Flask(__name__, static_folder='.', static_url_path='')

# --- SECURITY UPDATE ---
# The API key is now securely read from the server's environment variables.
# The hardcoded key has been removed.
API_KEY = os.environ.get('YOUTUBE_API_KEY')
CHANNEL_ID = 'UCt2aQJmbRJ03JT_fDN7bSZQ'

def get_channel_stats():
    """Fetches channel statistics (subscribers and views) from the YouTube API."""
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY environment variable not set.")
        return None
    try:
        youtube = build('youtube', 'v3', developerKey=API_KEY)
        request = youtube.channels().list(
            part='statistics',
            id=CHANNEL_ID
        )
        response = request.execute()
        if 'items' in response and response['items']:
            return response['items'][0]['statistics']
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def get_youtube_content():
    """Fetches the latest and most popular videos from the YouTube channel."""
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY environment variable not set.")
        return None
    try:
        youtube = build('youtube', 'v3', developerKey=API_KEY)
        latest_request = youtube.search().list(part="snippet", channelId=CHANNEL_ID, maxResults=1, order="date", type="video")
        latest_response = latest_request.execute()
        latest_video_data = latest_response.get("items", [])[0] if latest_response.get("items") else None
        popular_request = youtube.search().list(part="snippet", channelId=CHANNEL_ID, maxResults=1, order="viewCount", type="video")
        popular_response = popular_request.execute()
        popular_video_data = popular_response.get("items", [])[0] if popular_response.get("items") else None
        content = {
            'latest_video': {'id': latest_video_data['id']['videoId'], 'title': latest_video_data['snippet']['title']} if latest_video_data else None,
            'popular_video': {'id': popular_video_data['id']['videoId'], 'title': popular_video_data['snippet']['title']} if popular_video_data else None,
        }
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