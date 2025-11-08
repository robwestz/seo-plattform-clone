"""Backlinks resource"""
from typing import Dict, Any, Optional


class Backlinks:
    """Backlinks resource - Monitor and analyze backlinks"""

    def __init__(self, client):
        self.client = client

    def list(
        self,
        project_id: str,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List backlinks for a project

        Args:
            project_id: Project ID
            status: Filter by status ('active', 'lost', 'pending')

        Returns:
            Dictionary with backlinks data
        """
        params = {}
        if status:
            params['status'] = status

        return self.client.request(
            'GET',
            f'/projects/{project_id}/backlinks',
            params=params,
        )

    def stats(self, project_id: str) -> Dict[str, Any]:
        """
        Get backlink statistics

        Args:
            project_id: Project ID

        Returns:
            Backlink statistics
        """
        return self.client.request('GET', f'/projects/{project_id}/backlinks/stats')

    def refresh(self, project_id: str) -> None:
        """
        Refresh backlinks for a project

        Args:
            project_id: Project ID
        """
        self.client.request('POST', f'/projects/{project_id}/backlinks/refresh')
