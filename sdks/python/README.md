# SEO Intelligence Platform - Python SDK

Official Python SDK for the SEO Intelligence Platform API.

## Installation

```bash
pip install seo-platform-sdk
```

## Quick Start

```python
from seo_platform import SEOPlatform

# Initialize client
client = SEOPlatform(api_key='your-api-key')

# List projects
projects = client.projects.list()

# Create a project
project = client.projects.create(
    name='My Website',
    domain='example.com',
    target_country='US',
    target_language='en',
)

# Add keywords
keyword = client.keywords.create(
    project_id=project['id'],
    keyword='best seo tools',
    tags=['tools', 'seo'],
)

# Track rankings
rankings = client.rankings.track(
    project_id=project['id'],
    keyword_ids=[keyword['id']],
)

# Start site audit
audit = client.audits.start(project_id=project['id'])
```

## Real-time Updates

Enable WebSocket for real-time updates:

```python
from seo_platform import SEOPlatform

# Initialize client with WebSocket enabled
client = SEOPlatform(
    api_key='your-api-key',
    enable_websocket=True,
)

# Connect to WebSocket
client.connect()

# Subscribe to project events
client.subscribe_to_project('project-id')

# Register event handlers
@client.on('ranking:updated')
def handle_ranking_update(data):
    print('Ranking updated:', data)

@client.on('audit:progress')
def handle_audit_progress(data):
    print('Audit progress:', data['progress'])

# Keep connection alive
import time
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    client.disconnect()
```

## API Resources

### Projects

```python
# List projects
result = client.projects.list(limit=50)
projects = result['data']

# Get project
project = client.projects.get('project-id')

# Update project
client.projects.update('project-id', name='New Name')

# Delete project
client.projects.delete('project-id')
```

### Keywords

```python
# List keywords
result = client.keywords.list('project-id')
keywords = result['data']

# Add keyword
keyword = client.keywords.create(
    project_id='project-id',
    keyword='seo analytics',
)

# Get suggestions
suggestions = client.keywords.suggestions('seo', limit=10)

# Delete keyword
client.keywords.delete('keyword-id')
```

### Rankings

```python
# Get current rankings
result = client.rankings.list('project-id')
rankings = result['data']

# Get ranking history
history = client.rankings.history('keyword-id', days=30)

# Track rankings
rankings = client.rankings.track(
    project_id='project-id',
    keyword_ids=['keyword-1', 'keyword-2'],
)
```

### Audits

```python
# List audits
audits = client.audits.list('project-id')

# Start audit
audit = client.audits.start('project-id', max_pages=1000)

# Get latest audit
latest = client.audits.latest('project-id')

# Cancel audit
client.audits.cancel('audit-id')
```

### Backlinks

```python
# List backlinks
result = client.backlinks.list('project-id')
backlinks = result['data']

# Get stats
stats = client.backlinks.stats('project-id')
print(f"Total backlinks: {stats['total']}")
print(f"Active: {stats['active']}")
print(f"Lost: {stats['lost']}")

# Refresh backlinks
client.backlinks.refresh('project-id')
```

## Context Manager

Use the client as a context manager for automatic connection handling:

```python
from seo_platform import SEOPlatform

with SEOPlatform(api_key='your-api-key', enable_websocket=True) as client:
    # Subscribe to events
    @client.on('ranking:updated')
    def handle_ranking(data):
        print(data)

    # Use the client
    projects = client.projects.list()

    # WebSocket automatically disconnects when exiting context
```

## Error Handling

```python
try:
    project = client.projects.get('invalid-id')
except Exception as e:
    print(f'Error: {e}')
```

## Rate Limiting

The SDK automatically handles rate limiting:

```python
try:
    projects = client.projects.list()
except Exception as e:
    if 'Rate limit exceeded' in str(e):
        print('Please retry after the specified time')
```

## Configuration

```python
client = SEOPlatform(
    api_key='your-api-key',
    base_url='https://api.seo-platform.com',  # Custom API URL
    version='v1',  # API version
    timeout=30,  # Request timeout in seconds
    enable_websocket=True,  # Enable real-time updates
    headers={'Custom-Header': 'value'},  # Custom headers
)
```

## Requirements

- Python 3.8+
- requests>=2.28.0
- python-socketio[client]>=5.9.0

## License

MIT
