import sys
from PIL import Image, ImageDraw, ImageFont

# Canvas 16:9 Widescreen (1920 x 1080)
W, H = 1920, 1080
img = Image.new("RGB", (W, H), "#f8f6f0")
draw = ImageDraw.Draw(img)

# Coba muat font sistem macOS Helvetica / Arial
try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    font_room = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    font_item = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
    font_badge = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
except Exception:
    font_title = ImageFont.load_default()
    font_room = font_sub = font_item = font_badge = font_title

# Header Banner
draw.rectangle([0, 0, W, 70], fill="#1e293b")
draw.text((40, 20), "DENAH ARSITEKTUR KANTOR VIRTUAL — TEAM DIMITRI HQ", fill="#f8fafc", font=font_title)
draw.text((1300, 26), "1 Gedung · Dynamic Studios · Google Drive Separated", fill="#94a3b8", font=font_sub)

# Koordinat Luar Bangunan Gedung
OX, OY = 60, 110
BW, BH = 1800, 910

# Lantai dasar gedung
draw.rectangle([OX, OY, OX + BW, OY + BH], fill="#fdfbf7", outline="#cbd5e1", width=2)

# Pembagian Ruangan:
# Kiri: Xavortree & Fleek (Lebar 880)
# Kanan: Ruang Rapat & Pantry (Lebar 880)
# Tengah Lorong/Lounge (X: 680..1120)

W_WING = 680
MID_X1 = OX + W_WING
MID_X2 = OX + 1120

# 1. RUANGAN FLEEK PROJECT (Kiri Atas: X: OX..MID_X1, Y: OY..OY+440)
r_fleek = [OX, OY, MID_X1, OY + 440]
draw.rectangle(r_fleek, fill="#f0f7ff", outline="#0284c7", width=3)
# Plang Ruangan
draw.rectangle([OX + 20, OY + 20, OX + 480, OY + 68], fill="#0284c7")
draw.text((OX + 32, OY + 30), "FLEEK PROJECT STUDIO", fill="#ffffff", font=font_room)
draw.text((OX + 32, OY + 75), "Divisi Software · Platform SaaS · Digital Solutions", fill="#0369a1", font=font_sub)
draw.text((OX + 32, OY + 98), "Storage Target: Google Drive / Team Dimitri / Fleek Project", fill="#64748b", font=font_badge)

# Meja Bima (Lead Software Architect)
draw.rounded_rectangle([OX + 60, OY + 140, OX + 260, OY + 240], radius=8, fill="#ffffff", outline="#94a3b8", width=2)
draw.rectangle([OX + 80, OY + 155, OX + 170, OY + 165], fill="#1e293b") # Monitor 1
draw.rectangle([OX + 180, OY + 155, OX + 240, OY + 165], fill="#1e293b") # Monitor 2
draw.text((OX + 80, OY + 180), "Meja Bima", fill="#0f172a", font=font_item)
draw.text((OX + 80, OY + 200), "Lead Software Architect", fill="#64748b", font=font_badge)
# Kursi Ergonomis Bima
draw.ellipse([OX + 130, OY + 250, OX + 190, OY + 290], fill="#e2e8f0", outline="#64748b", width=2)

# Meja Dev Squad / Fullstack Standby
draw.rounded_rectangle([OX + 340, OY + 140, OX + 540, OY + 240], radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((OX + 360, OY + 180), "Meja Dev & Automation", fill="#64748b", font=font_item)
draw.text((OX + 360, OY + 200), "Standby Squad", fill="#94a3b8", font=font_badge)

# Server Rack Mini
draw.rectangle([OX + 580, OY + 140, OX + 650, OY + 240], fill="#1e293b")
draw.text((OX + 590, OY + 180), "SERVER\nRACK", fill="#38bdf8", font=font_badge)


# 2. RUANGAN XAVORTREE LAB (Kiri Bawah: X: OX..MID_X1, Y: OY+460..OY+BH)
r_xav = [OX, OY + 460, MID_X1, OY + BH]
draw.rectangle(r_xav, fill="#f0fdf4", outline="#10b981", width=3)
# Plang Ruangan
draw.rectangle([OX + 20, OY + 480, OX + 480, OY + 528], fill="#10b981")
draw.text((OX + 32, OY + 490), "XAVORTREE LAB", fill="#ffffff", font=font_room)
draw.text((OX + 32, OY + 535), "Divisi 3D Printing Custom · IoT Sensor · Business Analysis", fill="#047857", font=font_sub)
draw.text((OX + 32, OY + 558), "Storage Target: Google Drive / Team Dimitri / Xavortree", fill="#64748b", font=font_badge)

# Workbench 3D Printing Reno
draw.rounded_rectangle([OX + 60, OY + 600, OX + 300, OY + 720], radius=8, fill="#ffffff", outline="#94a3b8", width=2)
# Miniatur 3D Printer Bambu Lab di meja
draw.rectangle([OX + 80, OY + 620, OX + 150, OY + 690], fill="#1e293b", outline="#0284c7", width=2)
draw.rectangle([OX + 90, OY + 630, OX + 140, OY + 675], fill="#38bdf8") # Kaca depan
draw.ellipse([OX + 105, OY + 605, OX + 125, OY + 625], fill="#f97316") # Spool filamen PLA oranye
draw.text((OX + 170, OY + 635), "Meja Reno (3D Maker)", fill="#0f172a", font=font_item)
draw.text((OX + 170, OY + 655), "Printer: Bambu Lab FDM", fill="#047857", font=font_badge)
draw.text((OX + 170, OY + 675), "Nozzle: 0.4mm (PLA Matte)", fill="#b45309", font=font_badge)
# Kursi Reno
draw.ellipse([OX + 150, OY + 735, OX + 210, OY + 775], fill="#e2e8f0", outline="#64748b", width=2)

# Rak Display Spool Filamen & Hasil Cetak
draw.rectangle([OX + 340, OY + 600, OX + 480, OY + 720], fill="#fef3c7", outline="#d97706", width=2)
draw.text((OX + 355, OY + 620), "RAK FILAMEN & DISPLAY", fill="#92400e", font=font_item)
draw.text((OX + 355, OY + 645), "• PLA Matte Pastel", fill="#b45309", font=font_badge)
draw.text((OX + 355, OY + 665), "• Silk Dual-Color", fill="#b45309", font=font_badge)
draw.text((OX + 355, OY + 685), "• Sample Chibi & Keycap", fill="#b45309", font=font_badge)

# Workbench IoT Hardware & Testing
draw.rounded_rectangle([OX + 60, OY + 800, OX + 480, OY + 880], radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((OX + 80, OY + 830), "Workbench IoT Telemetry & Sensor Gudang Xavortree", fill="#475569", font=font_item)


# 3. RUANG RAPAT BERSAMA (BOARDROOM KACA - Kanan Bawah: MID_X2..OX+BW, OY+200..OY+BH)
r_meet = [MID_X2, OY + 200, OX + BW, OY + BH]
draw.rectangle(r_meet, fill="#faf5ff", outline="#8b5cf6", width=4)
# Plang Ruang Rapat
draw.rectangle([MID_X2 + 20, OY + 220, MID_X2 + 520, OY + 268], fill="#8b5cf6")
draw.text((MID_X2 + 32, OY + 230), "RUANG RAPAT BERSAMA (BOARDROOM)", fill="#ffffff", font=font_room)
draw.text((MID_X2 + 32, OY + 275), "Fasilitas Rapat Gabungan · Kickoff · Evaluasi Lintas Tim", fill="#6b21a8", font=font_sub)
draw.text((MID_X2 + 32, OY + 298), "Dinding Kaca Kedap Akustik (Kapasitas Rapat 8-10 Orang)", fill="#64748b", font=font_badge)

# Meja Rapat Besar (Kapsul Oval)
mx0, my0 = MID_X2 + 100, OY + 440
mw, mh = 480, 180
draw.rounded_rectangle([mx0, my0, mx0 + mw, my0 + mh], radius=50, fill="#f5ede4", outline="#7c5c38", width=3)
draw.text((mx0 + 130, my0 + 75), "MEJA BOARDROOM UTAMA", fill="#5c4033", font=font_room)

# 8 Kursi Rapat di sekeliling meja
# Atas
for i in range(3):
    cx = mx0 + 80 + i * 140
    draw.ellipse([cx, my0 - 55, cx + 55, my0 - 10], fill="#e2e8f0", outline="#7c5c38", width=2)
# Bawah
for i in range(3):
    cx = mx0 + 80 + i * 140
    draw.ellipse([cx, my0 + mh + 10, cx + 55, my0 + mh + 55], fill="#e2e8f0", outline="#7c5c38", width=2)
# Ujung Kiri (CEO Dimitri Desk / Presenter)
draw.ellipse([mx0 - 65, my0 + 60, mx0 - 15, my0 + 120], fill="#cbd5e1", outline="#1e293b", width=3)
draw.text((mx0 - 60, my0 + 85), "CEO", fill="#0f172a", font=font_badge)
# Ujung Kanan
draw.ellipse([mx0 + mw + 15, my0 + 60, mx0 + mw + 65, my0 + 120], fill="#e2e8f0", outline="#7c5c38", width=2)

# TV Presentation Display Wall
draw.rectangle([OX + BW - 25, OY + 360, OX + BW - 5, OY + 700], fill="#0f172a")
draw.text((OX + BW - 200, OY + 520), "TV DISPLAY SCREEN 85\"", fill="#38bdf8", font=font_badge)


# 4. PANTRY & COFFEE BAR (Kanan Atas: MID_X2..OX+BW, OY..OY+180)
r_pantry = [MID_X2, OY, OX + BW, OY + 180]
draw.rectangle(r_pantry, fill="#fdfbf7", outline="#e2e8f0", width=2)
draw.rectangle([MID_X2 + 30, OY + 30, MID_X2 + 320, OY + 130], fill="#ffffff", outline="#cbd5e1", width=1)
draw.text((MID_X2 + 45, OY + 50), "POJOK KOPI & PANTRY", fill="#7c5c38", font=font_item)
draw.text((MID_X2 + 45, OY + 75), "• Mesin Espresso & Kopi Tubruk Bima", fill="#64748b", font=font_badge)
draw.text((MID_X2 + 45, OY + 95), "• Area Istirahat Mandiri Staf", fill="#64748b", font=font_badge)


# 5. AREA TENGAH: EXECUTIVE COMMONS & LOUNGE (MID_X1..MID_X2)
r_center = [MID_X1 + 15, OY + 40, MID_X2 - 15, OY + BH - 40]
# Meja Komando Kai (Orkestrator & CoS)
draw.rounded_rectangle([MID_X1 + 60, OY + 120, MID_X1 + 340, OY + 230], radius=8, fill="#ffffff", outline="#6b4f3a", width=3)
draw.text((MID_X1 + 80, OY + 145), "Meja Komando Kai", fill="#6b4f3a", font=font_room)
draw.text((MID_X1 + 80, OY + 178), "Orkestrator & Chief of Staff", fill="#0f172a", font=font_item)
draw.text((MID_X1 + 80, OY + 200), "Gatekeeper & Executive Reporting", fill="#64748b", font=font_badge)
draw.ellipse([MID_X1 + 170, OY + 245, MID_X1 + 230, OY + 285], fill="#e2e8f0", outline="#6b4f3a", width=2)

# Sofa Lounge Santai L-Shape
lx, ly = MID_X1 + 60, OY + 480
draw.rounded_rectangle([lx, ly, lx + 260, ly + 80], radius=10, fill="#e2e8f0", outline="#94a3b8", width=2)
draw.rounded_rectangle([lx, ly + 80, lx + 90, ly + 240], radius=10, fill="#e2e8f0", outline="#94a3b8", width=2)
draw.rounded_rectangle([lx + 120, ly + 100, lx + 250, ly + 200], radius=6, fill="#f5ede4", outline="#cbd5e1", width=1) # Meja Kopi
draw.text((lx + 135, ly + 140), "Coffee Table", fill="#7c5c38", font=font_badge)
draw.text((lx + 40, ly + 280), "LOUNGE SANTAI AREA", fill="#475569", font=font_sub)

# Tanda Pintu Masuk / Partisi Kaca
draw.text((MID_X1 - 90, OY + 230), "PINTU ➜", fill="#0284c7", font=font_sub)
draw.text((MID_X1 - 90, OY + 680), "PINTU ➜", fill="#10b981", font=font_sub)
draw.text((MID_X2 + 20, OY + 360), "PINTU KACA ➜", fill="#8b5cf6", font=font_sub)

# Simpan ke folder artefak
target_path = "/Users/haimac/.gemini/antigravity/brain/c403628a-88d0-43ac-8269-bf48ec5b3de2/denah_kantor_team_dimitri.png"
img.save(target_path, "PNG")
print(f"Sukses generate gambar: {target_path}")
