#!/usr/bin/env python3
"""
URL Extractor for ANALYSE_BERICHT.md
Extrahiert ALLE URLs und kategorisiert sie
"""

import re
import json
from collections import defaultdict
from urllib.parse import urlparse

def extract_urls_from_file(filepath):
    """Extrahiert alle URLs aus der Datei"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex für alle URLs (http:// und https://)
    url_pattern = r'https?://[^\s\)<>"\'\]]+(?:[^\s\)<>"\'\]\.])?'
    
    urls = []
    for match in re.finditer(url_pattern, content):
        url = match.group(0)
        # Bereinige URL (entferne trailing Sonderzeichen)
        url = url.rstrip('.,;:!?)')
        urls.append(url)
    
    return urls

def categorize_url(url):
    """Kategorisiert eine URL nach Typ und Kategorie"""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    path = parsed.path.lower()
    
    # Bestimme Typ
    url_type = "other"
    category = "other"
    description = ""
    
    # GitHub URLs
    if 'github.com' in domain:
        if '/user-attachments/assets/' in path:
            url_type = "github-asset"
            category = "creative"
            description = "GitHub Asset/Image"
        else:
            url_type = "github-repo"
            category = "devtools"
            description = "GitHub Repository"
    
    # Lovable.dev
    elif 'lovable.dev' in domain:
        url_type = "lovable"
        category = "platforms"
        description = "Lovable.dev Project"
    
    # Supabase
    elif 'supabase.co' in domain:
        url_type = "supabase"
        category = "infrastructure"
        description = "Supabase Database"
    
    # Shields.io (Badges)
    elif 'shields.io' in domain or 'img.shields.io' in domain:
        url_type = "badge"
        category = "documentation"
        description = "Shields.io Badge"
    
    # Discord
    elif 'discord.gg' in domain or 'dcbadge.limes.pink' in domain:
        url_type = "discord"
        category = "platforms"
        description = "Discord Server/Badge"
    
    # Netlify
    elif 'netlify.app' in domain or 'netlify.com' in domain:
        url_type = "infrastructure"
        category = "infrastructure"
        description = "Netlify Deployment"
    
    # Microsoft/Azure
    elif 'microsoft.com' in domain or 'azure.com' in domain:
        url_type = "documentation"
        category = "documentation"
        description = "Microsoft Documentation"
    
    # Docker
    elif 'docker.com' in domain or 'hub.docker.com' in domain:
        url_type = "registry"
        category = "infrastructure"
        description = "Docker Hub"
    
    # Kubernetes
    elif 'kubernetes.io' in domain:
        url_type = "documentation"
        category = "infrastructure"
        description = "Kubernetes Documentation"
    
    # PyPI
    elif 'pypi.org' in domain:
        url_type = "registry"
        category = "devtools"
        description = "Python Package Index"
    
    # NuGet
    elif 'nuget.org' in domain:
        url_type = "registry"
        category = "devtools"
        description = "NuGet Package Registry"
    
    # Maven
    elif 'maven' in domain:
        url_type = "registry"
        category = "devtools"
        description = "Maven Repository"
    
    # NPM
    elif 'npmjs.com' in domain or 'npmjs.org' in domain:
        url_type = "registry"
        category = "devtools"
        description = "NPM Package Registry"
    
    # Open Source Licenses
    elif 'opensource.org' in domain:
        url_type = "license"
        category = "documentation"
        description = "Open Source License"
    
    # Vaultproject.io
    elif 'vaultproject.io' in domain:
        url_type = "infrastructure"
        category = "security"
        description = "HashiCorp Vault"
    
    # Ollama
    elif 'ollama.ai' in domain:
        url_type = "infrastructure"
        category = "ai"
        description = "Ollama AI"
    
    # Portainer
    elif 'portainer.io' in domain:
        url_type = "infrastructure"
        category = "infrastructure"
        description = "Portainer"
    
    # Onbiela.dev
    elif 'onbiela.dev' in domain:
        url_type = "platforms"
        category = "platforms"
        description = "Onbiela Platform"
    
    # Macaly
    elif 'macaly-app.com' in domain:
        url_type = "platforms"
        category = "platforms"
        description = "Macaly Application"
    
    # Domain-specific
    elif 'hnoss-ambassador.org' in domain:
        url_type = "reference"
        category = "documentation"
        description = "HNOSS Ambassador Organization"
    
    elif 'universal-values.org' in domain:
        url_type = "reference"
        category = "documentation"
        description = "Universal Values"
    
    elif 'st-daniel-pohl.org' in domain:
        url_type = "reference"
        category = "documentation"
        description = "St. Daniel Pohl"
    
    elif 'dotnet.microsoft.com' in domain:
        url_type = "documentation"
        category = "devtools"
        description = ".NET Documentation"
    
    return {
        'url': url,
        'type': url_type,
        'category': category,
        'domain': domain,
        'description': description
    }

def extract_context_from_section(content, url):
    """Extrahiert den Kontext/Repo-Namen aus dem die URL kommt"""
    # Suche nach dem Repo-Namen in der Nähe der URL
    lines = content.split('\n')
    context = "Unknown"
    
    for i, line in enumerate(lines):
        if url in line:
            # Suche rückwärts nach Repo-Titel
            for j in range(max(0, i-20), i):
                if lines[j].startswith('### '):
                    context = lines[j].replace('### ', '').strip()
                    break
                elif lines[j].startswith('## '):
                    context = lines[j].replace('## ', '').strip()
                    break
            break
    
    return context

def main():
    filepath = 'ANALYSE_BERICHT.md'
    
    print("🔍 Analysiere ANALYSE_BERICHT.md...")
    print("=" * 80)
    
    # Extrahiere URLs
    urls = extract_urls_from_file(filepath)
    
    # Dedupliziere
    unique_urls = list(set(urls))
    
    print(f"\n✅ Gefunden: {len(urls)} URLs (davon {len(unique_urls)} unique)")
    print("=" * 80)
    
    # Kategorisiere URLs
    categorized = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for url in unique_urls:
        info = categorize_url(url)
        info['context'] = extract_context_from_section(content, url)
        categorized.append(info)
    
    # Gruppiere nach Typ
    by_type = defaultdict(list)
    by_category = defaultdict(list)
    
    for item in categorized:
        by_type[item['type']].append(item)
        by_category[item['category']].append(item)
    
    # Statistiken
    print("\n📊 STATISTIKEN:")
    print("=" * 80)
    
    print("\n🔷 Nach Typ:")
    for url_type, items in sorted(by_type.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"  {url_type:20s}: {len(items):3d} URLs")
    
    print("\n🔷 Nach Kategorie:")
    for category, items in sorted(by_category.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"  {category:20s}: {len(items):3d} URLs")
    
    # Detaillierte Ausgabe
    print("\n" + "=" * 80)
    print("📋 DETAILLIERTE URL-LISTE:")
    print("=" * 80)
    
    for url_type in sorted(by_type.keys()):
        items = by_type[url_type]
        print(f"\n\n{'='*80}")
        print(f"🔹 {url_type.upper()} ({len(items)} URLs)")
        print(f"{'='*80}")
        
        for i, item in enumerate(sorted(items, key=lambda x: x['url']), 1):
            print(f"\n{i}. {item['url']}")
            print(f"   Typ: {item['type']}")
            print(f"   Kategorie: {item['category']}")
            print(f"   Kontext: {item['context']}")
            print(f"   Beschreibung: {item['description']}")
    
    # Spezielle Zählungen
    github_repos = [item for item in categorized if item['type'] == 'github-repo']
    github_assets = [item for item in categorized if item['type'] == 'github-asset']
    lovable_projects = [item for item in categorized if item['type'] == 'lovable']
    supabase_dbs = [item for item in categorized if item['type'] == 'supabase']
    badges = [item for item in categorized if item['type'] == 'badge']
    discord_servers = [item for item in categorized if item['type'] == 'discord']
    registries = [item for item in categorized if item['type'] == 'registry']
    documentation = [item for item in categorized if item['type'] == 'documentation']
    infrastructure = [item for item in categorized if item['category'] == 'infrastructure']
    
    print("\n\n" + "=" * 80)
    print("🎯 ZUSAMMENFASSUNG:")
    print("=" * 80)
    print(f"📦 GitHub Repositories: {len(github_repos)}")
    print(f"🖼️  GitHub Assets (Bilder): {len(github_assets)}")
    print(f"💖 Lovable.dev Projekte: {len(lovable_projects)}")
    print(f"🗄️  Supabase Datenbanken: {len(supabase_dbs)}")
    print(f"🏷️  Badges (shields.io): {len(badges)}")
    print(f"💬 Discord Server: {len(discord_servers)}")
    print(f"📚 Package Registries: {len(registries)}")
    print(f"📖 Documentation Sites: {len(documentation)}")
    print(f"🏗️  Infrastructure Tools: {len(infrastructure)}")
    print(f"📊 TOTAL URLs: {len(unique_urls)}")
    
    # Exportiere zu JSON
    output_data = {
        'total_urls': len(unique_urls),
        'statistics': {
            'github_repos': len(github_repos),
            'github_assets': len(github_assets),
            'lovable_projects': len(lovable_projects),
            'supabase_databases': len(supabase_dbs),
            'badges': len(badges),
            'discord_servers': len(discord_servers),
            'package_registries': len(registries),
            'documentation_sites': len(documentation),
            'infrastructure_tools': len(infrastructure)
        },
        'by_type': {k: [item['url'] for item in v] for k, v in by_type.items()},
        'by_category': {k: [item['url'] for item in v] for k, v in by_category.items()},
        'all_urls': categorized
    }
    
    with open('URL_ANALYSE_RESULTS.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 80)
    print("✅ Export abgeschlossen: URL_ANALYSE_RESULTS.json")
    print("=" * 80)
    
    # Erstelle auch eine lesbare Markdown-Datei
    with open('URL_ANALYSE_REPORT.md', 'w', encoding='utf-8') as f:
        f.write("# 📊 URL-ANALYSE REPORT\n\n")
        f.write(f"**Analysiert:** ANALYSE_BERICHT.md\n")
        f.write(f"**Datum:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## 📈 STATISTIKEN\n\n")
        f.write(f"- 📦 **GitHub Repositories:** {len(github_repos)}\n")
        f.write(f"- 🖼️ **GitHub Assets (Bilder):** {len(github_assets)}\n")
        f.write(f"- 💖 **Lovable.dev Projekte:** {len(lovable_projects)}\n")
        f.write(f"- 🗄️ **Supabase Datenbanken:** {len(supabase_dbs)}\n")
        f.write(f"- 🏷️ **Badges (shields.io):** {len(badges)}\n")
        f.write(f"- 💬 **Discord Server:** {len(discord_servers)}\n")
        f.write(f"- 📚 **Package Registries:** {len(registries)}\n")
        f.write(f"- 📖 **Documentation Sites:** {len(documentation)}\n")
        f.write(f"- 🏗️ **Infrastructure Tools:** {len(infrastructure)}\n")
        f.write(f"- 📊 **TOTAL URLs:** {len(unique_urls)}\n\n")
        
        f.write("---\n\n")
        
        for url_type in sorted(by_type.keys()):
            items = by_type[url_type]
            f.write(f"## 🔹 {url_type.upper()} ({len(items)} URLs)\n\n")
            
            for i, item in enumerate(sorted(items, key=lambda x: x['url']), 1):
                f.write(f"### {i}. {item['description']}\n\n")
                f.write(f"**URL:** `{item['url']}`\n\n")
                f.write(f"- **Typ:** {item['type']}\n")
                f.write(f"- **Kategorie:** {item['category']}\n")
                f.write(f"- **Kontext:** {item['context']}\n")
                f.write(f"- **Domain:** {item['domain']}\n\n")
                f.write("---\n\n")
    
    print("✅ Markdown Report erstellt: URL_ANALYSE_REPORT.md")
    print("=" * 80)

if __name__ == '__main__':
    main()
