/**
 * ChromaCraft - Frontend Logic
 * Interactive Color Palette Generator
 */

(function() {
    'use strict';

    // State
    let palette = window.INITIAL_PALETTE || [];
    let currentMode = window.INITIAL_MODE || 'harmonious';
    let soundEnabled = true;
    let savedPalettes = JSON.parse(localStorage.getItem('chromacraft_saved') || '[]');
    let currentExportTab = 'css';

    // DOM Elements
    const paletteContainer = document.getElementById('paletteContainer');
    const harmonySelect = document.getElementById('harmonySelect');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnDockGenerate = document.getElementById('btnDockGenerate');
    const btnDockSave = document.getElementById('btnDockSave');
    const btnDockShare = document.getElementById('btnDockShare');
    const btnSoundToggle = document.getElementById('btnSoundToggle');
    const iconSoundOn = document.getElementById('iconSoundOn');
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const savedBadge = document.getElementById('savedBadge');

    // Modals & Drawer Elements
    const btnQuickPreview = document.getElementById('btnQuickPreview');
    const previewModal = document.getElementById('previewModal');
    const previewCanvas = document.getElementById('previewCanvas');
    const btnExport = document.getElementById('btnExport');
    const exportModal = document.getElementById('exportModal');
    const exportCodeOutput = document.getElementById('exportCodeOutput');
    const btnCopyExport = document.getElementById('btnCopyExport');
    const btnDownloadExport = document.getElementById('btnDownloadExport');
    const btnSavedDrawer = document.getElementById('btnSavedDrawer');
    const savedDrawer = document.getElementById('savedDrawer');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    const savedListContainer = document.getElementById('savedListContainer');

    // --- Web Audio Synthesizer (Click/Pop effects) ---
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function playSound(type = 'pop') {
        if (!soundEnabled || !AudioContextClass) return;
        try {
            if (!audioCtx) audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            if (type === 'pop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'lock') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.setValueAtTime(900, now + 0.04);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.start(now);
                osc.stop(now + 0.07);
            }
        } catch (e) {
            // Audio context failed or blocked by browser policy
        }
    }

    // --- Color Math Utilities ---
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function hslToRgb(h, s, l) {
        h = (h % 360 + 360) % 360;
        s = clamp(s, 0, 100) / 100;
        l = clamp(l, 0, 100) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    function hslToHex(h, s, l) {
        const rgb = hslToRgb(h, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        return {
            r: parseInt(hex.substring(0, 2), 16) || 0,
            g: parseInt(hex.substring(2, 4), 16) || 0,
            b: parseInt(hex.substring(4, 6), 16) || 0
        };
    }

    function getRelativeLuminance(hex) {
        const rgb = hexToRgb(hex);
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getContrastTextColor(hex) {
        const lum = getRelativeLuminance(hex);
        return lum > 0.42 ? '#111827' : '#ffffff';
    }

    function getColorName(h, s, l) {
        if (l < 15) return 'Deep Obsidian';
        if (l > 92 && s < 15) return 'Snow White';
        if (s < 12) {
            if (l < 40) return 'Charcoal Grey';
            if (l < 70) return 'Cool Slate';
            return 'Muted Platinum';
        }

        h = (h % 360 + 360) % 360;

        if (h >= 345 || h < 15) {
            return l > 75 ? 'Blush Pink' : (l < 35 ? 'Crimson Wine' : 'Vibrant Red');
        } else if (h < 40) {
            return l > 75 ? 'Peach Cream' : (l < 40 ? 'Warm Russet' : 'Sunset Orange');
        } else if (h < 65) {
            return l > 75 ? 'Soft Butter' : (l < 40 ? 'Golden Ochre' : 'Electric Amber');
        } else if (h < 150) {
            return l > 75 ? 'Matcha Pastel' : (l < 35 ? 'Forest Emerald' : 'Lush Jade');
        } else if (h < 200) {
            return l > 75 ? 'Mint Frost' : (l < 35 ? 'Deep Teal' : 'Cyan Breeze');
        } else if (h < 260) {
            return l > 75 ? 'Baby Sky' : (l < 35 ? 'Midnight Navy' : 'Cobalt Blue');
        } else if (h < 310) {
            return l > 75 ? 'Lavender Mist' : (l < 35 ? 'Deep Plum' : 'Electric Violet');
        } else {
            return l > 75 ? 'Cotton Rose' : (l < 35 ? 'Boysenberry' : 'Fuchsia Pop');
        }
    }

    function randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // --- Palette Generation ---
    function generateNewColor(mode, index, total, baseHue) {
        let h, s, l;

        switch (mode) {
            case 'analogous':
                h = (baseHue + (index - Math.floor(total / 2)) * 25 + 360) % 360;
                s = randomRange(60, 85);
                l = 25 + (index * 14);
                break;

            case 'monochromatic':
                h = baseHue;
                s = randomRange(45, 75);
                l = 18 + (index * (70 / (total - 1)));
                break;

            case 'triadic':
                const offsets = [0, 120, 240, 20, 140];
                h = (baseHue + offsets[index % offsets.length]) % 360;
                s = randomRange(60, 85);
                l = randomRange(40, 65);
                break;

            case 'complementary':
                const compOffset = (index % 2 === 0) ? 0 : 180;
                h = (baseHue + compOffset + randomRange(-15, 15) + 360) % 360;
                s = randomRange(55, 85);
                l = 25 + (index * 12);
                break;

            case 'pastel':
                h = (baseHue + (index * (360 / total)) + randomRange(-10, 10) + 360) % 360;
                s = randomRange(35, 60);
                l = randomRange(78, 88);
                break;

            case 'neon':
                h = (baseHue + (index * 65) + 360) % 360;
                s = randomRange(90, 100);
                l = randomRange(50, 65);
                break;

            case 'warm':
                h = (randomRange(340, 420)) % 360;
                s = randomRange(65, 90);
                l = randomRange(35, 75);
                break;

            case 'cool':
                h = randomRange(160, 270);
                s = randomRange(55, 85);
                l = randomRange(35, 75);
                break;

            case 'harmonious':
            default:
                const goldenRatio = 137.5;
                h = (baseHue + (index * goldenRatio)) % 360;
                s = randomRange(55, 85);
                l = randomRange(35, 75);
                break;
        }

        const hex = hslToHex(h, s, l);
        const rgb = hslToRgb(h, s, l);
        const name = getColorName(h, s, l);
        const textColor = getContrastTextColor(hex);

        return {
            hex,
            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hsl: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
            h: Math.round(h),
            s: Math.round(s),
            l: Math.round(l),
            textColor,
            name,
            isLocked: false
        };
    }

    function randomizePalette() {
        const baseHue = randomRange(0, 360);
        const total = palette.length;

        palette = palette.map((color, index) => {
            if (color.isLocked) return color;
            return generateNewColor(currentMode, index, total, baseHue);
        });

        renderPalette();
        updateUrlHash();
        playSound('pop');
    }

    // --- DOM Rendering ---
    function renderPalette() {
        paletteContainer.innerHTML = '';

        palette.forEach((color, index) => {
            const col = document.createElement('div');
            col.className = 'color-column';
            col.dataset.index = index;
            col.style.backgroundColor = color.hex;
            col.style.color = color.textColor;

            col.innerHTML = `
                <div class="column-header">
                    <button class="col-btn btn-lock ${color.isLocked ? 'is-locked' : ''}" title="${color.isLocked ? 'Buka kunci (L)' : 'Kunci warna ini (L)'}">
                        <svg class="icon-unlocked ${color.isLocked ? 'hidden' : ''}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                        <svg class="icon-locked ${color.isLocked ? '' : 'hidden'}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </button>
                </div>

                <div class="column-body">
                    <button class="col-hex-btn" title="Klik untuk menyalin HEX">
                        <span class="hex-value">${color.hex}</span>
                        <span class="copy-hint">Salin HEX</span>
                    </button>
                    <div class="color-name">${color.name}</div>
                    <div class="color-subvalues">
                        <span class="sub-val" data-type="rgb" title="Klik untuk salin RGB">${color.rgb}</span>
                        <span class="sub-val" data-type="hsl" title="Klik untuk salin HSL">${color.hsl}</span>
                    </div>
                </div>

                <div class="column-footer">
                    <label class="col-btn btn-picker" title="Pilih Warna Manual">
                        <input type="color" class="color-picker-input" value="${color.hex}">
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
                        <button class="col-btn btn-move-left" title="Geser ke Kiri" ${index === 0 ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="col-btn btn-move-right" title="Geser ke Kanan" ${index === palette.length - 1 ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            attachColumnListeners(col, index);
            paletteContainer.appendChild(col);
        });
    }

    function attachColumnListeners(colElement, index) {
        // Lock button
        const lockBtn = colElement.querySelector('.btn-lock');
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            palette[index].isLocked = !palette[index].isLocked;
            playSound('lock');
            renderPalette();
        });

        // Copy HEX
        const hexBtn = colElement.querySelector('.col-hex-btn');
        const copyColorBtn = colElement.querySelector('.btn-copy-color');
        const copyHandler = (e) => {
            e.stopPropagation();
            copyToClipboard(palette[index].hex, `HEX ${palette[index].hex} disalin!`);
        };
        hexBtn.addEventListener('click', copyHandler);
        copyColorBtn.addEventListener('click', copyHandler);

        // Subvalues copy
        const subVals = colElement.querySelectorAll('.sub-val');
        subVals.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                const val = (type === 'rgb') ? palette[index].rgb : palette[index].hsl;
                copyToClipboard(val, `${type.toUpperCase()} ${val} disalin!`);
            });
        });

        // Color Picker
        const pickerInput = colElement.querySelector('.color-picker-input');
        pickerInput.addEventListener('input', (e) => {
            const hex = e.target.value.toUpperCase();
            const rgb = hexToRgb(hex);
            palette[index].hex = hex;
            palette[index].rgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            palette[index].textColor = getContrastTextColor(hex);
            palette[index].name = 'Custom Pick';
            renderPalette();
            updateUrlHash();
        });

        // Move Left / Right
        const btnLeft = colElement.querySelector('.btn-move-left');
        const btnRight = colElement.querySelector('.btn-move-right');

        if (btnLeft) {
            btnLeft.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index > 0) {
                    const temp = palette[index];
                    palette[index] = palette[index - 1];
                    palette[index - 1] = temp;
                    renderPalette();
                    updateUrlHash();
                }
            });
        }

        if (btnRight) {
            btnRight.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index < palette.length - 1) {
                    const temp = palette[index];
                    palette[index] = palette[index + 1];
                    palette[index + 1] = temp;
                    renderPalette();
                    updateUrlHash();
                }
            });
        }
    }

    // --- Clipboard & Toast ---
    let toastTimeout = null;
    function copyToClipboard(text, message = 'Tersalin ke papan klip!') {
        navigator.clipboard.writeText(text).then(() => {
            showToast(message);
        }).catch(() => {
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast(message);
        });
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2200);
    }

    // --- URL Sync ---
    function updateUrlHash() {
        const hexes = palette.map(c => c.hex.replace('#', '')).join('-');
        const newUrl = `${window.location.pathname}?palette=${hexes}&mode=${currentMode}`;
        window.history.replaceState(null, '', newUrl);
    }

    // --- Saved Palettes System ---
    function updateSavedBadge() {
        savedBadge.textContent = savedPalettes.length;
    }

    function saveCurrentPalette() {
        const hexList = palette.map(c => c.hex);
        // Check duplicate
        const exists = savedPalettes.some(p => JSON.stringify(p.colors) === JSON.stringify(hexList));
        if (exists) {
            showToast('Palet ini sudah ada di koleksimu!');
            return;
        }

        savedPalettes.unshift({
            id: Date.now(),
            colors: hexList,
            mode: currentMode,
            date: new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });

        localStorage.setItem('chromacraft_saved', JSON.stringify(savedPalettes));
        updateSavedBadge();
        showToast('Palet berhasil disimpan!');
        renderSavedDrawer();
    }

    function renderSavedDrawer() {
        if (savedPalettes.length === 0) {
            savedListContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>Belum ada palet yang disimpan.</p>
                    <span class="subtext">Klik tombol simpan atau tekan 'S' untuk menyimpan palet favoritmu.</span>
                </div>
            `;
            return;
        }

        savedListContainer.innerHTML = '';
        savedPalettes.forEach(item => {
            const card = document.createElement('div');
            card.className = 'saved-palette-card';

            const swatchesHtml = item.colors.map(hex => `<div class="saved-swatch-item" style="background-color: ${hex};" title="${hex}"></div>`).join('');

            card.innerHTML = `
                <div class="saved-swatches" title="Klik untuk memuat palet ini">${swatchesHtml}</div>
                <div class="saved-card-footer">
                    <span class="saved-time">${item.date}</span>
                    <div class="saved-card-actions">
                        <button class="saved-btn btn-apply-saved">Terapkan</button>
                        <button class="saved-btn btn-copy-saved">Salin</button>
                        <button class="saved-btn saved-btn-delete">&times;</button>
                    </div>
                </div>
            `;

            // Apply palette
            const applyPalette = () => {
                palette = item.colors.map(hex => {
                    const rgb = hexToRgb(hex);
                    return {
                        hex: hex.toUpperCase(),
                        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                        hsl: 'hsl(0, 0%, 50%)',
                        h: 0, s: 0, l: 50,
                        textColor: getContrastTextColor(hex),
                        name: 'Saved Color',
                        isLocked: false
                    };
                });
                renderPalette();
                updateUrlHash();
                savedDrawer.classList.add('hidden');
                showToast('Palet tersimpan berhasil diterapkan!');
            };

            card.querySelector('.saved-swatches').addEventListener('click', applyPalette);
            card.querySelector('.btn-apply-saved').addEventListener('click', applyPalette);

            // Copy hex string
            card.querySelector('.btn-copy-saved').addEventListener('click', () => {
                copyToClipboard(item.colors.join(', '), 'Kode warna palet disalin!');
            });

            // Delete
            card.querySelector('.saved-btn-delete').addEventListener('click', () => {
                savedPalettes = savedPalettes.filter(p => p.id !== item.id);
                localStorage.setItem('chromacraft_saved', JSON.stringify(savedPalettes));
                updateSavedBadge();
                renderSavedDrawer();
                showToast('Palet dihapus.');
            });

            savedListContainer.appendChild(card);
        });
    }

    // --- UI Mockup Preview ---
    function renderUiMockup() {
        const c = palette.map(p => p.hex);
        const t = palette.map(p => p.textColor);

        const primary = c[0] || '#6366f1';
        const primaryText = t[0] || '#ffffff';
        const secondary = c[1] || '#ec4899';
        const secondaryText = t[1] || '#ffffff';
        const accent = c[2] || '#f59e0b';
        const accentText = t[2] || '#111827';
        const bgSurface = c[3] || '#1e293b';
        const bgSurfaceText = t[3] || '#ffffff';
        const baseBg = c[4] || '#0f172a';
        const baseBgText = t[4] || '#ffffff';

        previewCanvas.innerHTML = `
            <div class="mock-container" style="background-color: ${baseBg}; color: ${baseBgText}; padding: 1.5rem; border-radius: 16px;">
                <!-- Mock Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.15);">
                    <div style="font-weight: 800; font-size: 1.15rem; color: ${primaryText}; background: ${primary}; padding: 4px 12px; border-radius: 8px;">
                        BrandApp
                    </div>
                    <div style="display: flex; gap: 1rem; font-size: 0.85rem; font-weight: 600;">
                        <span>Fitur</span>
                        <span>Komponen</span>
                        <span>Harga</span>
                    </div>
                </div>

                <!-- Mock Hero Card -->
                <div class="mock-card" style="background-color: ${bgSurface}; color: ${bgSurfaceText};">
                    <div class="mock-hero-header">
                        <span class="mock-badge" style="background-color: ${accent}; color: ${accentText};">Eksplorasi Warna</span>
                        <span style="font-size: 0.8rem; opacity: 0.75;">Pratinjau Nyata</span>
                    </div>
                    <h4 class="mock-title">Harmonisasi Desain Antarmuka Anda</h4>
                    <p class="mock-desc">Palet warna yang dipilih secara seimbang mempercepat pembuatan komponen, tombol, kartu, dan tipografi yang memukau mata.</p>
                    <div class="mock-btn-group">
                        <button class="mock-btn" style="background-color: ${primary}; color: ${primaryText};">Mulai Sekarang</button>
                        <button class="mock-btn" style="background-color: ${secondary}; color: ${secondaryText};">Pelajari Dokumentasi</button>
                    </div>
                </div>

                <!-- Mock Stat Boxes -->
                <div class="mock-stats-row">
                    <div class="mock-stat-box" style="background-color: ${primary}; color: ${primaryText};">
                        <div class="mock-stat-val">99.8%</div>
                        <div class="mock-stat-lbl">Akurasi Harmoni</div>
                    </div>
                    <div class="mock-stat-box" style="background-color: ${secondary}; color: ${secondaryText};">
                        <div class="mock-stat-val">5x</div>
                        <div class="mock-stat-lbl">Kecepatan Prototyping</div>
                    </div>
                    <div class="mock-stat-box" style="background-color: ${accent}; color: ${accentText};">
                        <div class="mock-stat-val">AAA</div>
                        <div class="mock-stat-lbl">Kontras Aksesibilitas</div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Export Formats ---
    function updateExportCode() {
        const hexList = palette.map(p => p.hex);
        let code = '';

        if (currentExportTab === 'css') {
            code = `:root {\n` + hexList.map((hex, i) => `  --color-${i + 1}: ${hex};`).join('\n') + `\n}`;
        } else if (currentExportTab === 'tailwind') {
            const colorsObj = {};
            hexList.forEach((hex, i) => {
                colorsObj[`palette-${i + 1}`] = hex;
            });
            code = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colorsObj, null, 8)}\n    }\n  }\n};`;
        } else if (currentExportTab === 'json') {
            const data = palette.map((p, i) => ({
                index: i + 1,
                hex: p.hex,
                rgb: p.rgb,
                hsl: p.hsl,
                name: p.name
            }));
            code = JSON.stringify(data, null, 2);
        } else if (currentExportTab === 'svg') {
            const width = 1000;
            const height = 240;
            const colWidth = width / hexList.length;
            const rects = hexList.map((hex, i) => `  <rect x="${i * colWidth}" y="0" width="${colWidth}" height="${height}" fill="${hex}" />`).join('\n');
            const texts = hexList.map((hex, i) => `  <text x="${i * colWidth + 20}" y="${height - 25}" fill="${palette[i].textColor}" font-family="sans-serif" font-weight="bold" font-size="20">${hex}</text>`).join('\n');
            code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n${rects}\n${texts}\n</svg>`;
        }

        exportCodeOutput.textContent = code;
    }

    function downloadExportFile() {
        const code = exportCodeOutput.textContent;
        let mime = 'text/plain';
        let filename = `palette-${Date.now()}`;

        if (currentExportTab === 'css') {
            mime = 'text/css';
            filename += '.css';
        } else if (currentExportTab === 'tailwind') {
            mime = 'application/javascript';
            filename = 'tailwind-colors.js';
        } else if (currentExportTab === 'json') {
            mime = 'application/json';
            filename += '.json';
        } else if (currentExportTab === 'svg') {
            mime = 'image/svg+xml';
            filename += '.svg';
        }

        const blob = new Blob([code], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`File ${filename} berhasil diunduh!`);
    }

    // --- Event Listeners ---

    // Harmony Selector
    harmonySelect.addEventListener('change', (e) => {
        currentMode = e.target.value;
        randomizePalette();
    });

    // Generate Buttons
    btnGenerate.addEventListener('click', randomizePalette);
    btnDockGenerate.addEventListener('click', randomizePalette);

    // Dock Save & Share
    btnDockSave.addEventListener('click', saveCurrentPalette);
    btnDockShare.addEventListener('click', () => {
        const fullUrl = window.location.href;
        copyToClipboard(fullUrl, 'Tautan palet berhasil disalin!');
    });

    // Sound toggle
    btnSoundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        btnSoundToggle.style.opacity = soundEnabled ? '1' : '0.4';
        showToast(soundEnabled ? 'Efek suara diaktifkan' : 'Efek suara dimatikan');
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Prevent when typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            randomizePalette();
        } else if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveCurrentPalette();
        } else if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const hexes = palette.map(p => p.hex).join(', ');
            copyToClipboard(hexes, 'Seluruh palet warna disalin!');
        }
    });

    // Modals & Drawers controls
    btnQuickPreview.addEventListener('click', () => {
        renderUiMockup();
        previewModal.classList.remove('hidden');
    });

    btnExport.addEventListener('click', () => {
        updateExportCode();
        exportModal.classList.remove('hidden');
    });

    btnSavedDrawer.addEventListener('click', () => {
        renderSavedDrawer();
        savedDrawer.classList.remove('hidden');
    });

    btnCloseDrawer.addEventListener('click', () => {
        savedDrawer.classList.add('hidden');
    });

    // Close on backdrop click or close button
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            document.getElementById(modalId).classList.add('hidden');
        });
    });

    [previewModal, exportModal, savedDrawer].forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.add('hidden');
            }
        });
    });

    // Export Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentExportTab = btn.dataset.tab;
            updateExportCode();
        });
    });

    btnCopyExport.addEventListener('click', () => {
        copyToClipboard(exportCodeOutput.textContent, 'Kode ekspor berhasil disalin!');
    });

    btnDownloadExport.addEventListener('click', downloadExportFile);

    // Initial Setup
    renderPalette();
    updateSavedBadge();
})();
