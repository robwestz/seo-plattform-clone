"""Projects resource"""
from typing import List, Dict, Any, Optional


class Projects:
    """Projects resource - Manage SEO projects"""

    def __init__(self, client):
        self.client = client

    def list(self, limit: int = 50, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        List all projects

        Args:
            limit: Number of projects to return (default: 50)
            cursor: Pagination cursor

        Returns:
            Dictionary with 'data' and 'pagination' keys
        """
        params = {'limit': limit}
        if cursor:
            params['cursor'] = cursor

        return self.client.request('GET', '/projects', params=params)

    def get(self, project_id: str) -> Dict[str, Any]:
        """
        Get a project by ID

        Args:
            project_id: Project ID

        Returns:
            Project data
        """
        return self.client.request('GET', f'/projects/{project_id}')

    def create(
        self,
        name: str,
        domain: str,
        target_country: str,
        target_language: str,
    ) -> Dict[str, Any]:
        """
        Create a new project

        Args:
            name: Project name
            domain: Website domain
            target_country: Target country code (e.g., 'US')
            target_language: Target language code (e.g., 'en')

        Returns:
            Created project data
        """
        return self.client.request(
            'POST',
            '/projects',
            json={
                'name': name,
                'domain': domain,
                'targetCountry': target_country,
                'targetLanguage': target_language,
            },
        )

    def update(
        self,
        project_id: str,
        name: Optional[str] = None,
        domain: Optional[str] = None,
        target_country: Optional[str] = None,
        target_language: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Update a project

        Args:
            project_id: Project ID
            name: New project name
            domain: New domain
            target_country: New target country
            target_language: New target language
            is_active: Active status

        Returns:
            Updated project data
        """
        data = {}
        if name is not None:
            data['name'] = name
        if domain is not None:
            data['domain'] = domain
        if target_country is not None:
            data['targetCountry'] = target_country
        if target_language is not None:
            data['targetLanguage'] = target_language
        if is_active is not None:
            data['isActive'] = is_active

        return self.client.request('PUT', f'/projects/{project_id}', json=data)

    def delete(self, project_id: str) -> None:
        """
        Delete a project

        Args:
            project_id: Project ID
        """
        self.client.request('DELETE', f'/projects/{project_id}')
