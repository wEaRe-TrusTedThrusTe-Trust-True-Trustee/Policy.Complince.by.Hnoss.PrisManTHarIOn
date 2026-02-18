#!/usr/bin/env python3
"""
URL Extraction Script for ANALYSE_BERICHT.md
Extrahiert und kategorisiert alle URLs aus dem Analyse-Bericht
"""

import re
from collections import defaultdict
from urllib.parse import urlparse

def extract_urls_from_file(filepath):
    """Liest die Datei und extrahiert alle URLs"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regulärer Ausdruck für URLs (http und https)
    url_pattern = r'https?://[^\s\)\]<>"]+[^\s\)\]<>"\',.]'
    urls = re.findall(url_pattern, content)
    
    # Bereinige URLs (entferne trailing characters)
    cleaned_urls = []
    for url in urls:
        # Entferne trailing quotes, brackets etc.
        url = url.rstrip('"\',;:')
        cleaned_urls.append(url)
    
    return list(set(cleaned_urls))  # Entferne Duplikate

def categorize_url(url):
    """Kategorisiert eine URL nach Typ und Kategorie"""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    path = parsed.path.lower()
    
    # Bestimme TYPE
    url_type = "other"
    if "github.com" in domain:
        if "/user-attachments/assets/" in path:
            url_type = "asset"
        else:
            url_type = "github"
    elif "lovable.dev" in domain:
        url_type = "lovable"
    elif "supabase.co" in domain:
        url_type = "supabase"
    elif "discord.gg" in domain or "discord.com" in domain or "dcbadge" in domain:
        url_type = "discord"
    elif "shields.io" in domain:
        url_type = "badge"
    elif "netlify.app" in domain:
        url_type = "netlify"
    elif "cal.com" in domain:
        url_type = "cal"
    elif "onbiela.dev" in domain:
        url_type = "onbiela"
    elif "macaly-app.com" in domain:
        url_type = "macaly"
    elif "microsoft.com" in domain or "nuget.org" in domain or "pypi.org" in domain:
        url_type = "package"
    elif "docker.com" in domain or "hub.docker.com" in domain:
        url_type = "docker"
    elif "kubernetes.io" in domain:
        url_type = "kubernetes"
    elif "portainer.io" in domain:
        url_type = "portainer"
    elif "vaultproject.io" in domain:
        url_type = "vault"
    elif "ollama.ai" in domain:
        url_type = "ai"
    elif "opensource.org" in domain:
        url_type = "license"
    
    # Bestimme CATEGORY
    category = "other"
    
    # AI & Technology
    if any(keyword in url.lower() for keyword in ["ai", "agent", "chatgpt", "gemini", "ollama", "machine-learning", "ml"]):
        category = "ai"
    # Infrastructure
    elif any(keyword in url.lower() for keyword in ["docker", "kubernetes", "portainer", "proxmox", "infrastructure", "deployment", "vault", "system"]):
        category = "infrastructure"
    # Development Tools
    elif any(keyword in url.lower() for keyword in ["framework", "package", "pypi", "nuget", "microsoft", "dotnet"]):
        category = "devtools"
    # Creative & Media
    elif any(keyword in url.lower() for keyword in ["3d", "modeling", "animation", "media", "hologram", "design"]):
        category = "creative"
    # Security & Compliance
    elif any(keyword in url.lower() for keyword in ["security", "compliance", "dsgvo", "policy", "ethik", "certificate", "eid"]):
        category = "security"
    # Data & Analytics
    elif any(keyword in url.lower() for keyword in ["database", "supabase", "data", "pipeline", "analytics"]):
        category = "data"
    # Digital Platforms
    elif any(keyword in url.lower() for keyword in ["lovable", "netlify", "website", "web", "platform"]):
        category = "platforms"
    # Documentation
    elif any(keyword in url.lower() for keyword in ["documentation", "docs", "learn", "readme"]):
        category = "documentation"
    
    return url_type, category

def get_repo_name(url):
    """Extrahiert den Repository-Namen aus GitHub URLs"""
    if "github.com" in url:
        parts = url.split("github.com/")
        if len(parts) > 1:
            repo_path = parts[1].split("/")
            if len(repo_path) >= 2:
                return f"{repo_path[0]}/{repo_path[1]}"
    return "N/A"

def get_description(url, url_type):
    """Generiert eine Beschreibung basierend auf URL und Typ"""
    descriptions = {
        "github": "GitHub Repository",
        "asset": "GitHub Asset Bild/Datei",
        "lovable": "Lovable.dev Projekt",
        "supabase": "Supabase Backend/Database",
        "discord": "Discord Server/Badge",
        "badge": "Shields.io Status Badge",
        "netlify": "Netlify Deployment",
        "onbiela": "Onbiela.dev Platform",
        "macaly": "Macaly App Platform",
        "package": "Package Registry (NuGet/PyPI)",
        "docker": "Docker Registry",
        "kubernetes": "Kubernetes Platform",
        "portainer": "Portainer Container Management",
        "vault": "HashiCorp Vault",
        "ai": "Ollama AI Platform",
        "license": "Open Source Lizenz",
        "cal": "Cal.com Scheduling",
    }
    return descriptions.get(url_type, "Web Resource")

def main():
    filepath = "ANALYSE_BERICHT.md"
    
    print("=" * 80)
    print("URL EXTRACTION REPORT - ANALYSE_BERICHT.md")
    print("=" * 80)
    print()
    
    # Extrahiere URLs
    urls = extract_urls_from_file(filepath)
    
    print(f"✅ Gefundene URLs: {len(urls)}")
    print()
    
    # Gruppiere URLs nach Typ
    urls_by_type = defaultdict(list)
    urls_by_category = defaultdict(list)
    
    for url in sorted(urls):
        url_type, category = categorize_url(url)
        urls_by_type[url_type].append(url)
        urls_by_category[category].append(url)
    
    # Ausgabe nach Typ gruppiert
    print("=" * 80)
    print("📊 URLS GRUPPIERT NACH TYP")
    print("=" * 80)
    print()
    
    for url_type in sorted(urls_by_type.keys()):
        print(f"\n### {url_type.upper()} ({len(urls_by_type[url_type])} URLs)")
        print("-" * 80)
        for url in sorted(urls_by_type[url_type]):
            print(f"  - {url}")
    
    # Ausgabe nach Kategorie gruppiert
    print("\n\n")
    print("=" * 80)
    print("📁 URLS GRUPPIERT NACH KATEGORIE")
    print("=" * 80)
    print()
    
    for category in sorted(urls_by_category.keys()):
        print(f"\n### {category.upper()} ({len(urls_by_category[category])} URLs)")
        print("-" * 80)
        for url in sorted(urls_by_category[category]):
            print(f"  - {url}")
    
    # Detaillierte strukturierte Ausgabe
    print("\n\n")
    print("=" * 80)
    print("📋 DETAILLIERTE STRUKTURIERTE URL-LISTE")
    print("=" * 80)
    print()
    
    for i, url in enumerate(sorted(urls), 1):
        url_type, category = categorize_url(url)
        repo = get_repo_name(url)
        description = get_description(url, url_type)
        
        print(f"\n--- URL #{i} ---")
        print(f"URL: {url}")
        print(f"TYPE: {url_type}")
        print(f"CATEGORY: {category}")
        print(f"REPO: {repo}")
        print(f"DESCRIPTION: {description}")
    
    # Exportiere in Textdatei
    output_file = "URL_EXTRACTION_RESULTS.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("URL EXTRACTION REPORT - ANALYSE_BERICHT.md\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total URLs found: {len(urls)}\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("DETAILLIERTE STRUKTURIERTE URL-LISTE\n")
        f.write("=" * 80 + "\n\n")
        
        for i, url in enumerate(sorted(urls), 1):
            url_type, category = categorize_url(url)
            repo = get_repo_name(url)
            description = get_description(url, url_type)
            
            f.write(f"\n--- URL #{i} ---\n")
            f.write(f"URL: {url}\n")
            f.write(f"TYPE: {url_type}\n")
            f.write(f"CATEGORY: {category}\n")
            f.write(f"REPO: {repo}\n")
            f.write(f"DESCRIPTION: {description}\n")
    
    print(f"\n\n✅ Ergebnisse wurden auch in '{output_file}' gespeichert!")
    print()

if __name__ == "__main__":
    main()
