// ==UserScript==
// @name         C8Saver
// @namespace    https://github.com/RixsonvoidDev/custom-user-scripts/
// @version      1.0
// @author       RixsonvoidDev
// @description  2.5x | 3.0x | 3.5x Hız seçenekleriyle bilgileri daha hızlı tüketin. Yeni videoya geçtiğinizde yerel depolama dan son hızı çekip otomatik videoya uygular. #AI #veri #Türkiye #btkakademi #btk akademi #kurs
// @match        https://cinema8.com/raw-video/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
(function() {
    'use strict';

    const customLiHTML = `
        <li data-s="2.5" role="menuitem">
            <a href="javascript:void(0)" tabindex="0">2.5<i class="pull-right"></i></a>
        </li>
        <li data-s="3.0" role="menuitem">
            <a href="javascript:void(0)" tabindex="0">3.0<i class="pull-right"></i></a>
        </li>
        <li data-s="3.5" role="menuitem">
            <a href="javascript:void(0)" tabindex="0">3.5<i class="pull-right"></i></a>
        </li>
    `;

    const Speedinj_observer = new MutationObserver((mutations) => {
        const targetUl = document.querySelector('ul.dl-submenu.speed-select');

        if (targetUl) {
            const existingItem = targetUl.querySelector('li[data-s="2.5"]');

            if (!existingItem) {
                targetUl.insertAdjacentHTML('beforeend', customLiHTML);
                console.log("RixsonvoidDev: BTK C8Saver Script: Speed Options Added");
            }
        }

    });

    Speedinj_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });


    const STORAGE_KEY = "c8-player-speed-saver-by-rixsonvoid";

    const getSavedSettings = () => {

        try {

            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;

        } catch (e) {
            console.error("C8_Saver: JSON read error", e);
            return null;
        }

    };

    const saveSettings = (settings) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("C8_Saver: JSON write error", e);
        }
    };

    function initVideoTracker(video) {
        if (video.dataset.c8Tracked) return;
        video.dataset.c8Tracked = "true";

        const saved = getSavedSettings();
        if (saved && saved.speed) {
            video.addEventListener('loadedmetadata', () => {
                video.playbackRate = saved.speed;
                console.log(`C8_Saver: Saved speed applied -> ${saved.speed}`);
            }, { once: true });

            if (video.readyState >= 1) {
                video.playbackRate = saved.speed;
            }
        }

        video.addEventListener('ratechange', () => {
            if (video.playbackRate === 0) return;

            const currentSettings = getSavedSettings() || {};
            if (currentSettings.speed === video.playbackRate) return;

            currentSettings.speed = video.playbackRate;
            saveSettings(currentSettings);
        });

    }
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {

                const video = document.querySelector('video');
                if (video) {
                    initVideoTracker(video);
                    break;
                }

            }
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();