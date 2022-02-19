{
// https://github.com/LazyDuke/ajax-proxy/blob/master/src/index.ts
class AjaxProxy{constructor(){this.proxyAjax=t=>{if(null==t)throw new TypeError("proxyMap can not be undefined or null");this.RealXMLHttpRequest=this.RealXMLHttpRequest||window.XMLHttpRequest,this.realXMLHttpRequest=this.realXMLHttpRequest||new window.XMLHttpRequest;const e=this,r=new Proxy(this.RealXMLHttpRequest,{construct(r){const n=new r;return new Proxy(n,{get(r,n,o){let s="";try{s=typeof e.realXMLHttpRequest[n]}catch(t){return console.error(t),r[n]}if("function"!==s){const s=e.hasOwnProperty(`_${n.toString()}`)?e[`_${n.toString()}`]:r[n],i=(t[n]||{}).getter;return"function"==typeof i&&i.call(r,s,o)||s}return(...e)=>{let s=e;if(t[n]){const i=t[n].call(r,e,o);if(!0===i)return;i&&(s="function"==typeof i?i.call(r,...e):i)}return r[n].call(r,...s)}},set(r,n,o,s){let i="";try{i=typeof e.realXMLHttpRequest[n]}catch(t){console.error(t)}if("function"===i)throw new Error(`${n.toString()} in XMLHttpRequest can not be reseted`);if("function"==typeof t[n])r[n]=()=>{t[n].call(r,s)||o.call(s)};else{const i=(t[n]||{}).setter;try{r[n]="function"==typeof i&&i.call(r,o,s)||("function"==typeof o?o.bind(s):o)}catch(t){if(!0!==i)throw t;e[`_${n.toString()}`]=o}}return!0}})}});return window.XMLHttpRequest=r,this.RealXMLHttpRequest},this.unProxyAjax=()=>{this.RealXMLHttpRequest&&(window.XMLHttpRequest=this.RealXMLHttpRequest),this.RealXMLHttpRequest=void 0}}}

window.webinfoAjaxProxy = new AjaxProxy;

class customInfo {
    headers = [];
    data = [];
    method = '';
    path = '';
    url = document.location.href;
  }
  
  function setInfo(xhr, type, data) {
    if (!xhr.customInfo) {
      xhr.notice = false;
      xhr.customInfo = new customInfo();
    }
    switch (type) {
      case 'open':
        xhr.customInfo.method = data[0];
        xhr.customInfo.path = data[1];
        break;
      case 'send':
        xhr.customInfo.data = data;
        break;
      case 'setRequestHeader':
        xhr.customInfo.headers.push(data);
        break;
      default:
    }
  }
  
  const inject_doProxy = () => {
    webinfoAjaxProxy.proxyAjax({
      open: function(args, xhr) {
        setInfo(xhr, 'open', args);
      },
      onreadystatechange: function (xhr) {
        if (xhr.readyState === 4) {
          console.log(xhr.customInfo);
          // console.log(xhr.responseText);
        }
      },
      responseText: {
        getter: function (val) {
          if (!this.notice) {
            const message = { type: 'notice', data: this.customInfo, from: 'inject', to: 'content-script' };
            const event = new CustomEvent('ResponseModifyMessage', {detail:message});
            window.dispatchEvent(event);
            this.notice = true;
          }
    
          // TODO 这里更新responseText
          return val;
        },
        setter: function (val) {
          console.log('setter', val);
        }
      },
      setRequestHeader: function (args, xhr) {
        setInfo(xhr, 'setRequestHeader', args);
      },
      send: function (args, xhr) {
        setInfo(xhr, 'send', args);
      }
    });
  }
  
  const inject_undoProxy = () => {
    webinfoAjaxProxy.unProxyAjax();
  }
  
// 开始代理
window.webinfoDoProxy = inject_doProxy;
// 取消代理
window.webinfoUndoProxy = inject_undoProxy;
// 设置替换规则
window.webinfoSetRules = (rules) => {
  webinfoAjaxProxy.rules = rules;
}

  window.addEventListener('ResponseModifyMessage', msg => {
  const message = msg.detail;
  if (!message.type) {
    return;
  }
  if (message.from !== 'content-script' || message.to !== 'inject') {
    return;
  }
  switch (message.type) {
    case 'setRules':
      // window.console.log('setrules', message.data);
      webinfoSetRules(message.data);
      break;
    case 'enableProxy':
      // window.console.log('enableProxy');
      webinfoDoProxy();
      break;
    case 'disableProxy':
      webinfoUndoProxy();
      break;
    default:
  }
});

// 通知content-script inject.js 已经加载就绪，可以接受命令
const message = { type: 'injectReady', data: null, from: 'inject', to: 'content-script' };
const event = new CustomEvent('ResponseModifyMessage', { detail: message });
window.dispatchEvent(event);

}