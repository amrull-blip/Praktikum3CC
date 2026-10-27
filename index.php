<?php
/**
 * ChromaCraft - Modern Random Color Palette Generator
 * PHP Native Application
 */

// --- Color Helper Functions ---

function clamp($val, $min, $max) {
    return max($min, min($max, $val));
}

function hslToRgb($h, $s, $l) {
    $h = fmod($h, 360);
    if ($h < 0) $h += 360;
    $s = clamp($s, 0, 100) / 100;
    $l = clamp($l, 0, 100) / 100;

    $c = (1 - abs(2 * $l - 1)) * $s;
    $x = $c * (1 - abs(fmod($h / 60, 2) - 1));
    $m = $l - $c / 2;

    if ($h < 60) {
        $r = $c; $g = $x; $b = 0;
    } elseif ($h < 120) {
        $r = $x; $g = $c; $b = 0;
    } elseif ($h < 180) {
        $r = 0; $g = $c; $b = $x;
    } elseif ($h < 240) {
        $r = 0; $g = $x; $b = $c;
    } elseif ($h < 300) {
        $r = $x; $g = 0; $b = $c;
    } else {
        $r = $c; $g = 0; $b = $x;
    }

    return [
        'r' => round(($r + $m) * 255),
        'g' => round(($g + $m) * 255),
        'b' => round(($b + $m) * 255)
    ];
}

function rgbToHex($r, $g, $b) {
    return sprintf("#%02x%02x%02x", $r, $g, $b);
}

function hslToHex($h, $s, $l) {
    $rgb = hslToRgb($h, $s, $l);
    return rgbToHex($rgb['r'], $rgb['g'], $rgb['b']);
}

function hexToRgb($hex) {
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

function getRelativeLuminance($hex) {
    $rgb = hexToRgb($hex);
    $channels = array_map(function($c) {
        $c = $c / 255;
        return ($c <= 0.03928) ? $c / 12.92 : pow(($c + 0.055) / 1.055, 2.4);
    }, $rgb);

    return 0.2126 * $channels['r'] + 0.7152 * $channels['g'] + 0.0722 * $channels['b'];
}

function getContrastTextColor($hex) {
    $luminance = getRelativeLuminance($hex);
    // Return dark slate or crisp white depending on luminance
    return ($luminance > 0.42) ? '#111827' : '#ffffff';
}

function getApproxColorName($h, $s, $l) {
    if ($l < 15) return 'Deep Obsidian';
    if ($l > 92 && $s < 15) return 'Snow White';
    if ($s < 12) {
        if ($l < 40) return 'Charcoal Grey';
        if ($l < 70) return 'Cool Slate';
        return 'Muted Platinum';
    }

    $h = fmod($h, 360);
    if ($h < 0) $h += 360;

    if ($h >= 345 || $h < 15) {
        return ($l > 75) ? 'Blush Pink' : (($l < 35) ? 'Crimson Wine' : 'Vibrant Red');
    } elseif ($h < 40) {
        return ($l > 75) ? 'Peach Cream' : (($l < 40) ? 'Warm Russet' : 'Sunset Orange');
    } elseif ($h < 65) {
        return ($l > 75) ? 'Soft Butter' : (($l < 40) ? 'Golden Ochre' : 'Electric Amber');
    } elseif ($h < 150) {
        return ($l > 75) ? 'Matcha Pastel' : (($l < 35) ? 'Forest Emerald' : 'Lush Jade');
    } elseif ($h < 200) {
        return ($l > 75) ? 'Mint Frost' : (($l < 35) ? 'Deep Teal' : 'Cyan Breeze');
    } elseif ($h < 260) {
        return ($l > 75) ? 'Baby Sky' : (($l < 35) ? 'Midnight Navy' : 'Cobalt Blue');
    } elseif ($h < 310) {
        return ($l > 75) ? 'Lavender Mist' : (($l < 35) ? 'Deep Plum' : 'Electric Violet');
    } else {
        return ($l > 75) ? 'Cotton Rose' : (($l < 35) ? 'Boysenberry' : 'Fuchsia Pop');
    }
}

function generatePalette($mode = 'harmonious', $count = 5) {
    $colors = [];
    $baseHue = rand(0, 360);

    for ($i = 0; $i < $count; $i++) {
        switch ($mode) {
            case 'analogous':
                $h = fmod($baseHue + ($i - floor($count / 2)) * 25 + 360, 360);
                $s = rand(60, 85);
                $l = 25 + ($i * 14);
                break;

            case 'monochromatic':
                $h = $baseHue;
                $s = rand(45, 75);
                $l = 18 + ($i * (70 / ($count - 1)));
                break;

            case 'triadic':
                $offsets = [0, 120, 240, 20, 140];
                $h = fmod($baseHue + ($offsets[$i % count($offsets)]), 360);
                $s = rand(60, 85);
                $l = rand(40, 65);
                break;

            case 'complementary':
                $offset = ($i % 2 === 0) ? 0 : 180;
                $h = fmod($baseHue + $offset + rand(-15, 15) + 360, 360);
                $s = rand(55, 85);
                $l = 25 + ($i * 12);
                break;

            case 'pastel':
                $h = fmod($baseHue + ($i * (360 / $count)) + rand(-10, 10) + 360, 360);
                $s = rand(35, 60);
                $l = rand(78, 88);
                break;

            case 'neon':
                $h = fmod($baseHue + ($i * 65) + 360, 360);
                $s = rand(90, 100);
                $l = rand(50, 65);
                break;

            case 'warm':
                // Warm hues: 340 to 60
                $h = rand(340, 420);
                $h = fmod($h, 360);
                $s = rand(65, 90);
                $l = rand(35, 75);
                break;

            case 'cool':
                // Cool hues: 160 to 270
                $h = rand(160, 270);
                $s = rand(55, 85);
                $l = rand(35, 75);
                break;

            case 'harmonious':
            default:
                // Golden ratio hue stepping for maximum harmony
                $goldenRatio = 137.5;
                $h = fmod($baseHue + ($i * $goldenRatio), 360);
                $s = rand(55, 85);
                $l = rand(35, 75);
                break;
        }

        $hex = hslToHex($h, $s, $l);
        $name = getApproxColorName($h, $s, $l);
        $contrast = getContrastTextColor($hex);
        $rgb = hexToRgb($hex);

        $colors[] = [
            'hex' => strtoupper($hex),
            'rgb' => "rgb({$rgb['r']}, {$rgb['g']}, {$rgb['b']})",
            'hsl' => "hsl(" . round($h) . ", " . round($s) . "%, " . round($l) . "%)",
            'h' => round($h),
            's' => round($s),
            'l' => round($l),
            'textColor' => $contrast,
            'name' => $name,
            'isLocked' => false
        ];
    }

    return $colors;
}

// Check if palette is passed via query params e.g. ?palette=264653-2a9d8f-e9c46a-f4a261-e76f51
$paletteQuery = isset($_GET['palette']) ? trim($_GET['palette']) : '';
$selectedMode = isset($_GET['mode']) ? trim($_GET['mode']) : 'harmonious';

$initialColors = [];

if (!empty($paletteQuery)) {
    $hexList = explode('-', $paletteQuery);
    foreach ($hexList as $hexRaw) {
        $hexClean = preg_replace('/[^0-9a-fA-F]/', '', $hexRaw);
        if (strlen($hexClean) === 6 || strlen($hexClean) === 3) {
            $hex = '#' . $hexClean;
            $rgb = hexToRgb($hex);
            // approximate HSL
            $initialColors[] = [
                'hex' => strtoupper($hex),
                'rgb' => "rgb({$rgb['r']}, {$rgb['g']}, {$rgb['b']})",
                'hsl' => 'hsl(0, 0%, 50%)',
                'h' => 0, 's' => 0, 'l' => 50,
                'textColor' => getContrastTextColor($hex),
                'name' => 'Custom Color',
                'isLocked' => false
            ];
        }
    }
}

if (count($initialColors) < 2) {
    $initialColors = generatePalette($selectedMode, 5);
}

$harmonyModes = [
    'harmonious' => 'Harmonious (Golden Ratio)',
    'analogous' => 'Analogous',
    'complementary' => 'Complementary',
    'triadic' => 'Triadic',
    'monochromatic' => 'Monochromatic',
    'pastel' => 'Soft Pastel',
    'neon' => 'Cyberpunk Neon',
    'warm' => 'Warm Sunset',
    'cool' => 'Cool Ocean'
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChromaCraft &bull; Generator Random Color Palette PHP Native</title>
    <meta name="description" content="Generator palet warna acak interaktif bertenaga PHP native. Cepat, indah, mendukung ekspor CSS, lock color, dan UI mockup preview.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Top Navigation Bar -->
    <header class="app-header">
        <div class="header-left">
            <div class="logo">
                <span class="logo-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
                </span>
                <span class="logo-text">Chroma<strong>Craft</strong></span>
                <span class="badge-php">PHP Native</span>
            </div>

            <div class="harmony-selector-wrapper">
                <label for="harmonySelect" class="sr-only">Mode Harmoni</label>
                <div class="select-box">
                    <svg class="select-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <select id="harmonySelect" title="Pilih Mode Harmoni">
                        <?php foreach ($harmonyModes as $key => $label): ?>
                            <option value="<?= htmlspecialchars($key) ?>" <?= ($key === $selectedMode) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($label) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>

        <div class="header-center">
            <span class="instruction-pill">
                Tekan <kbd>SPASI</kbd> untuk warna baru
            </span>
        </div>

        <div class="header-right">
            <button id="btnSoundToggle" class="btn-icon" title="Toggle Efek Audio" aria-label="Toggle Sound">
                <svg id="iconSoundOn" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            </button>
            <button id="btnQuickPreview" class="btn-secondary" title="Pratinjau Mockup UI">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>Pratinjau UI</span>
            </button>
            <button id="btnSavedDrawer" class="btn-secondary" title="Koleksi Tersimpan">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Tersimpan</span>
                <span id="savedBadge" class="counter-badge">0</span>
            </button>
            <button id="btnExport" class="btn-secondary" title="Ekspor Palet">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Ekspor</span>
            </button>
            <button id="btnGenerate" class="btn-primary" title="Acak Palet Sekarang">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Generate</span>
            </button>
        </div>
    </header>

    <!-- Main Palette Canvas Area -->
    <main id="paletteContainer" class="palette-grid">
        <!-- Rendered initially via PHP for instant server-side hydration -->
        <?php foreach ($initialColors as $idx => $c): ?>
            <div class="color-column" data-index="<?= $idx ?>" style="background-color: <?= $c['hex'] ?>; color: <?= $c['textColor'] ?>;">
                <!-- Column Top Actions -->
                <div class="column-header">
                    <button class="col-btn btn-lock" title="Kunci warna ini (L)" aria-label="Kunci warna">
                        <svg class="icon-unlocked" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                        <svg class="icon-locked hidden" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </button>
                </div>

                <!-- Column Center / Color Details -->
                <div class="column-body">
                    <button class="col-hex-btn" title="Klik untuk menyalin HEX">
                        <span class="hex-value"><?= $c['hex'] ?></span>
                        <span class="copy-hint">Salin HEX</span>
                    </button>
                    <div class="color-name"><?= htmlspecialchars($c['name']) ?></div>
                    <div class="color-subvalues">
                        <span class="sub-val" data-type="rgb" title="Klik untuk salin RGB"><?= $c['rgb'] ?></span>
                        <span class="sub-val" data-type="hsl" title="Klik untuk salin HSL"><?= $c['hsl'] ?></span>
                    </div>
                </div>

                <!-- Column Bottom Actions -->
                <div class="column-footer">
                    <label class="col-btn btn-picker" title="Pilih Warna Manual">
                        <input type="color" class="color-picker-input" value="<?= $c['hex'] ?>">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                        </svg>
                    </label>

                    <button class="col-btn btn-copy-color" title="Salin Kode HEX">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>

                    <div class="col-nav-btns">
                        <button class="col-btn btn-move-left" title="Geser ke Kiri" <?= $idx === 0 ? 'disabled' : '' ?>>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="col-btn btn-move-right" title="Geser ke Kanan" <?= $idx === count($initialColors) - 1 ? 'disabled' : '' ?>>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </main>

    <!-- Floating Action Dock (Mobile & Quick Actions) -->
    <div class="floating-dock">
        <button id="btnDockGenerate" class="dock-btn-main">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Acak Warna</span>
        </button>
        <div class="dock-divider"></div>
        <button id="btnDockSave" class="dock-btn" title="Simpan ke Koleksi">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
        </button>
        <button id="btnDockShare" class="dock-btn" title="Salin Tautan Bagikan">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
        </button>
    </div>

    <!-- UI Mockup Preview Modal -->
    <div id="previewModal" class="modal-backdrop hidden">
        <div class="modal-card modal-large">
            <div class="modal-header">
                <div>
                    <h3 class="modal-title">Pratinjau Mockup Desain UI</h3>
                    <p class="modal-subtitle">Lihat keharmonisan palet warnamu saat diterapkan pada komponen UI nyata.</p>
                </div>
                <button class="modal-close" data-modal="previewModal">&times;</button>
            </div>
            <div class="modal-body preview-canvas" id="previewCanvas">
                <!-- Dynamic UI Mockup injected via JavaScript -->
            </div>
        </div>
    </div>

    <!-- Export Modal -->
    <div id="exportModal" class="modal-backdrop hidden">
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <h3 class="modal-title">Ekspor Palet Warna</h3>
                    <p class="modal-subtitle">Gunakan format pilihanmu untuk styling CSS, Tailwind, SVG, atau JSON.</p>
                </div>
                <button class="modal-close" data-modal="exportModal">&times;</button>
            </div>
            <div class="modal-tabs">
                <button class="tab-btn active" data-tab="css">CSS Variabel</button>
                <button class="tab-btn" data-tab="tailwind">Tailwind CSS</button>
                <button class="tab-btn" data-tab="json">JSON</button>
                <button class="tab-btn" data-tab="svg">SVG Vector</button>
            </div>
            <div class="modal-body">
                <div class="code-export-box">
                    <pre><code id="exportCodeOutput">--color-1: #ffffff;</code></pre>
                </div>
                <div class="export-actions">
                    <button id="btnCopyExport" class="btn-primary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Salin Kode</span>
                    </button>
                    <button id="btnDownloadExport" class="btn-secondary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Unduh File</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Saved Palettes Drawer -->
    <div id="savedDrawer" class="drawer-backdrop hidden">
        <div class="drawer-panel">
            <div class="drawer-header">
                <div>
                    <h3 class="drawer-title">Koleksi Palet Tersimpan</h3>
                    <p class="drawer-subtitle">Tersimpan secara lokal di browser Anda.</p>
                </div>
                <button class="drawer-close" id="btnCloseDrawer">&times;</button>
            </div>
            <div id="savedListContainer" class="drawer-body">
                <!-- Rendered dynamically -->
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>Belum ada palet yang disimpan.</p>
                    <span class="subtext">Klik tombol "Simpan" di pojok kanan bawah atau tekan 'S' untuk menyimpan palet favoritmu.</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toastNotification" class="toast hidden">
        <span class="toast-indicator"></span>
        <span id="toastMessage">Tersalin ke papan klip!</span>
    </div>

    <!-- Pass initial PHP state safely to client -->
    <script>
        window.INITIAL_PALETTE = <?= json_encode($initialColors, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
        window.INITIAL_MODE = <?= json_encode($selectedMode) ?>;
    </script>
    <script src="assets/js/app.js"></script>
</body>
</html>
