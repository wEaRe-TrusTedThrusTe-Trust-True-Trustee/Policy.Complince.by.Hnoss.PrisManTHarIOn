#!/usr/bin/env python3
"""
Extrahiert ALLE URLs aus ANALYSE_BERICHT.md - INKLUSIVE DUPLIKATE!
Zeigt jede URL-Erwähnung mit vollständigem Kontext
"""

import re
from collections import defaultdict

def extract_all_urls_with_context(filepath):
    """Extrahiert ALLE URLs mit Kontext (keine Deduplizierung!)"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # URL Pattern
    url_pattern = re.compile(r'https?://[^\s\)\]\'"<>]+')
    
    all_urls = []
    current_repo = "Unknown"
    current_category = "Unknown"
    
    for line_num, line in enumerate(lines, 1):
        # Erkenne Kategorien
        if line.startswith('## 🏷️'):
            current_category = line.replace('## 🏷️', '').strip()
        
        # Erkenne Repository-Namen
        if line.startswith('### ') and '. ' in line:
            current_repo = line.split('. ', 1)[1].strip()
        
        # Finde alle URLs in der Zeile
        matches = url_pattern.finditer(line)
        for match in matches:
            url = match.group(0)
            # Entferne trailing Satzzeichen
            url = url.rstrip('.,;:)\'"')
            
            # Bestimme URL-Typ
            url_type = classify_url(url)
            
            # Kontext
            context = line.strip()
            
            all_urls.append({
                'url': url,
                'type': url_type,
                'line': line_num,
                'repo': current_repo,
                'category': current_category,
                'context': context
            })
    
    return all_urls

def classify_url(url):
    """Klassifiziert URLs nach Typ"""
    url_lower = url.lower()
    
    if 'github.com/user-attachments/assets' in url_lower:
        return 'github-asset'
    elif 'github.com' in url_lower and '.git' in url_lower:
        return 'github-repo-git'
    elif 'github.com' in url_lower:
        return 'github-repo'
    elif 'lovable.dev' in url_lower:
        return 'lovable'
    elif 'supabase.co' in url_lower:
        return 'supabase'
    elif 'shields.io' in url_lower:
        return 'badge'
    elif 'netlify.app' in url_lower:
        return 'netlify'
    elif 'discord' in url_lower:
        return 'discord'
    elif 'microsoft.com' in url_lower or 'azure' in url_lower:
        return 'microsoft'
    elif 'docker' in url_lower:
        return 'docker'
    elif 'kubernetes.io' in url_lower:
        return 'kubernetes'
    elif 'portainer.io' in url_lower:
        return 'portainer'
    elif 'pypi.org' in url_lower:
        return 'pypi'
    elif 'nuget.org' in url_lower:
        return 'nuget'
    elif 'opensource.org' in url_lower:
        return 'license'
    elif 'learn.microsoft.com' in url_lower:
        return 'docs'
    elif '.onbiela.dev' in url_lower:
        return 'deployment'
    elif 'macaly-app.com' in url_lower:
        return 'macaly'
    elif 'dmde.com' in url_lower or 'softdm.com' in url_lower:
        return 'software'
    elif any(x in url_lower for x in ['hnoss', 'ambassador', 'pohl']):
        return 'organization'
    elif 'vault' in url_lower:
        return 'vault'
    elif 'ollama' in url_lower:
        return 'ai'
    else:
        return 'other'

def generate_full_report(all_urls):
    """Generiert vollständigen Bericht"""
    
    print("=" * 120)
    print("VOLLSTÄNDIGE URL-EXTRAKTION AUS ANALYSE_BERICHT.md")
    print("INKLUSIVE ALLER DUPLIKATE UND WIEDERHOLUNGEN")
    print("=" * 120)
    print(f"\nGESAMTANZAHL URL-ERWÄHNUNGEN: {len(all_urls)}")
    print(f"ANZAHL UNIQUE URLs: {len(set(u['url'] for u in all_urls))}")
    print()
    
    # Gruppierung nach Typ
    by_type = defaultdict(list)
    for item in all_urls:
        by_type[item['type']].append(item)
    
    sorted_types = sorted(by_type.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Ausgabe nach Typ
    for url_type, items in sorted_types:
        print(f"\n{'='*120}")
        print(f"KATEGORIE: {url_type.upper()}")
        print(f"Anzahl Erwähnungen: {len(items)}")
        print(f"{'='*120}\n")
        
        for idx, item in enumerate(items, 1):
            print(f"[{idx}/{len(items)}]")
            print(f"  URL:         {item['url']}")
            print(f"  TYPE:        {item['type']}")
            print(f"  CATEGORY:    {item['category']}")
            print(f"  REPO:        {item['repo']}")
            print(f"  ZEILE:       {item['line']}")
            if len(item['context']) > 100:
                print(f"  CONTEXT:     {item['context'][:100]}...")
            else:
                print(f"  CONTEXT:     {item['context']}")
            print()
    
    # Zähle Häufigkeit jeder URL
    print("\n" + "=" * 120)
    print("URL-HÄUFIGKEITSANALYSE (Top 20 meist-erwähnte URLs)")
    print("=" * 120)
    
    url_counts = defaultdict(int)
    for item in all_urls:
        url_counts[item['url']] += 1
    
    sorted_urls = sorted(url_counts.items(), key=lambda x: x[1], reverse=True)
    
    for idx, (url, count) in enumerate(sorted_urls[:20], 1):
        print(f"{idx:2d}. [{count:3d}x] {url}")
    
    # Zusammenfassung nach Typ
    print("\n" + "=" * 120)
    print("ZUSAMMENFASSUNG NACH TYP:")
    print("=" * 120)
    for url_type, items in sorted_types:
        unique_in_type = len(set(u['url'] for u in items))
        print(f"{url_type:20s}: {len(items):4d} Erwähnungen ({unique_in_type:3d} unique URLs)")
    print(f"\n{'TOTAL':20s}: {len(all_urls):4d} Erwähnungen ({len(set(u['url'] for u in all_urls)):3d} unique URLs)")
    print("=" * 120)

def save_full_report(all_urls, output_file):
    """Speichert vollständigen Bericht"""
    
    by_type = defaultdict(list)
    for item in all_urls:
        by_type[item['type']].append(item)
    
    sorted_types = sorted(by_type.items(), key=lambda x: len(x[1]), reverse=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=" * 120 + "\n")
        f.write("VOLLSTÄNDIGE URL-EXTRAKTION AUS ANALYSE_BERICHT.md\n")
        f.write("INKLUSIVE ALLER DUPLIKATE UND WIEDERHOLUNGEN\n")
        f.write("=" * 120 + "\n\n")
        f.write(f"GESAMTANZAHL URL-ERWÄHNUNGEN: {len(all_urls)}\n")
        f.write(f"ANZAHL UNIQUE URLs: {len(set(u['url'] for u in all_urls))}\n\n")
        
        for url_type, items in sorted_types:
            f.write(f"\n{'='*120}\n")
            f.write(f"KATEGORIE: {url_type.upper()}\n")
            f.write(f"Anzahl Erwähnungen: {len(items)}\n")
            f.write(f"{'='*120}\n\n")
            
            for idx, item in enumerate(items, 1):
                f.write(f"[{idx}/{len(items)}]\n")
                f.write(f"  URL:         {item['url']}\n")
                f.write(f"  TYPE:        {item['type']}\n")
                f.write(f"  CATEGORY:    {item['category']}\n")
                f.write(f"  REPO:        {item['repo']}\n")
                f.write(f"  ZEILE:       {item['line']}\n")
                f.write(f"  CONTEXT:     {item['context']}\n")
                f.write("\n")
        
        # URL-Häufigkeit
        f.write("\n" + "=" * 120 + "\n")
        f.write("URL-HÄUFIGKEITSANALYSE\n")
        f.write("=" * 120 + "\n\n")
        
        url_counts = defaultdict(int)
        for item in all_urls:
            url_counts[item['url']] += 1
        
        sorted_urls = sorted(url_counts.items(), key=lambda x: x[1], reverse=True)
        
        for idx, (url, count) in enumerate(sorted_urls, 1):
            f.write(f"{idx:3d}. [{count:3d}x] {url}\n")
        
        # Zusammenfassung
        f.write("\n" + "=" * 120 + "\n")
        f.write("ZUSAMMENFASSUNG NACH TYP:\n")
        f.write("=" * 120 + "\n")
        for url_type, items in sorted_types:
            unique_in_type = len(set(u['url'] for u in items))
            f.write(f"{url_type:20s}: {len(items):4d} Erwähnungen ({unique_in_type:3d} unique URLs)\n")
        f.write(f"\n{'TOTAL':20s}: {len(all_urls):4d} Erwähnungen ({len(set(u['url'] for u in all_urls)):3d} unique URLs)\n")
        f.write("=" * 120 + "\n")

if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    # Dateipfade
    script_dir = Path(__file__).parent
    input_file = script_dir / "ANALYSE_BERICHT.md"
    output_file = script_dir / "ALLE_URLS_MIT_DUPLIKATEN.txt"
    
    print("Starte vollständige URL-Extraktion (inkl. Duplikate)...")
    print(f"Eingabedatei: {input_file}\n")
    
    # URLs extrahieren
    all_urls = extract_all_urls_with_context(input_file)
    
    # Bericht generieren
    generate_full_report(all_urls)
    
    # In Datei speichern
    save_full_report(all_urls, output_file)
    
    print(f"\n✅ Vollständiger Bericht wurde gespeichert: {output_file}")
    print(f"\n📊 STATISTIK:")
    print(f"   - Gesamt URL-Erwähnungen: {len(all_urls)}")
    print(f"   - Unique URLs: {len(set(u['url'] for u in all_urls))}")
