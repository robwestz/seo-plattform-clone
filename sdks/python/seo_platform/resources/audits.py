"""Audits resource"""
from typing import List, Dict, Any, Optional


class Audits:
    """Audits resource - Manage site audits"""

    def __init__(self, client):
        self.client = client

    def list(self, project_id: str) -> List[Dict[str, Any]]:
        """
        List audits for a project

        Args:
            project_id: Project ID

        Returns:
            List of audits
        """
        return self.client.request('GET', f'/projects/{project_id}/audits')

    def get(self, audit_id: str) -> Dict[str, Any]:
        """
        Get an audit by ID

        Args:
            audit_id: Audit ID

        Returns:
            Audit data
        """
        return self.client.request('GET', f'/audits/{audit_id}')

    def start(self, project_id: str, max_pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Start a new audit

        Args:
            project_id: Project ID
            max_pages: Maximum pages to scan (optional)

        Returns:
            Started audit data
        """
        data = {}
        if max_pages is not None:
            data['maxPages'] = max_pages

        return self.client.request(
            'POST',
            f'/projects/{project_id}/audits',
            json=data,
        )

    def cancel(self, audit_id: str) -> None:
        """
        Cancel a running audit

        Args:
            audit_id: Audit ID
        """
        self.client.request('POST', f'/audits/{audit_id}/cancel')

    def latest(self, project_id: str) -> Dict[str, Any]:
        """
        Get latest audit for a project

        Args:
            project_id: Project ID

        Returns:
            Latest audit data
        """
        return self.client.request('GET', f'/projects/{project_id}/audits/latest')
