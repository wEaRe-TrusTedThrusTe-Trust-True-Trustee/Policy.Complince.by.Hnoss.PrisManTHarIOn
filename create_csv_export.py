#!/usr/bin/env python3
"""
CSV Export für alle URLs
"""

import json
import csv

def main():
    # Lade JSON-Daten
    with open('URL_ANALYSE_RESULTS.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Erstelle CSV
    with open('URL_LISTE_VOLLSTAENDIG.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            'Nr',
            'URL',
            'Typ',
            'Kategorie',
            'Domain',
            'Kontext/Repo',
            'Beschreibung'
        ])
        
        # Daten
        for i, item in enumerate(data['all_urls'], 1):
            writer.writerow([
                i,
                item['url'],
                item['type'],
                item['category'],
                item['domain'],
                item['context'],
                item['description']
            ])
    
    print("✅ CSV erstellt: URL_LISTE_VOLLSTAENDIG.csv")
    
    # Erstelle auch eine Markdown-Tabelle
    with open('URL_TABELLE.md', 'w', encoding='utf-8') as f:
        f.write("# 📊 VOLLSTÄNDIGE URL-TABELLE\n\n")
        f.write("| Nr | URL | Typ | Kategorie | Domain | Kontext | Beschreibung |\n")
        f.write("|---:|-----|-----|-----------|--------|---------|-------------|\n")
        
        for i, item in enumerate(data['all_urls'], 1):
            url_display = item['url'][:80] + '...' if len(item['url']) > 80 else item['url']
            f.write(f"| {i} | `{url_display}` | {item['type']} | {item['category']} | {item['domain']} | {item['context']} | {item['description']} |\n")
    
    print("✅ Markdown-Tabelle erstellt: URL_TABELLE.md")

if __name__ == '__main__':
    main()
