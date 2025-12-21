// Polyfills for older browser support

// localStorage polyfill for very old browsers
if (typeof Storage === 'undefined') {
  (function() {
    const Storage = function() {
      this.data = {};
    };
    Storage.prototype.getItem = function(key) {
      return this.data[key] || null;
    };
    Storage.prototype.setItem = function(key, value) {
      this.data[key] = value;
    };
    Storage.prototype.removeItem = function(key) {
      delete this.data[key];
    };
    Storage.prototype.clear = function() {
      this.data = {};
    };
    window.localStorage = new Storage();
    window.sessionStorage = new Storage();
  })();
}

// Promise polyfill for IE11
if (typeof Promise === 'undefined') {
  // Load promise polyfill from CDN if needed
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js';
  document.head.appendChild(script);
}

// Array.includes polyfill for IE11
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    const o = Object(this);
    const len = parseInt(o.length) || 0;
    if (len === 0) {
      return false;
    }
    const n = parseInt(fromIndex) || 0;
    let k = n >= 0 ? n : Math.max(len + n, 0);
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    while (k < len) {
      if (sameValueZero(o[k], searchElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

// String.includes polyfill for IE11
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// String.startsWith polyfill for IE11
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// String.endsWith polyfill for IE11
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, length) {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };
}

// Object.assign polyfill for IE11
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (let index = 1; index < arguments.length; index++) {
      const nextSource = arguments[index];
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Array.from polyfill for IE11
if (!Array.from) {
  Array.from = function(arrayLike, mapFn, thisArg) {
    const C = this;
    const items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    const mapFunction = mapFn ? function(value, index) {
      return mapFn.call(thisArg, value, index);
    } : undefined;
    let k = 0;
    const len = parseInt(items.length) || 0;
    const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
    while (k < len) {
      const kValue = items[k];
      if (mapFunction) {
        A[k] = mapFunction(kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = len;
    return A;
  };
}

// Fetch API polyfill for older browsers
if (typeof fetch === 'undefined') {
  window.fetch = function(url, options) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open(options?.method || 'GET', url);
      
      if (options?.headers) {
        Object.keys(options.headers).forEach(function(key) {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = function() {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          json: function() {
            return Promise.resolve(JSON.parse(xhr.responseText));
          },
          text: function() {
            return Promise.resolve(xhr.responseText);
          }
        };
        resolve(response);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network request failed'));
      };
      
      xhr.send(options?.body);
    });
  };
}

// Console methods fallback for very old browsers
if (typeof console === 'undefined') {
  window.console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {}
  };
}

// requestAnimationFrame polyfill
if (!window.requestAnimationFrame) {
  let lastTime = 0;
  window.requestAnimationFrame = function(callback) {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - lastTime));
    const id = window.setTimeout(function() {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

