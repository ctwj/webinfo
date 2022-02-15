/**
 * 网络请求Hooker
 */


import { HookerConfig, ReplaceRules } from './type';

/**
 * ajax hooker
 */
export class RequestHooker {
    private config: HookerConfig;
    private rules: ReplaceRules[];
    
    
    private responseURL = '';
    // private responseText = '';
    // private response = '';

    private originalXHR = window.XMLHttpRequest;
    private myXHR = () => {
        let pageScriptEventDispatched = false;
        const modifyResponse = () => {
            window.console.log('modify xhr', this.responseURL);
            this.rules.forEach(({filterType, switchOn, overrideText, match}) => {
                if (!switchOn) {
                    return;
                }
                let matched = filterType === 'normal' ?
                    this.responseURL.indexOf(match) > -1 :
                    this.responseURL.match(new RegExp(match, 'i'));
                if (!matched) {
                    return;
                }
                // @ts-ignore
                this.responseText = overrideText;
                // @ts-ignore
                this.response = overrideText;
            })
        }
        const xhr = this.originalXHR;
        const config = this.config;
        for(let attr in xhr) {
            if (attr === 'onreadystatechange') {
                // @ts-ignore
                xhr.onreadystatechange  = (...args) => {
                    // @ts-ignore
                    if (this.readyState == xhr.DONE) {
                        if (config.isHooked) {
                            modifyResponse();
                        }
                    }
                    
                }
                continue;
            }
            if (attr === 'onload') {
                // @ts-ignore
                xhr.onload = (...args) => {
                    // 请求成功
                    if (config.isHooked) {
                        modifyResponse();
                    }
                    // @ts-ignore
                    this.onload && this.onload.apply(this, args);
                  }
                  continue;
            }

            // @ts-ignore
            if (typeof xhr[attr] === 'function') {
                // @ts-ignore
                this[attr] = xhr[attr].bind(xhr);
            } else {
                // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
                if (attr === 'responseText' || attr === 'response') {
                    Object.defineProperty(this, attr, {
                        // @ts-ignore
                        get: () => this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
                        // @ts-ignore
                        set: (val) => this[`_${attr}`] = val,
                        enumerable: true
                    });
                } else {
                    Object.defineProperty(this, attr, {
                        // @ts-ignore
                        get: () => xhr[attr],
                        // @ts-ignore
                        set: (val) => xhr[attr] = val,
                        enumerable: true
                    });
                }
            }
        }
    }

    private originalFetch = window.fetch.bind(window);

    // @ts-ignore
    private myFetch = (...args) => {
        // @ts-ignore
        return this.originalFetch(...args).then(response => {
            window.console.log('modify fetch', this.responseURL);
            let text = '';
            this.rules.forEach(({filterType, switchOn, overrideText, match}) => {
                if (!switchOn) {
                    return;
                }
                let matched = filterType === 'normal' ?
                    response.url.indexOf(match) > -1 :
                    response.url.match(new RegExp(match, 'i'));
                if (!matched) {
                    return;
                }
                text = overrideText;
            });
            if (text) {
                const stream = new ReadableStream({
                    start( controller ) {
                        // const bufView = new Uint8Array(new ArrayBuffer(txt.length));
                        // for (var i = 0; i < txt.length; i++) {
                        //   bufView[i] = txt.charCodeAt(i);
                        // }
                        controller.enqueue(new TextEncoder().encode(text));
                        controller.close();
                    }
                });
                const newResponse = new Response(stream, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                });
                const proxy = new Proxy(newResponse, {
                    get: function(target, name){
                        switch(name) {
                          case 'ok':
                          case 'redirected':
                          case 'type':
                          case 'url':
                          case 'useFinalURL':
                          case 'body':
                          case 'bodyUsed':
                            console.log(name);
                            // @ts-ignore
                            return response[name];
                        }
                        // @ts-ignore
                        return target[name];
                    }
                });

                for (let key in proxy) {
                    // @ts-ignore
                    if (typeof proxy[key] === 'function') {
                        // @ts-ignore
                        proxy[key] = proxy[key].bind(newResponse);
                      }
                }

                return proxy;
            } else {
                return response;
            }

            
        });
    }

    constructor (config: HookerConfig, rules:ReplaceRules[]) {
        this.config = config;
        this.rules = rules;
    }

    /**
     * hooker api
     */
    public hooker() {
        this.config.isHooked = true;
        // @ts-ignore
        window.XMLHttpRequest =this.myXHR;
        window.fetch = this.myFetch;
    }

    /**
     * unhooker api
     */
    public unhooker () {
        this.config.isHooked = false;
        window.XMLHttpRequest = this.originalXHR;
        window.fetch = this.originalFetch;
    }

}