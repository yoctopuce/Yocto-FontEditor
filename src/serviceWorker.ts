/// <reference lib="webworker" />

/*
*   Yocto-FontEditor, a free web-based application
*   to create .yfm font files for Yoctopuce displays
*
*  Service worker thread to allow offline loading,
*  (makes codding/testing cycles  much easier and faster)
*
*   - - - - - - - - - License information: - - - - - - - - -
*
*  Copyright (C) 2026 and beyond by Yoctopuce Sarl, Switzerland.
*
*  Yoctopuce Sarl (hereafter Licensor) grants to you a perpetual
*  non-exclusive license to use, modify, copy and integrate this
*  file into your software for the sole purpose of interfacing
*  with Yoctopuce products.
*
*  You may reproduce and distribute copies of this file in
*  source or object form, as long as the sole purpose of this
*  code is to interface with Yoctopuce products. You must retain
*  this notice in the distributed source file.
*
*  You should refer to Yoctopuce General Terms and Conditions
*  for additional information regarding your rights and
*  obligations.
*
*  THE SOFTWARE AND DOCUMENTATION ARE PROVIDED "AS IS" WITHOUT
*  WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
*  WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, FITNESS
*  FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO
*  EVENT SHALL LICENSOR BE LIABLE FOR ANY INCIDENTAL, SPECIAL,
*  INDIRECT OR CONSEQUENTIAL DAMAGES, LOST PROFITS OR LOST DATA,
*  COST OF PROCUREMENT OF SUBSTITUTE GOODS, TECHNOLOGY OR
*  SERVICES, ANY CLAIMS BY THIRD PARTIES (INCLUDING BUT NOT
*  LIMITED TO ANY DEFENSE THEREOF), ANY CLAIMS FOR INDEMNITY OR
*  CONTRIBUTION, OR OTHER SIMILAR COSTS, WHETHER ASSERTED ON THE
*  BASIS OF CONTRACT, TORT (INCLUDING NEGLIGENCE), BREACH OF
*  WARRANTY, OR OTHERWISE.
*/



import { Const } from "./constants.js";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil((async () => {
        const cache: Cache = await caches.open(Const.appName);
        await cache.addAll([
            './app.html',
            './app.min.js',
            './yocto.svg'
        ]);
    })());
});

self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith((async () => {
        const cache = await caches.open(Const.appName);
        // Gets the resource from the cache.
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
            return cachedResponse;
        } else {
            try {
                // If the resource was not in the cache, tries the network.
                const fetchResponse = await fetch(event.request);
                // Saves the resource in the cache and return it.
                await cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
            } catch (e) {
                return new Response('Network error', { status: 408 });
            }
        }
    })());
});
