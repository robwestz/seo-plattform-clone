"""
SEO Intelligence Platform SDK Client
"""
from typing import Optional, Dict, Any, Callable
import requests
import socketio

from .resources.projects import Projects
from .resources.keywords import Keywords
from .resources.rankings import Rankings
from .resources.audits import Audits
from .resources.backlinks import Backlinks


class SEOPlatform:
    """
    SEO Intelligence Platform SDK Client

    Example:
        >>> from seo_platform import SEOPlatform
        >>>
        >>> client = SEOPlatform(api_key='your-api-key')
        >>>
        >>> # List projects
        >>> projects = client.projects.list()
        >>>
        >>> # Track keyword rankings
        >>> rankings = client.rankings.track('project-id', ['keyword-id-1'])
        >>>
        >>> # Listen to real-time updates
        >>> @client.on('ranking:updated')
        >>> def handle_ranking_update(data):
        >>>     print('Ranking updated:', data)
        >>>
        >>> client.connect()
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.seo-platform.com",
        version: str = "v1",
        timeout: int = 30,
        enable_websocket: bool = False,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize SEO Platform client

        Args:
            api_key: API key or JWT token for authentication
            base_url: Base URL for the API (default: https://api.seo-platform.com)
            version: API version (default: v1)
            timeout: Request timeout in seconds (default: 30)
            enable_websocket: Enable WebSocket real-time updates (default: False)
            headers: Custom headers to include in all requests
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.version = version
        self.timeout = timeout
        self.enable_websocket = enable_websocket

        # Initialize HTTP session
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'X-API-Version': version,
            **(headers or {}),
        })

        # Initialize resource clients
        self.projects = Projects(self)
        self.keywords = Keywords(self)
        self.rankings = Rankings(self)
        self.audits = Audits(self)
        self.backlinks = Backlinks(self)

        # Initialize WebSocket if enabled
        self.sio: Optional[socketio.Client] = None
        if enable_websocket:
            self._initialize_websocket()

    def _initialize_websocket(self):
        """Initialize WebSocket connection"""
        self.sio = socketio.Client()

        @self.sio.event
        def connect():
            print('WebSocket connected')

        @self.sio.event
        def disconnect():
            print('WebSocket disconnected')

        @self.sio.event
        def connect_error(data):
            print('WebSocket connection error:', data)

    def connect(self):
        """Connect to WebSocket server"""
        if not self.sio:
            raise RuntimeError('WebSocket not enabled. Set enable_websocket=True')

        self.sio.connect(
            f'{self.base_url}/realtime',
            auth={'token': self.api_key},
            transports=['websocket'],
        )

    def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.sio and self.sio.connected:
            self.sio.disconnect()

    def subscribe_to_project(self, project_id: str):
        """Subscribe to project events"""
        if not self.sio or not self.sio.connected:
            raise RuntimeError('WebSocket not connected')

        self.sio.emit('subscribe:project', {'projectId': project_id})

    def unsubscribe_from_project(self, project_id: str):
        """Unsubscribe from project events"""
        if not self.sio or not self.sio.connected:
            return

        self.sio.emit('unsubscribe:project', {'projectId': project_id})

    def on(self, event: str) -> Callable:
        """
        Decorator to register WebSocket event handler

        Example:
            >>> @client.on('ranking:updated')
            >>> def handle_ranking(data):
            >>>     print(data)
        """
        if not self.sio:
            raise RuntimeError('WebSocket not enabled')

        return self.sio.on(event)

    def off(self, event: str, handler: Optional[Callable] = None):
        """Remove WebSocket event handler"""
        if self.sio:
            if handler:
                self.sio.off(event, handler)
            else:
                self.sio.off(event)

    def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """
        Make an HTTP request to the API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (without base URL)
            params: Query parameters
            json: JSON body data

        Returns:
            Response data

        Raises:
            requests.HTTPError: If request fails
        """
        url = f'{self.base_url}/api/{self.version}/{endpoint.lstrip("/")}'

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=json,
                timeout=self.timeout,
            )

            # Handle rate limiting
            if response.status_code == 429:
                retry_after = response.headers.get('Retry-After', 'unknown')
                raise Exception(
                    f'Rate limit exceeded. Retry after {retry_after} seconds.'
                )

            # Handle authentication errors
            if response.status_code == 401:
                raise Exception('Authentication failed. Check your API key.')

            response.raise_for_status()
            return response.json() if response.content else None

        except requests.RequestException as e:
            raise Exception(f'API request failed: {str(e)}')

    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status"""
        return self.request('GET', '/rate-limit/status')

    def __enter__(self):
        """Context manager entry"""
        if self.enable_websocket:
            self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.sio and self.sio.connected:
            self.disconnect()
        self.session.close()
