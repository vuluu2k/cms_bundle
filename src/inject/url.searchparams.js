async function injectURLSearchParams(isolate, context) {
  const urlSearchParamsScript = await isolate.compileScript(`
      // Custom URLSearchParams class implementation
      global.URLSearchParams = class URLSearchParams {
        constructor(init) {
          this._params = new Map();
          
          if (init === null || init === undefined) {
            // Empty params
            return;
          }
          
          // Check for Promise - URLSearchParams constructor is synchronous
          if (init && typeof init === 'object' && typeof init.then === 'function') {
            throw new TypeError('URLSearchParams constructor does not accept Promise. Please await the Promise first.');
          }
          
          // Handle string (e.g., "key=value&key2=value2")
          if (typeof init === 'string') {
            if (init.startsWith('?')) {
              init = init.substring(1);
            }
            const pairs = init.split('&');
            for (const pair of pairs) {
              if (pair) {
                const [key, value = ''] = pair.split('=');
                const decodedKey = decodeURIComponent(key);
                const decodedValue = decodeURIComponent(value);
                if (this._params.has(decodedKey)) {
                  // Append to existing
                  const existing = this._params.get(decodedKey);
                  if (Array.isArray(existing)) {
                    existing.push(decodedValue);
                  } else {
                    this._params.set(decodedKey, [existing, decodedValue]);
                  }
                } else {
                  this._params.set(decodedKey, decodedValue);
                }
              }
            }
            return;
          }
          
          // Handle array of [key, value] pairs
          if (Array.isArray(init)) {
            for (const [key, value] of init) {
              // Check for Promise in array values - check before converting to string
              const valueIsPromise = value && (
                typeof value.then === 'function' ||
                (value.constructor && value.constructor.name === 'Promise') ||
                (value instanceof Promise)
              );
              const keyIsPromise = key && typeof key === 'object' && (
                typeof key.then === 'function' ||
                (key.constructor && key.constructor.name === 'Promise') ||
                (key instanceof Promise)
              );
              
              if (valueIsPromise) {
                console.error('URLSearchParams: Detected Promise in array value:', { key, value });
                throw new TypeError('URLSearchParams constructor does not accept Promise in array values. Please await the Promise first.');
              }
              if (keyIsPromise) {
                console.error('URLSearchParams: Detected Promise in array key:', { key, value });
                throw new TypeError('URLSearchParams constructor does not accept Promise in array keys. Please await the Promise first.');
              }
              
              // Don't convert to string here - let append() handle it
              this.append(key, value);
            }
            return;
          }
          
          // Handle object/Map
          if (typeof init === 'object') {
            // Handle iterable (Map, etc.)
            if (init[Symbol.iterator]) {
              for (const [key, value] of init) {
                // Check for Promise in iterable values - check before converting to string
                const valueIsPromise = value && (
                  typeof value.then === 'function' ||
                  (value.constructor && value.constructor.name === 'Promise') ||
                  (value instanceof Promise)
                );
                const keyIsPromise = key && typeof key === 'object' && (
                  typeof key.then === 'function' ||
                  (key.constructor && key.constructor.name === 'Promise') ||
                  (key instanceof Promise)
                );
                
                if (valueIsPromise) {
                  console.error('URLSearchParams: Detected Promise in iterable value:', { key, value });
                  throw new TypeError('URLSearchParams constructor does not accept Promise in iterable values. Please await the Promise first.');
                }
                if (keyIsPromise) {
                  console.error('URLSearchParams: Detected Promise in iterable key:', { key, value });
                  throw new TypeError('URLSearchParams constructor does not accept Promise in iterable keys. Please await the Promise first.');
                }
                
                // Don't convert to string here - let append() handle it
                this.append(key, value);
              }
              return;
            }
            
            // Handle plain object
            for (const key in init) {
              if (init.hasOwnProperty(key)) {
                const value = init[key];
                // Check for Promise in object values - multiple ways to detect Promise
                const isPromise = value && (
                  typeof value.then === 'function' ||
                  (value.constructor && value.constructor.name === 'Promise') ||
                  (value instanceof Promise)
                );
                
                if (isPromise) {
                  console.error('URLSearchParams: Detected Promise in object value:', { key, value });
                  throw new TypeError('URLSearchParams constructor does not accept Promise in object values (key: "' + key + '"). Please await the Promise first.');
                }
                
                // Also check if key is a Promise
                const keyIsPromise = key && typeof key === 'object' && typeof key.then === 'function';
                if (keyIsPromise) {
                  console.error('URLSearchParams: Detected Promise as key:', { key, value });
                  throw new TypeError('URLSearchParams constructor does not accept Promise as key. Please await the Promise first.');
                }
                
                // Don't convert to string here - let append() handle it after checking Promise
                this.append(key, value);
              }
            }
            return;
          }
        }
        
        append(name, value) {
          // Check for Promise - multiple ways to detect
          const valueIsPromise = value && (
            typeof value.then === 'function' ||
            (value.constructor && value.constructor.name === 'Promise') ||
            (value instanceof Promise)
          );
          
          const nameIsPromise = name && typeof name === 'object' && (
            typeof name.then === 'function' ||
            (name.constructor && name.constructor.name === 'Promise') ||
            (name instanceof Promise)
          );
          
          if (valueIsPromise) {
            console.error('URLSearchParams.append(): Detected Promise as value:', { name, value });
            throw new TypeError('URLSearchParams.append() does not accept Promise as value. Please await the Promise first.');
          }
          if (nameIsPromise) {
            console.error('URLSearchParams.append(): Detected Promise as name:', { name, value });
            throw new TypeError('URLSearchParams.append() does not accept Promise as name. Please await the Promise first.');
          }
          
          const key = String(name);
          const val = String(value);
          if (this._params.has(key)) {
            const existing = this._params.get(key);
            if (Array.isArray(existing)) {
              existing.push(val);
            } else {
              this._params.set(key, [existing, val]);
            }
          } else {
            this._params.set(key, val);
          }
        }
        
        delete(name) {
          this._params.delete(String(name));
        }
        
        get(name) {
          const value = this._params.get(String(name));
          if (Array.isArray(value)) {
            return value[0];
          }
          return value !== undefined ? value : null;
        }
        
        getAll(name) {
          const value = this._params.get(String(name));
          if (value === undefined) {
            return [];
          }
          return Array.isArray(value) ? value : [value];
        }
        
        has(name) {
          return this._params.has(String(name));
        }
        
        set(name, value) {
          // Check for Promise - multiple ways to detect
          const valueIsPromise = value && (
            typeof value.then === 'function' ||
            (value.constructor && value.constructor.name === 'Promise') ||
            (value instanceof Promise)
          );
          
          const nameIsPromise = name && typeof name === 'object' && (
            typeof name.then === 'function' ||
            (name.constructor && name.constructor.name === 'Promise') ||
            (name instanceof Promise)
          );
          
          if (valueIsPromise) {
            console.error('URLSearchParams.set(): Detected Promise as value:', { name, value });
            throw new TypeError('URLSearchParams.set() does not accept Promise as value. Please await the Promise first.');
          }
          if (nameIsPromise) {
            console.error('URLSearchParams.set(): Detected Promise as name:', { name, value });
            throw new TypeError('URLSearchParams.set() does not accept Promise as name. Please await the Promise first.');
          }
          
          this._params.set(String(name), String(value));
        }
        
        sort() {
          const sorted = new Map([...this._params.entries()].sort());
          this._params = sorted;
        }
        
        toString() {
          const pairs = [];
          for (const [key, value] of this._params.entries()) {
            // Check for Promise in key or value
            if (key && typeof key === 'object' && typeof key.then === 'function') {
              console.warn('URLSearchParams.toString() found Promise in key, this should not happen. Please await Promise before adding to URLSearchParams.');
              continue; // Skip this entry
            }
            
            const encodedKey = encodeURIComponent(String(key));
            
            if (Array.isArray(value)) {
              for (const val of value) {
                // Check for Promise in array value
                if (val && typeof val === 'object' && typeof val.then === 'function') {
                  console.warn('URLSearchParams.toString() found Promise in value, this should not happen. Please await Promise before adding to URLSearchParams.');
                  continue; // Skip this value
                }
                pairs.push(encodedKey + '=' + encodeURIComponent(String(val)));
              }
            } else {
              // Check for Promise in value
              if (value && typeof value === 'object' && typeof value.then === 'function') {
                console.warn('URLSearchParams.toString() found Promise in value, this should not happen. Please await Promise before adding to URLSearchParams.');
                continue; // Skip this entry
              }
              pairs.push(encodedKey + '=' + encodeURIComponent(String(value)));
            }
          }
          return pairs.join('&');
        }
        
        *keys() {
          for (const key of this._params.keys()) {
            yield key;
          }
        }
        
        *values() {
          for (const value of this._params.values()) {
            if (Array.isArray(value)) {
              for (const val of value) {
                yield val;
              }
            } else {
              yield value;
            }
          }
        }
        
        *entries() {
          for (const [key, value] of this._params.entries()) {
            if (Array.isArray(value)) {
              for (const val of value) {
                yield [key, val];
              }
            } else {
              yield [key, value];
            }
          }
        }
        
        [Symbol.iterator]() {
          return this.entries();
        }
        
        forEach(callback, thisArg) {
          for (const [key, value] of this.entries()) {
            callback.call(thisArg, value, key, this);
          }
        }
      };
    `);

  try {
    await urlSearchParamsScript.run(context);
  } finally {
    urlSearchParamsScript.release();
  }
}

module.exports = { injectURLSearchParams };
