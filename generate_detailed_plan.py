import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
img = Image.new("RGB", (W, H), "#fdfbf7")
draw = ImageDraw.Draw(img)

try:
    font_hero = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    font_room = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    font_item = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 15)
    font_badge = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
    font_prop = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 11)
except Exception:
    font_hero = font_room = font_item = font_badge = font_prop = ImageFont.load_default()

# 1. Top Bar Header
draw.rectangle([0, 0, W, 64], fill="#1e293b")
draw.text((45, 18), "TEAM DIMITRI HQ — BLUEPRINT DENAH KANTOR LENGKAP", fill="#ffffff", font=font_hero)
draw.text((1250, 22), "1 Gedung · Dynamic Studios · Furnitur & Aksesoris Lengkap", fill="#94a3b8", font=font_item)

OX, OY = 60, 95
BW, BH = 1800, 935

# Outline batas utama gedung
draw.rectangle([OX, OY, OX + BW, OY + BH], fill="#fbf9f4", outline="#cbd5e1", width=3)

W_WING = 700
MID_X1 = OX + W_WING
MID_X2 = OX + 1150

# =========================================================================
# 1. RUANGAN FLEEK PROJECT STUDIO (Kiri Belakang / Atas)
# =========================================================================
rf = [OX, OY, MID_X1, OY + 450]
draw.rectangle(rf, fill="#f0f7ff", outline="#0284c7", width=3)
draw.rectangle([OX + 20, OY + 18, OX + 480, OY + 62], fill="#0284c7")
draw.text((OX + 32, OY + 26), "⚡ FLEEK PROJECT STUDIO", fill="#ffffff", font=font_room)
draw.text((OX + 32, OY + 68), "Software Engineering · SaaS Platform · Digital Solutions", fill="#0369a1", font=font_badge)

# Standing Desk Bima (Dual Curved Monitor)
draw.rounded_rectangle([OX + 60, OY + 110, OX + 260, OY + 210], radius=8, fill="#ffffff", outline="#0284c7", width=2)
draw.arc([OX + 80, OY + 120, OX + 160, OY + 145], 180, 360, fill="#0f172a", width=6) # Monitor 1 Curved
draw.arc([OX + 165, OY + 120, OX + 245, OY + 145], 180, 360, fill="#0f172a", width=6) # Monitor 2 Curved
draw.text((OX + 80, OY + 155), "Meja Bima (Architect)", fill="#0f172a", font=font_item)
draw.text((OX + 80, OY + 180), "Dual Curved 27\" Standing Desk", fill="#64748b", font=font_prop)
draw.ellipse([OX + 130, OY + 225, OX + 190, OY + 265], fill="#e2e8f0", outline="#0284c7", width=2) # Kursi Bima

# Glass Whiteboard Dinding
draw.rectangle([OX + 310, OY + 110, OX + 520, OY + 130], fill="#e0f2fe", outline="#38bdf8", width=2)
draw.text((OX + 320, OY + 114), "Glass Whiteboard (Schema DB & Flow)", fill="#0369a1", font=font_prop)

# Meja Standby Squad Dev / Fullstack
draw.rounded_rectangle([OX + 310, OY + 170, OX + 520, OY + 270], radius=8, fill="#ffffff", outline="#94a3b8", width=1)
draw.text((OX + 330, OY + 210), "Meja Standby Dev Squad", fill="#64748b", font=font_item)
draw.text((OX + 330, OY + 235), "Slot Onboarding Dinamis", fill="#94a3b8", font=font_prop)

# Mini Server Rack & NAS Network
draw.rectangle([OX + 560, OY + 110, OX + 660, OY + 210], fill="#0f172a", outline="#38bdf8", width=2)
draw.ellipse([OX + 580, OY + 130, OX + 590, OY + 140], fill="#4ade80") # LED hijau
draw.ellipse([OX + 600, OY + 130, OX + 610, OY + 140], fill="#38bdf8") # LED biru
draw.text((OX + 575, OY + 155), "MINI SERVER\n& NAS TOWER", fill="#94a3b8", font=font_prop)

# Acoustic Wall Slats (Peredam Gema)
for s in range(5):
    draw.line([OX + 20, OY + 280 + s * 16, OX + 180, OY + 280 + s * 16], fill="#bae6fd", width=4)
draw.text((OX + 20, OY + 365), "Panel Akustik Hexagonal", fill="#64748b", font=font_prop)

# Pintu Masuk Fleek
draw.rectangle([MID_X1 - 10, OY + 200, MID_X1 + 10, OY + 300], fill="#bae6fd", outline="#0284c7")
draw.text((MID_X1 - 80, OY + 245), "PINTU ➜", fill="#0284c7", font=font_badge)


# =========================================================================
# 2. RUANGAN XAVORTREE LAB (Kiri Depan / Bawah)
# =========================================================================
rx = [OX, OY + 470, MID_X1, OY + BH]
draw.rectangle(rx, fill="#f0fdf4", outline="#10b981", width=3)
draw.rectangle([OX + 20, OY + 488, OX + 480, OY + 532], fill="#10b981")
draw.text((OX + 32, OY + 496), "🌿 XAVORTREE LAB", fill="#ffffff", font=font_room)
draw.text((OX + 32, OY + 538), "Manufaktur 3D Custom · Bambu Lab FDM · IoT & Business Analysis", fill="#047857", font=font_badge)

# Workbench 3D Printer Reno (Maker Station)
draw.rounded_rectangle([OX + 50, OY + 580, OX + 300, OY + 700], radius=8, fill="#ffffff", outline="#10b981", width=2)
# Printer 1 (Bambu Lab FDM)
draw.rectangle([OX + 70, OY + 600, OX + 140, OY + 670], fill="#1e293b", outline="#10b981", width=2)
draw.rectangle([OX + 80, OY + 610, OX + 130, OY + 655], fill="#38bdf8") # Kaca transparan
draw.ellipse([OX + 95, OY + 585, OX + 115, OY + 605], fill="#f97316") # Spool filamen PLA oranye
# Printer 2 (Secondary / Prototype)
draw.rectangle([OX + 155, OY + 600, OX + 215, OY + 670], fill="#334155", outline="#cbd5e1")
draw.ellipse([OX + 175, OY + 585, OX + 195, OY + 605], fill="#eab308") # Spool filamen kuning
draw.text((OX + 70, OY + 675), "Meja Reno (3D Maker)", fill="#0f172a", font=font_item)
draw.ellipse([OX + 130, OY + 715, OX + 190, OY + 755], fill="#e2e8f0", outline="#10b981", width=2) # Kursi Reno

# Pegboard Dinding Spool Filamen PLA (Pastel, Silk, Glow)
draw.rectangle([OX + 330, OY + 580, OX + 470, OY + 715], fill="#fef3c7", outline="#d97706", width=2)
draw.text((OX + 340, OY + 592), "PEGBOARD FILAMEN", fill="#92400e", font=font_badge)
colors_spool = ["#fbcfe8", "#bfdbfe", "#bbf7d0", "#fed7aa", "#e9d5ff", "#fef08a"]
for idx, col in enumerate(colors_spool):
    sx = OX + 348 + (idx % 3) * 38
    sy = OY + 618 + (idx // 3) * 32
    draw.ellipse([sx, sy, sx + 26, sy + 26], fill=col, outline="#78350f", width=1)
draw.text((OX + 338, OY + 688), "PLA Pastel & Silk", fill="#b45309", font=font_prop)

# Showcase Lemari Kaca Display Produk Xavortree
draw.rectangle([OX + 500, OY + 580, OX + 670, OY + 700], fill="#ffffff", outline="#7c5c38", width=2)
draw.text((OX + 512, OY + 595), "SHOWCASE KACA PRODUK", fill="#5c4033", font=font_badge)
draw.text((OX + 512, OY + 620), "• 3D Strava Line Elevasi", fill="#475569", font=font_prop)
draw.text((OX + 512, OY + 640), "• Miniatur Chibi Paintable", fill="#475569", font=font_prop)
draw.text((OX + 512, OY + 660), "• Keycap Clicker Charm", fill="#475569", font=font_prop)
draw.text((OX + 512, OY + 680), "• Bingkai Photocard K-Pop", fill="#475569", font=font_prop)

# Meja Finishing, Sanding & Cat Akrilik Chibi
draw.rounded_rectangle([OX + 50, OY + 790, OX + 320, OY + 890], radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((OX + 70, OY + 810), "Meja Finishing & Sanding", fill="#0f172a", font=font_item)
draw.text((OX + 70, OY + 835), "Alat Deburring · Tang Potong · Kuas Cat Chibi", fill="#64748b", font=font_prop)
draw.text((OX + 70, OY + 855), "Kalkulasi Cost-Plus: Rp 500 / gram filamen", fill="#047857", font=font_prop)

# Workbench Hardware IoT Telemetry & ESP32
draw.rounded_rectangle([OX + 360, OY + 790, OX + 670, OY + 890], radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((OX + 380, OY + 810), "Workbench IoT Telemetry Xavortree", fill="#0f172a", font=font_item)
draw.text((OX + 380, OY + 835), "Modul ESP32 · Sensor Gudang · Matras Antistatis", fill="#64748b", font=font_prop)
draw.text((OX + 380, OY + 855), "Stasiun Perakitan & Kalibrasi Hardware", fill="#64748b", font=font_prop)

# Pintu Masuk Xavortree
draw.rectangle([MID_X1 - 10, OY + 680, MID_X1 + 10, OY + 780], fill="#d1fae5", outline="#10b981")
draw.text((MID_X1 - 80, OY + 725), "PINTU ➜", fill="#10b981", font=font_badge)


# =========================================================================
# 3. RUANG RAPAT BERSAMA (BOARDROOM KACA - Kanan Bawah)
# =========================================================================
rm = [MID_X2, OY + 240, OX + BW, OY + BH]
draw.rectangle(rm, fill="#faf5ff", outline="#8b5cf6", width=4)
draw.rectangle([MID_X2 + 20, OY + 258, MID_X2 + 520, OY + 302], fill="#8b5cf6")
draw.text((MID_X2 + 32, OY + 266), "🗂️ RUANG RAPAT BERSAMA (BOARDROOM)", fill="#ffffff", font=font_room)
draw.text((MID_X2 + 32, OY + 308), "Fasilitas Rapat Gabungan · Presentasi CEO · Dinding Kaca Akustik", fill="#6b21a8", font=font_badge)

# Meja Boardroom Solid Walnut (Kapsul Oval)
mx0, my0 = MID_X2 + 80, OY + 460
mw, mh = 420, 200
draw.rounded_rectangle([mx0, my0, mx0 + mw, my0 + mh], radius=60, fill="#f5ede4", outline="#7c5c38", width=3)
draw.text((mx0 + 80, my0 + 85), "MEJA BOARDROOM WALNUT", fill="#5c4033", font=font_room)

# Kursi CEO (Dimitri) di Kepala Meja
draw.ellipse([mx0 - 65, my0 + 70, mx0 - 10, my0 + 135], fill="#1e293b", outline="#0284c7", width=3)
draw.text((mx0 - 58, my0 + 95), "CEO", fill="#ffffff", font=font_badge)

# Kursi Rapat Tim (6 Kursi Eksekutif Mesh)
for i in range(3):
    cx = mx0 + 75 + i * 115
    draw.ellipse([cx, my0 - 55, cx + 55, my0 - 5], fill="#e2e8f0", outline="#7c5c38", width=2)
for i in range(3):
    cx = mx0 + 75 + i * 115
    draw.ellipse([cx, my0 + mh + 5, cx + 55, my0 + mh + 55], fill="#e2e8f0", outline="#7c5c38", width=2)
# Kursi Ujung Kanan
draw.ellipse([mx0 + mw + 10, my0 + 70, mx0 + mw + 65, my0 + 135], fill="#e2e8f0", outline="#7c5c38", width=2)

# Smart TV Wall Screen 85 Inci
draw.rectangle([OX + BW - 22, OY + 400, OX + BW - 4, OY + 720], fill="#0f172a", outline="#38bdf8", width=2)
draw.text((OX + BW - 220, OY + 360), "TV WALL SCREEN 85\"", fill="#0284c7", font=font_badge)
draw.text((OX + BW - 220, OY + 382), "(Dashboard & Slides)", fill="#64748b", font=font_prop)

# Tanaman Hias Sudut (Monstera Deliciosa)
draw.ellipse([MID_X2 + 30, OY + BH - 85, MID_X2 + 95, OY + BH - 20], fill="#3d6b52", outline="#284e3a", width=2)
draw.text((MID_X2 + 105, OY + BH - 60), "Pot Monstera Deliciosa", fill="#284e3a", font=font_prop)

# Pintu Kaca Geser Ruang Rapat
draw.rectangle([MID_X2 - 10, OY + 420, MID_X2 + 10, OY + 540], fill="#f3e8ff", outline="#8b5cf6")
draw.text((MID_X2 + 20, OY + 475), "PINTU KACA GESER", fill="#8b5cf6", font=font_prop)


# =========================================================================
# 4. PANTRY & COFFEE BAR (Kanan Atas)
# =========================================================================
rp = [MID_X2, OY, OX + BW, OY + 220]
draw.rectangle(rp, fill="#fdfbf7", outline="#e2e8f0", width=2)
# Bar Kopi
draw.rounded_rectangle([MID_X2 + 40, OY + 30, OX + BW - 40, OY + 160], radius=8, fill="#ffffff", outline="#cbd5e1", width=2)
# Mesin Espresso Portafilter
draw.rectangle([MID_X2 + 70, OY + 50, MID_X2 + 130, OY + 110], fill="#1e293b", outline="#94a3b8", width=2)
draw.ellipse([MID_X2 + 85, OY + 60, MID_X2 + 95, OY + 70], fill="#ef4444") # tombol mesin
draw.text((MID_X2 + 150, OY + 55), "COFFEE STATION & PANTRY", fill="#7c5c38", font=font_item)
draw.text((MID_X2 + 150, OY + 80), "• Mesin Espresso Portafilter & Grinder Kopi Biji", fill="#64748b", font=font_prop)
draw.text((MID_X2 + 150, OY + 100), "• Kopi Hitam Panas Kai & Seduhan Teh Pekat Bima", fill="#64748b", font=font_prop)
draw.text((MID_X2 + 150, OY + 120), "• Kulkas Minuman Dingin & Snack Staf", fill="#64748b", font=font_prop)


# =========================================================================
# 5. LOBBY & EXECUTIVE COMMONS (Tengah)
# =========================================================================
# Meja Komando Kai (Orkestrator & CoS)
draw.rounded_rectangle([MID_X1 + 50, OY + 110, MID_X1 + 380, OY + 230], radius=10, fill="#ffffff", outline="#6b4f3a", width=3)
draw.rectangle([MID_X1 + 80, OY + 125, MID_X1 + 170, OY + 135], fill="#1e293b") # Monitor 1
draw.rectangle([MID_X1 + 180, OY + 125, MID_X1 + 250, OY + 135], fill="#1e293b") # Monitor 2 (Live HUD)
draw.text((MID_X1 + 80, OY + 150), "Meja Komando Kai (CoS)", fill="#6b4f3a", font=font_room)
draw.text((MID_X1 + 80, OY + 180), "Orkestrator & Executive Gatekeeper", fill="#0f172a", font=font_badge)
draw.text((MID_X1 + 80, OY + 200), "Laporan Eksekutif, Checklist & Notulen", fill="#64748b", font=font_prop)
draw.ellipse([MID_X1 + 180, OY + 245, MID_X1 + 240, OY + 285], fill="#e2e8f0", outline="#6b4f3a", width=2) # Kursi Kai

# Sofa Santai Lounge Bentuk L (Tan Leather)
lx, ly = MID_X1 + 60, OY + 500
draw.rounded_rectangle([lx, ly, lx + 270, ly + 90], radius=12, fill="#e8d5bf", outline="#a77148", width=2)
draw.rounded_rectangle([lx, ly + 90, lx + 90, ly + 250], radius=12, fill="#e8d5bf", outline="#a77148", width=2)
# Coffee Table Kayu Solid
draw.rounded_rectangle([lx + 120, ly + 115, lx + 260, ly + 225], radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((lx + 140, ly + 160), "Coffee Table\n& Majalah Desain", fill="#7c5c38", font=font_prop)
draw.text((lx + 40, ly + 310), "LOUNGE REHAT STAF (SOFA L)", fill="#5c4033", font=font_item)

# Rak Buku & Majalah Teknologi
draw.rectangle([MID_X1 + 50, OY + 840, MID_X1 + 380, OY + 890], fill="#f5ede4", outline="#7c5c38", width=2)
draw.text((MID_X1 + 70, OY + 860), "RAK BUKU: Clean Code, FDM Slicing Guide & Pop Culture", fill="#7c5c38", font=font_prop)

# Simpan hasil gambar resolusi tinggi
target = "/Users/haimac/.gemini/antigravity/brain/c403628a-88d0-43ac-8269-bf48ec5b3de2/denah_detail_kantor_team_dimitri.png"
img.save(target, "PNG")
print(f"SUKSES: {target}")
