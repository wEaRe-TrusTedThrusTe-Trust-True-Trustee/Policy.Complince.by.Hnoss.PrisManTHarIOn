#!/bin/bash
# System-Bereinigungsskript - Gibt Speicherplatz frei

echo "=== System-Bereinigung startet ==="
echo ""

# 1. Journal-Logs begrenzen (spart ~700MB)
echo "1. Bereinige Journal-Logs..."
journalctl --vacuum-size=500M
echo "✓ Journal-Logs bereinigt"
echo ""

# 2. Alte Flatpak-Versionen entfernen
echo "2. Entferne alte Flatpak-Versionen..."
flatpak uninstall --unused -y
echo "✓ Flatpak bereinigt"
echo ""

# 3. Snap-Cache bereinigen
echo "3. Bereinige Snap-Cache..."
snap list --all | awk '/disabled/{print $1, $3}' | while read snapname revision; do
    snap remove "$snapname" --revision="$revision"
done
echo "✓ Snap bereinigt"
echo ""

# 4. Package-Manager-Cache
echo "4. Bereinige Package-Manager-Cache..."
if command -v apt &> /dev/null; then
    apt clean
    apt autoremove -y
elif command -v dnf &> /dev/null; then
    dnf clean all
elif command -v zypper &> /dev/null; then
    zypper clean -a
fi
echo "✓ Package-Cache bereinigt"
echo ""

# 5. Temporäre Dateien
echo "5. Bereinige temporäre Dateien..."
rm -rf /tmp/*
rm -rf /var/tmp/*
echo "✓ Temporäre Dateien entfernt"
echo ""

echo "=== Bereinigung abgeschlossen ==="
echo ""
echo "Neuer Speicherplatz:"
df -h /usr | tail -1
