#!/bin/bash
# =============================================================================
# ASISTEN+STOCK - ONE-CLICK VPS INITIALIZATION SCRIPT (Ubuntu 22.04 / 24.04 LTS)
# Setup Dasar Server Baru:
# 1. Update OS & Paket Sistem
# 2. Instalasi Resmi Docker Engine & Docker Compose Plugin
# 3. Hardening UFW Firewall (Hanya Port 22 SSH, 80 HTTP, 443 HTTPS)
# =============================================================================

set -e

echo "🚀 Memulai inisialisasi server VPS untuk Asisten Stock..."

# 1. Update & Alat Dasar
echo "📦 Memperbarui sistem operasi..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw htop

# 2. Instal Docker Engine Resmi
echo "🐳 Memasang Docker Engine & Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Izinkan user saat ini menjalankan docker tanpa sudo
    sudo usermod -aG docker $USER
    echo "✅ Docker & Compose terpasang."
else
    echo "ℹ️ Docker sudah terpasang."
fi

# 3. Konfigurasi Firewall (UFW)
echo "🛡️ Mengonfigurasi benteng firewall UFW..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Caddy'
sudo ufw allow 443/tcp comment 'HTTPS Caddy'
sudo ufw --force enable

echo "=========================================================="
echo "🎉 VPS SIAP DIGUNAKAN UNTUK DEPLOYMENT PRODUKSI!"
echo "Status Firewall:"
sudo ufw status verbose
echo "Versi Docker:"
docker --version
docker compose version
echo "=========================================================="
