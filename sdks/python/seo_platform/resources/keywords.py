"""Keywords resource"""
from typing import List, Dict, Any, Optional


class Keywords:
    """Keywords resource - Manage keyword tracking"""

    def __init__(self, client):
        self.client = client

    def list(self, project_id: str) -> Dict[str, Any]:
        """
        List keywords for a project

        Args:
            project_id: Project ID

        Returns:
            Dictionary with keywords data
        """
        return self.client.request('GET', f'/projects/{project_id}/keywords')

    def get(self, keyword_id: str) -> Dict[str, Any]:
        """
        Get a keyword by ID

        Args:
            keyword_id: Keyword ID

        Returns:
            Keyword data
        """
        return self.client.request('GET', f'/keywords/{keyword_id}')

    def create(
        self,
        project_id: str,
        keyword: str,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Add a keyword to a project

        Args:
            project_id: Project ID
            keyword: Keyword text
            tags: Optional tags

        Returns:
            Created keyword data
        """
        data = {'keyword': keyword}
        if tags:
            data['tags'] = tags

        return self.client.request(
            'POST',
            f'/projects/{project_id}/keywords',
            json=data,
        )

    def delete(self, keyword_id: str) -> None:
        """
        Delete a keyword

        Args:
            keyword_id: Keyword ID
        """
        self.client.request('DELETE', f'/keywords/{keyword_id}')

    def suggestions(self, seed: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get keyword suggestions

        Args:
            seed: Seed keyword
            limit: Number of suggestions (default: 10)

        Returns:
            List of keyword suggestions
        """
        return self.client.request(
            'GET',
            '/keywords/suggestions',
            params={'seed': seed, 'limit': limit},
        )
