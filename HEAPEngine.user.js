// ==UserScript==
// @name         Unity Memory Inspector Engine
// @namespace    https://github.com/RixsonvoidDev/custom-user-scripts/
// @version      1.0
// @description  Clean, working Cheat Engine style memory scanner for Unity WebGL with iframe bridge and draggable UI. Just Press "Scan Frames" if you want to get ModMenu In That Window. FOR UNITY WASM GAMES.
// @author       RixsonvoidDev
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @license MIT
// ==/UserScript==

// This Script Was Made by RixsonvoidDev Assisted With Gemini AI

// Example Games To Try:
// https://www.hoodamath.com/games/snowrider3d.html
// https://www.hoodamath.com/games/drifthunters.html

(function () {
    'use strict';

    const TOP = window.top === window.self;

    // --- INSTANCE FINDER ---
    const getInst = () => {
        try {
            return window.gameInstance || window.unityInstance || Object.values(window).find(v => {
                try { return v && typeof v.Module === 'object'; } catch (e) { return false; }
            });
        } catch (e) {
            return null;
        }
    };

    let cachedByteOffsets = [];

    // --- CORE SCAN ENGINE ---
    function executeScan(buffer, targetVal, heapType, isNext) {
        const val = Number(targetVal);
        if (isNaN(val)) return [];

        const view = new DataView(buffer);
        let newResults = [];

        let step = 4;
        let readFunc = (v, offset) => v.getInt32(offset, true);

        if (heapType === 'HEAP16' || heapType === 'HEAPU16') {
            step = 2;
            readFunc = (v, offset) => heapType === 'HEAP16' ? v.getInt16(offset, true) : v.getUint16(offset, true);
        } else if (heapType === 'HEAP8' || heapType === 'HEAPU8') {
            step = 1;
            readFunc = (v, offset) => heapType === 'HEAP8' ? v.getInt8(offset) : v.getUint8(offset);
        } else if (heapType === 'HEAPF32') {
            step = 4;
            readFunc = (v, offset) => v.getFloat32(offset, true);
        }

        const maxByte = buffer.byteLength - step;

        if (!isNext) {
            for (let offset = 0; offset <= maxByte; offset += step) {
                try {
                    let cur = readFunc(view, offset);
                    let match = (heapType === 'HEAPF32') ? Math.abs(cur - val) < 0.0001 : cur === val;
                    if (match) {
                        newResults.push(offset);
                        if (newResults.length >= 1000000) break;
                    }
                } catch (e) {}
            }
            cachedByteOffsets = newResults;
        } else {
            if (!cachedByteOffsets || cachedByteOffsets.length === 0) return [];

            for (let i = 0; i < cachedByteOffsets.length; i++) {
                let offset = cachedByteOffsets[i];
                if (offset <= maxByte) {
                    try {
                        let cur = readFunc(view, offset);
                        let match = (heapType === 'HEAPF32') ? Math.abs(cur - val) < 0.0001 : cur === val;
                        if (match) {
                            newResults.push(offset);
                        }
                    } catch (e) {}
                }
            }
            cachedByteOffsets = newResults;
        }

        return cachedByteOffsets;
    }

    function readVal(buffer, offset, heapType) {
        try {
            const v = new DataView(buffer);
            if (heapType === 'HEAP32') return v.getInt32(offset, true);
            if (heapType === 'HEAP16') return v.getInt16(offset, true);
            if (heapType === 'HEAP8') return v.getInt8(offset);
            if (heapType === 'HEAPU32') return v.getUint32(offset, true);
            if (heapType === 'HEAPU16') return v.getUint16(offset, true);
            if (heapType === 'HEAPU8') return v.getUint8(offset);
            if (heapType === 'HEAPF32') return v.getFloat32(offset, true);
        } catch (e) {
            return null;
        }
    }

    function writeVal(buffer, offset, heapType, newVal) {
        try {
            const v = new DataView(buffer);
            const val = Number(newVal);
            if (heapType === 'HEAP32') v.setInt32(offset, val, true);
            else if (heapType === 'HEAP16') v.setInt16(offset, val, true);
            else if (heapType === 'HEAP8') v.setInt8(offset, val);
            else if (heapType === 'HEAPU32') v.setUint32(offset, val, true);
            else if (heapType === 'HEAPU16') v.setUint16(offset, val, true);
            else if (heapType === 'HEAPU8') v.setUint8(offset, val);
            else if (heapType === 'HEAPF32') v.setFloat32(offset, val, true);
            return true;
        } catch (e) {
            return false;
        }
    }

    // --- CROSS-FRAME BRIDGE ---
    if (!TOP) {
        window.addEventListener('message', e => {
            const d = e.data;
            if (!d || d.sender !== 'simple-engine-main') return;
            const inst = getInst();

            if (d.type === 'PING') {
                e.source.postMessage({ sender: 'simple-engine-frame', type: 'PONG', exists: !!inst }, e.origin);
            } else if (d.type === 'SCAN') {
                try {
                    const heap = inst?.Module?.[d.heapType];
                    if (!heap || !heap.buffer) throw new Error('Heap buffer not found');

                    if (Array.isArray(d.cache)) cachedByteOffsets = d.cache;

                    const res = executeScan(heap.buffer, d.value, d.heapType, d.isNext);
                    e.source.postMessage({
                        sender: 'simple-engine-frame',
                        type: 'SCAN_RES',
                        results: res.map(offset => ({ address: offset, value: readVal(heap.buffer, offset, d.heapType) })),
                        cache: cachedByteOffsets
                    }, e.origin);
                } catch (err) {
                    e.source.postMessage({ sender: 'simple-engine-frame', type: 'SCAN_RES', error: err.message }, e.origin);
                }
            } else if (d.type === 'WRITE_BATCH') {
                try {
                    const heap = inst?.Module?.[d.heapType];
                    if (heap && heap.buffer) {
                        d.addresses.forEach(addr => {
                            writeVal(heap.buffer, addr, d.heapType, d.value);
                        });
                    }
                    e.source.postMessage({ sender: 'simple-engine-frame', type: 'WRITE_RES', success: true }, e.origin);
                } catch (err) {
                    e.source.postMessage({ sender: 'simple-engine-frame', type: 'WRITE_RES', error: err.message }, e.origin);
                }
            }
        });
        return;
    }

    // --- MAIN WINDOW CONTROLLER ---
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!getInst()) showPopup();
            else initUI(false);
        }, 3000);
    });

    function showPopup() {
        if (document.getElementById('simple-overlay')) return;
        const ov = document.createElement('div');
        ov.id = 'simple-overlay';
        ov.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;`;
        ov.innerHTML = `
            <div style="background:#1e1e1e;color:#fff;padding:20px;border-radius:6px;border:1px solid #444;width:350px;text-align:center;font-family:sans-serif;">
                <div style="font-size:13px;font-weight:bold;margin-bottom:8px;">Unity Memory Inspector Engine:</div>
                <div style="font-size:10px;margin-bottom:8px;">gameInstance Not Found on Root</div>
                <div style="font-size:10px;color:#aaa;margin-bottom:15px;">Game is running inside an iframe. Scan inner frames?</div>
                <div style="display:flex;gap:6px;">
                    <button id="s-yes" style="flex:1;background:#0e639c;color:#fff;border:none;padding:6px;border-radius:4px;cursor:pointer;font-size:11px;">Scan Frames</button>
                    <button id="s-no" style="flex:1;background:#333;color:#fff;border:none;padding:6px;border-radius:4px;cursor:pointer;font-size:11px;">Stay Local</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        document.getElementById('s-yes').onclick = () => { ov.remove(); scanFrames(); };
        document.getElementById('s-no').onclick = () => { ov.remove(); initUI(false); };
    }

    let bridgeSource = null;
    function scanFrames() {
        const frames = document.querySelectorAll('iframe');
        if (!frames.length) { initUI(false); return; }
        frames.forEach(f => {
            try {
                if (f.contentWindow) f.contentWindow.postMessage({ sender: 'simple-engine-main', type: 'PING' }, '*');
            } catch (e) {}
        });

        const listener = e => {
            if (e.data?.sender === 'simple-engine-frame' && e.data.exists) {
                bridgeSource = e.source;
                window.removeEventListener('message', listener);
                initUI(true);
            }
        };
        window.addEventListener('message', listener);
        setTimeout(() => { if (!bridgeSource) initUI(false); }, 1500);
    }

    // --- DRAGGABLE UI & MINIMIZE CONTROLLER ---
    function initUI(isBridged) {
        if (document.getElementById('simple-engine-ui')) return;

        const ui = document.createElement('div');
        ui.id = 'simple-engine-ui';
        ui.style.cssText = `position:fixed;top:40px;left:40px;width:380px;background:#1e1e1e;color:#fff;border:1px solid #444;border-radius:6px;z-index:999998;font-family:sans-serif;user-select:none;box-shadow:0 8px 24px rgba(0,0,0,0.6);`;

        ui.innerHTML = `
            <div id="simple-header" style="background:#2d2d2d;padding:8px 12px;cursor:move;font-size:11px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #444;">
                <span id="ui-title">Unity Memory Inspector Engine ${isBridged ? '[BRIDGED]' : '[LOCAL]'}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span id="simple-min" style="cursor:pointer;color:#aaa;font-size:14px;font-weight:bold;padding:0 6px;line-height:10px;" title="Minimize">&#9472;</span>
                    <span id="simple-close" style="cursor:pointer;color:#aaa;font-size:14px;" title="Close">&times;</span>
                </div>
            </div>
            <div id="ui-content-wrapper" style="padding:12px;font-size:11px;">
                <div style="margin-bottom:8px;">
                    <label style="color:#aaa;font-size:10px;">HEAP (Module) TYPE:</label>
                    <select id="s-heap" style="width:100%;margin-top:3px;background:#2d2d2d;color:#fff;border:1px solid #555;padding:5px;border-radius:4px;font-size:11px;">
                        <option value="HEAP32" selected>HEAP32 (Standard Integer)</option>
                        <option value="HEAP16">HEAP16 (Short Integer)</option>
                        <option value="HEAP8">HEAP8 (Byte)</option>
                        <option value="HEAPU32">HEAPU32 (Unsigned Int)</option>
                        <option value="HEAPU16">HEAPU16 (Unsigned Short)</option>
                        <option value="HEAPU8">HEAPU8 (Unsigned Byte)</option>
                        <option value="HEAPF32">HEAPF32 (Float / Decimal)</option>
                    </select>
                </div>

                <div style="display:flex;gap:6px;margin-bottom:8px;">
                    <input type="text" id="s-input" placeholder="Value (e.g. 8)" style="flex:1;background:#2d2d2d;color:#fff;border:1px solid #555;padding:5px;border-radius:4px;font-size:11px;outline:none;">
                    <button id="s-first" style="background:#0e639c;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">New Scan</button>
                    <button id="s-next" style="background:#117711;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">Next Scan</button>
                </div>

                <div style="margin-bottom:8px;" id="table-container-wrap">
                    <div style="display:flex;justify-content:space-between;background:#252526;padding:4px 8px;border:1px solid #555;border-bottom:none;border-top-left-radius:4px;border-top-right-radius:4px;font-family:monospace;font-size:10px;color:#aaa;font-weight:bold;">
                        <span>ADDRESS</span>
                        <span>VALUE</span>
                    </div>
                    <select id="s-results" multiple style="width:100%;height:140px;background:#2d2d2d;color:#4ec9b0;border:1px solid #555;border-bottom-left-radius:4px;border-bottom-right-radius:4px;font-family:monospace;font-size:10px;box-sizing:border-box;resize:vertical;overflow-y:auto;"></select>
                </div>

                <div style="display:flex;gap:6px;">
                    <input type="text" id="s-edit" placeholder="New value" style="flex:1;background:#2d2d2d;color:#fff;border:1px solid #555;padding:5px;border-radius:4px;font-size:11px;outline:none;">
                    <button id="s-write" style="background:#b80b0b;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">Set Value</button>
                </div>
                <div id="s-status" style="margin-top:6px;color:#aaa;font-size:10px;">Ready.</div>
            </div>`;
        document.body.appendChild(ui);

        // --- DRAGGABLE UI ---
        const header = document.getElementById('simple-header');
        let drag = false, sx, sy, ix, iy, hasMoved = false;

        const startDrag = (e) => {
            if (e.target.id === 'simple-close' || e.target.id === 'simple-close-icon') return;
            drag = true;
            hasMoved = false;
            sx = e.clientX;
            sy = e.clientY;
            ix = ui.offsetLeft;
            iy = ui.offsetTop;
            document.onmousemove = dm;
            document.onmouseup = du;
        };

        header.onmousedown = startDrag;

        const dm = e => {
            if (!drag) return;
            if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) {
                hasMoved = true;
            }
            ui.style.left = (ix + e.clientX - sx) + 'px';
            ui.style.top = (iy + e.clientY - sy) + 'px';
        };

        const du = () => {
            drag = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };

        document.getElementById('simple-close').onclick = () => ui.remove();

        // --- MINIMIZE / RESTORE LOGIC ---
        let isMinimized = false;
        const contentWrap = document.getElementById('ui-content-wrapper');
        const minBtn = document.getElementById('simple-min');

        const toggleMinimize = (e) => {
            e.stopPropagation();
            if (hasMoved) return;

            isMinimized = !isMinimized;
            if (isMinimized) {
                contentWrap.style.display = 'none';
                ui.style.width = '55px';
                ui.style.height = '55px';
                ui.style.borderRadius = '6px';
                ui.style.padding = '0';
                header.style.height = '100%';
                header.style.padding = '0';
                header.style.borderBottom = 'none';
                header.style.background = '#252526';
                header.style.borderRadius = '6px';
                header.innerHTML = `
                    <div id="mini-box" style="width:55px;height:55px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:move;border:1px solid #555;border-radius:6px;background:#2d2d2d;box-sizing:border-box;">
                        <span style="font-size:9px;font-weight:bold;color:#FFFFFF;line-height:1.1;text-align:center;">Wasm</span>
                        <span style="font-size:9px;font-weight:bold;color:#FFFFFF;line-height:1.1;text-align:center;">CE</span>
                    </div>
                `;

                const miniBox = document.getElementById('mini-box');
                miniBox.onmousedown = startDrag;
                miniBox.onclick = (ev) => {
                    if (!hasMoved) {
                        toggleMinimize(ev);
                    }
                };
            } else {
                contentWrap.style.display = 'block';
                ui.style.width = '380px';
                ui.style.height = 'auto';
                ui.style.borderRadius = '6px';
                header.style.height = 'auto';
                header.style.padding = '8px 12px';
                header.style.borderBottom = '1px solid #444';
                header.style.background = '#2d2d2d';
                header.style.borderRadius = '6px 6px 0 0';
                header.innerHTML = `
                    <span id="ui-title">UNITY MEMORY SCANNER ${isBridged ? '[BRIDGED]' : '[LOCAL]'}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span id="simple-min" style="cursor:pointer;color:#aaa;font-size:14px;font-weight:bold;padding:0 6px;line-height:10px;" title="Minimize">&#9472;</span>
                        <span id="simple-close" style="cursor:pointer;color:#aaa;font-size:14px;" title="Close">&times;</span>
                    </div>
                `;
                document.getElementById('simple-close').onclick = () => ui.remove();
                document.getElementById('simple-min').onclick = toggleMinimize;
                header.onmousedown = startDrag;
            }
        };

        minBtn.onclick = toggleMinimize;

        const setStatus = (msg, isErr = false) => {
            const st = document.getElementById('s-status');
            if (st) {
                st.innerText = msg;
                st.style.color = isErr ? '#ff7b72' : '#aaa';
            }
        };

        const renderBox = (items) => {
            const box = document.getElementById('s-results');
            box.innerHTML = '';
            const limit = Math.min(items.length, 300);
            for (let i = 0; i < limit; i++) {
                const item = items[i];
                const opt = document.createElement('option');
                opt.value = item.address;
                opt.text = `0x${item.address.toString(16).toUpperCase().padEnd(10, ' ')} : ${item.value}`;
                box.appendChild(opt);
            }
        };

        // --- SHIFT + CLICK RANGE SELECTION LOGIC ---
        let lastSelectedIndex = -1;
        const resultsBox = document.getElementById('s-results');

        resultsBox.addEventListener('click', (e) => {
            if (e.target.tagName === 'OPTION') {
                const options = Array.from(resultsBox.options);
                const currentIndex = options.indexOf(e.target);

                if (e.shiftKey && lastSelectedIndex !== -1 && currentIndex !== -1) {
                    const start = Math.min(lastSelectedIndex, currentIndex);
                    const end = Math.max(lastSelectedIndex, currentIndex);
                    for (let i = start; i <= end; i++) {
                        options[i].selected = true;
                    }
                } else {
                    lastSelectedIndex = currentIndex;
                }
            }
        });

        const handleScan = (isNext) => {
            const heapType = document.getElementById('s-heap').value;
            const val = document.getElementById('s-input').value;
            if (!val) { setStatus('Error: Enter a value.', true); return; }

            setStatus(isNext ? 'Next scanning...' : 'New scanning...');

            if (isBridged && bridgeSource) {
                bridgeSource.postMessage({
                    sender: 'simple-engine-main',
                    type: 'SCAN',
                    heapType,
                    value: val,
                    isNext,
                    cache: cachedByteOffsets
                }, '*');

                const cb = e => {
                    if (e.data?.sender === 'simple-engine-frame' && e.data.type === 'SCAN_RES') {
                        window.removeEventListener('message', cb);
                        if (e.data.error) { setStatus(e.data.error, true); return; }
                        if (e.data.cache) cachedByteOffsets = e.data.cache;
                        renderBox(e.data.results);
                        setStatus(`Found ${e.data.results.length} matches.`);
                    }
                };
                window.addEventListener('message', cb);
            } else {
                try {
                    const inst = getInst();
                    const heap = inst?.Module?.[heapType];
                    if (!heap || !heap.buffer) throw new Error('Heap buffer not initialized');

                    const rawRes = executeScan(heap.buffer, val, heapType, isNext);
                    const formatted = rawRes.map(addr => ({ address: addr, value: readVal(heap.buffer, addr, heapType) }));
                    renderBox(formatted);
                    setStatus(`Found ${formatted.length} matches.`);
                } catch (err) {
                    setStatus('Error: ' + err.message, true);
                }
            }
        };

        document.getElementById('s-first').onclick = () => { cachedByteOffsets = []; handleScan(false); };
        document.getElementById('s-next').onclick = () => handleScan(true);

        document.getElementById('s-write').onclick = () => {
            const box = document.getElementById('s-results');
            const heapType = document.getElementById('s-heap').value;
            const newVal = document.getElementById('s-edit').value;

            const selectedOptions = Array.from(box.selectedOptions);
            if (selectedOptions.length === 0 || !newVal) {
                setStatus('Select address(es) and enter new value.', true);
                return;
            }

            const targetAddresses = selectedOptions.map(opt => Number(opt.value));

            if (isBridged && bridgeSource) {
                bridgeSource.postMessage({
                    sender: 'simple-engine-main',
                    type: 'WRITE_BATCH',
                    heapType,
                    addresses: targetAddresses,
                    value: newVal
                }, '*');
                setStatus(`Written ${newVal} to ${targetAddresses.length} address(es)`);
            } else {
                try {
                    const inst = getInst();
                    const heap = inst?.Module?.[heapType];
                    if (heap && heap.buffer) {
                        targetAddresses.forEach(addr => {
                            writeVal(heap.buffer, addr, heapType, newVal);
                        });
                        setStatus(`Written ${newVal} to ${targetAddresses.length} address(es)`);
                    }
                } catch (err) {
                    setStatus('Write error: ' + err.message, true);
                }
            }
        };
    }
})();