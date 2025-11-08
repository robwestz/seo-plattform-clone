from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="seo-platform-sdk",
    version="1.0.0",
    author="SEO Intelligence Platform",
    author_email="support@seo-platform.com",
    description="Official Python SDK for SEO Intelligence Platform API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/seo-platform/python-sdk",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "python-socketio[client]>=5.9.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "flake8>=6.0.0",
        ],
    },
    keywords="seo analytics keywords rankings backlinks audit api sdk",
    project_urls={
        "Bug Reports": "https://github.com/seo-platform/python-sdk/issues",
        "Source": "https://github.com/seo-platform/python-sdk",
        "Documentation": "https://docs.seo-platform.com",
    },
)
