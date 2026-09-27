// ==UserScript==
// @name         Short Link Task Skip Instant Redirect
// @namespace    https://github.com/RixsonvoidDev/custom-user-scripts/
// @version      1.0
// @description  Our time is precious. sub2unlock Likely task skip & instant link redirect FOR: sub2unlock.sbs, risub.com, sub2unlock.net, sub4unlock.com, sub2unlock.ai, sub2unlock.me, sub4unlock.pro (domains can be different). WARNING: Some Sites may redirect you to advertisement-websites so you maybe cant access it.
// @author       RixsonvoidDev
// @match        https://*/*
// @icon         none
// @grant        none
// @license MIT
// @run-at       document-start
// ==/UserScript==
/* This script is designed purely to save time by bypassing repetitive task walls (like sub2unlock) for convenience.
It does not generate, host, or endorse any malicious advertisements.
Some target platforms themselves inherently trigger third-party pop-ups or ad redirects as part of their native monetization—this script actually helps you avoid navigating through them manually.
Use at your own discretion! */
// Available: sub2unlock.sbs, risub.com, sub2unlock.net, sub4unlock.com, sub2unlock.ai, sub2unlock.me, sub4unlock.pro (domains can be different)

(function() {
    'use strict';

    const CONFIG = {
        AUTO_REDIRECT: true,
        AUTO_AUTO_REDIRECT_ALERT: true, // When Cannot Patch Buttons & AUTO_REDIRECT Disabled
        DEBUG_LOGS: false
    };


    function CLOG(MSG) {
        if (CONFIG.DEBUG_LOGS) console.log("InstaSLRedirector: "+MSG);
    }


    CLOG("New Session");

    function AUTO_AUTO_REDIRECT_ALERT(_link_or_btn, TYPE, MSG) {
        if (!CONFIG.AUTO_REDIRECT && CONFIG.AUTO_AUTO_REDIRECT_ALERT) alert("Short Link Task Skip Instant Link Redirect: "+ MSG);
        if (TYPE=="LINK") {
            window.open(_link_or_btn, "_self");
        }else if (TYPE=="BTN") {
            _link_or_btn.click();
        }
    };

    let HOST = window.location.host;

    const waitEl = (sel, ms = 2000) => new Promise(res => {
        const start = Date.now(), t = setInterval(() => {
            const el = document.querySelector(sel);
            if (el) {
                clearInterval(t); res(el);
            } else if (Date.now() - start > ms) {
                clearInterval(t); res(null);
            };
        }, 50);
    });

    const SCANNER = new MutationObserver((mutations) => {
        if (HOST=="website4sell.com") {   //sub2unlock.sbs
            CLOG("New website4sell.com Session");
            const FINALBTN = document.getElementById('verifyButton');
            if (FINALBTN) {
                FINALBTN.disabled = false;
                FINALBTN.classList.add('active');
                FINALBTN.innerHTML = '<i class="fas fa-lock-open" style="margin-right:8px;"></i> OPEN LINK <i class="fas fa-arrow-right" style="margin-left:8px;"></i>';

                if (CONFIG.AUTO_REDIRECT) {
                    SCANNER.disconnect();
                    setTimeout(() => {
                        FINALBTN.click();
                    }, 1000);
                }
            };

        } else if (HOST=="risub.com") {
            CLOG("New risub.com Session");

            setTimeout(() => {
                const _link = document.querySelector(".final-link.step.linky.buttonpanel.buttonpanel-block.btn-lg.get-link").href;
                AUTO_AUTO_REDIRECT_ALERT(_link,"LINK","Cannot Patch Buttons, Click 'OK' To Auto Redirect ("+_link+")");
            }, 200);


        } else if (HOST=="sub2unlock.net") {
            CLOG("New sub2unlock.net Session");

            $('.getlink').removeAttr("disabled");
            $('.getlink').attr('href', $('#theLinkID')[0].innerHTML);
            $(".locked-button i").removeClass("fa-lock");
            $(".locked-button i").addClass("fa-unlock");
            $(".locked-button").addClass("unlock");

            if (CONFIG.AUTO_REDIRECT) {
                const _link = $('#theLinkID')[0].innerHTML;
                CLOG("sub2unlock.net.AUTO_REDIRECT TO:" +_link);
                window.open(_link, "_self");
            }


        } else if (HOST=="blog.culturasdelperu.info" || HOST=="unlock.culturasdelperu.info") {
            CLOG("New culturasdelperu.info Session");

            const originalOpen = window.open;
            window.open = function(url, target) {
                console.log("Blocked:", url);
                return { focus: () => {}, closed: true };
            };
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.click();
                }, 150);
            });
            const unlockBtn = document.getElementById('unlockBtn');
            if (unlockBtn && !unlockBtn.disabled) {
                window.open = originalOpen;
                AUTO_AUTO_REDIRECT_ALERT(unlockBtn,"BTN","Site Already Skips When Completed, 'OK' to Redirect");
                SCANNER.disconnect();
            }


        } else if (HOST == "sub4unlock.com") {
            CLOG("New sub4unlock.com Session");

            let TEMPURL = window.location.href;

            setTimeout(() => {
                try {
                    if (typeof fun_unlock_file === "function") {
                        fun_unlock_file();
                    } else if (typeof window.fun_unlock_file === "function") {
                        window.fun_unlock_file();
                    }
                } catch (error) {
                    CLOG("error",error);
                }

            }, 500);

            if (CONFIG.AUTO_REDIRECT) {
                CLOG("sub4unlock.com.AUTO_REDIRECT");
                
                window.open = (url) => { window.location.href = url; };
                
                setTimeout(() => {
                    if (window.file) {
                        file.click();
                    }
                    else {
                        let fileBtn2 = document.getElementById("file");
                        if (fileBtn2) fileBtn2.click();
                    }
                }, 250);
                
                setTimeout(() => {
                    if (window.location.href == TEMPURL) {
                        try {
                            setTimeout(() => {
                                if (typeof fileunlock === "function") {
                                    window.fileunlock();
                                SCANNER.disconnect();
                            } else if (typeof window.fileunlock === "function") {
                                window.fileunlock();
                                SCANNER.disconnect();
                            } else {
                                window.file.click();
                                SCANNER.disconnect();
                            }
                        }, 1000);

                    } catch (error) {
                        
                    }
                    
                }
            }, 600);
            
            }

        } else if (HOST=="sub4unlock.pro") {
            CLOG("New sub4unlock.pro Session");
            let TEMPURL = window.location.href;
            
            setTimeout(() => {
                try {
                    if (typeof fun_unlock_file === "function") {
                        fun_unlock_file();
                    } else if (typeof window.fun_unlock_file === "function") {
                        window.fun_unlock_file();
                    }
                } catch (error) {
                    CLOG("error",error);
                }
                
            }, 500);

            if (CONFIG.AUTO_REDIRECT) {
                CLOG("sub4unlock.pro.AUTO_REDIRECT");
                
                
                window.open = (url) => { window.location.href = url; };
                
                setTimeout(() => {
                    if (window.file) {
                        file.click();
                    }
                    else {
                        let fileBtn2 = document.getElementById("file");
                        if (fileBtn2) fileBtn2.click();
                    }
                }, 250);
                
                setTimeout(() => {
                    if (window.location.href == TEMPURL) {
                        try {
                            setTimeout(() => {
                                if (typeof fileunlock === "function") {
                                window.fileunlock();
                                SCANNER.disconnect();
                            } else if (typeof window.fileunlock === "function") {
                                window.fileunlock();
                                SCANNER.disconnect();
                            } else {
                                window.file.click();
                                SCANNER.disconnect();
                            }
                        }, 1000);
                        
                    } catch (error) {
                        
                    }
                    
                }
            }, 600);
            
        }
        
        
    } else if (HOST=="sub2unlock.ai") {
        CLOG("New sub2unlock.ai Session");
        
        let TEMPURL = window.location.href;
        
        setTimeout(() => {
            fun_unlock_file();
        }, 500);
        
        if (CONFIG.AUTO_REDIRECT) {
            setTimeout(() => {
                document.getElementById("file").click();
            }, 250);
            
            setTimeout(() => {
                if (window.location.href == TEMPURL){
                    setTimeout(() => {
                        fileunlock();
                    }, 2000);
                };
                }, 1000);
            };
            
            
        } else if (HOST=="sub2unlock.io") {
            CLOG("New sub2unlock.io Session");
            
            let TEMPURL = window.location.href;
            
            waitEl(".linky.buttonpanel.buttonpanel-block.btn-lg.get-link.disabled", 1000).then(el => {
                if (el) {
                    const btn =document.querySelector(".linky.buttonpanel.buttonpanel-block.btn-lg.get-link.disabled");
                    btn.classList.remove("disabled");
                    if (CONFIG.AUTO_REDIRECT) {
                        btn.click();
                        
                        setTimeout(() => {
                            if (TEMPURL==window.location.href){
                                window.location.href = btn.href;
                                SCANNER.disconnect();
                            }
                        }, 1200);
                        
                    }
                } else {
                    if (CONFIG.AUTO_REDIRECT) {
                        CLOG("sub2unlock.io.AUTO_REDIRECT");
                        
                        btn.click();
                        setTimeout(() => {
                            if (TEMPURL==window.location.href){
                                window.location.href = btn.href;
                                SCANNER.disconnect();
                            }
                        }, 1200);
                    } else {
                        const LINKa = document.querySelector(".linky.buttonpanel.buttonpanel-block.btn-lg.get-link");
                        AUTO_AUTO_REDIRECT_ALERT(LINKa.href,"LINK","Cannot Find Buttons click \"OK\" To Redirect Auto");
                        SCANNER.disconnect();
                    }
                }
            });

        } else if (HOST=="sub2unlock.me") {
            CLOG("New sub2unlock.me Session");
            
            setTimeout(() => {
                const btn = document.querySelectorAll(".btn.btn-primary");
                btn.forEach(el => {
                    if (el.id=="file") {
                        el.disabled = false;
                        el.textContent = "CLICK TO OPEN LINK";
                    }
                    
                });
                
                if (CONFIG.AUTO_REDIRECT) {
                    CLOG("sub2unlock.me.AUTO_REDIRECT");

                    btn.forEach(el => {
                        if (el.id=="file") {
                            el.click();
                        }
                    });
                }
                SCANNER.disconnect();

            }, 600);


        }

    });

    SCANNER.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})();
