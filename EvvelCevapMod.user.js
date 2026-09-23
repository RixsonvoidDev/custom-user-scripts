// ==UserScript==
// @name         Evvel Cevap Mod
// @namespace    https://github.com/RixsonvoidDev/custom-user-scripts/
// @version      1.0
// @author       RixsonvoidDev
// @description Evvel Cevap İçin Mod: Gereksiz Tüm elementleri (Yorumlar Dahil) kaldırır ve otomatik yenilemeyi bozar.
// @description:tr Evvel Cevap İçin Mod: Gereksiz Tüm elementleri (Yorumlar Dahil) kaldırır ve otomatik yenilemeyi bozar.
// @match        *://evvelcevap.com/*
// @grant        none
// @license MIT
// ==/UserScript==
 
(function () {
    'use strict';
    const oldSetTimeout = window.setTimeout;
    window.setTimeout = function(fn, delay, ...args) {
        let id = oldSetTimeout(fn, delay, ...args);
        if (delay === 300000) {
            clearTimeout(id);
        }
 
        return id;
    };
 
    const banner_observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
 
                const banner1 = document.querySelector('.article-tools__banner');
                const banner2 = document.querySelector('.article-tools__subjects-list');
                const banner3 = document.querySelector('.mk-reaction-title');
                const banner4 = document.querySelector('.mk-reaction-buttons');
                const banner5 = document.querySelector('.admatic-slot.admatic-slot--standard');
                const banner6 = document.querySelector('.admatic-slot.admatic-slot--standard');
                const banner7 = document.querySelector('.promo-banner.promo-banner--article-body');
                const banner8 = document.querySelector('.promo-banner.promo-banner--article-lead');
                const banner9 = document.querySelector('.ac-comments-hub');
                const popup1 = document.querySelector('.push-toast-wrap');
 
 
                if (banner1) banner1.remove();
                if (banner2) banner2.remove();
                if (banner3) banner3.remove();
                if (banner4) banner4.remove();
                if (banner5) banner5.remove();
                if (banner6) banner6.remove();
                if (banner7) banner7.remove();
                if (banner8) banner8.remove();
                if (banner9) banner9.remove();
                if (popup1) popup1.remove();
            }
        }
    });
 
    banner_observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
 
})();
