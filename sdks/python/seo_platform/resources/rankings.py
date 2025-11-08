"""Rankings resource"""
from typing import List, Dict, Any, Optional


class Rankings:
    """Rankings resource - Track search engine rankings"""

    def __init__(self, client):
        self.client = client

    def list(
        self,
        project_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Get current rankings for a project

        Args:
            project_id: Project ID
            limit: Number of rankings to return
            offset: Offset for pagination

        Returns:
            Dictionary with rankings data
        """
        return self.client.request(
            'GET',
            f'/projects/{project_id}/rankings',
            params={'limit': limit, 'offset': offset},
        )

    def history(self, keyword_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get ranking history for a keyword

        Args:
            keyword_id: Keyword ID
            days: Number of days of history (default: 30)

        Returns:
            List of historical ranking data points
        """
        return self.client.request(
            'GET',
            f'/keywords/{keyword_id}/rankings/history',
            params={'days': days},
        )

    def track(self, project_id: str, keyword_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Track rankings for keywords

        Args:
            project_id: Project ID
            keyword_ids: List of keyword IDs to track

        Returns:
            List of ranking results
        """
        return self.client.request(
            'POST',
            f'/projects/{project_id}/rankings/track',
            json={'keywordIds': keyword_ids},
        )
