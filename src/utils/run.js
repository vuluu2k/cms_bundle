'use strict';
const ivm = require('isolated-vm');
const { createIsolate } = require('./sandbox');
const fs = require('fs').promises;
const { BadRequestError } = require('../core/error.response');

const isDev = process.env.NODE_ENV === 'development';
const EXECUTION_TIMEOUT = 30000; // 30 seconds

async function runUserFunction(
  site_id,
  file_id,
  functionName,
  params,
  isDebug = false
) {
  // Validate and sanitize functionName to prevent injection
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName)) {
    throw new BadRequestError('Invalid function name');
  }

  const { isolate, context, jail } = await createIsolate();
  let bundledScript = null;
  let callScript = null;

  try {
    const logs = [];

    // Set up global environment
    jail.setSync('global', jail.derefInto());

    // Inject all required APIs
    await injectGlobalFunctions(isolate, context, jail);
    await injectURLSearchParams(isolate, context);
    await injectConsole(isolate, context, logs, isDebug);
    await injectFetch(isolate, context);

    // Read bundled code asynchronously
    const bundledCode = await fs.readFile(
      `bundle/${site_id}/${file_id}.js`,
      'utf8'
    );

    // Compile bundled code for better performance and security
    bundledScript = await isolate.compileScript(bundledCode);
    await bundledScript.run(context, { timeout: EXECUTION_TIMEOUT });

    // Safely construct the function call script
    const paramsJson = JSON.stringify(params);
    callScript = await isolate.compileScript(`
      (async () => {
        if (typeof MyModule === 'undefined' || typeof MyModule.${functionName} !== 'function') {
          throw new Error('Function ${functionName} not found in MyModule');
        }
        const params = ${paramsJson};
        const result = await MyModule.${functionName}({ params });
        return JSON.stringify(result);
      })()
    `);

    // Execute with timeout
    const result = await Promise.race([
      callScript.run(context, { promise: true, timeout: EXECUTION_TIMEOUT }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Execution timeout')),
          EXECUTION_TIMEOUT
        )
      ),
    ]);

    return { result: JSON.parse(result), logs };
  } catch (err) {
    const errorMessage = err.message || 'Unknown error';
    throw new BadRequestError(`Execution failed: ${errorMessage}`);
  } finally {
    context.release();

    if (bundledScript) {
      bundledScript.release();
    }

    if (callScript) {
      callScript.release();
    }
  }
}

async function injectGlobalFunctions(isolate, context, jail) {
  // Create references for URI encoding/decoding functions
  const encodeURIComponentRef = new ivm.Reference((str) =>
    encodeURIComponent(str)
  );
  const decodeURIComponentRef = new ivm.Reference((str) =>
    decodeURIComponent(str)
  );
  const encodeURIRef = new ivm.Reference((str) => encodeURI(str));
  const decodeURIRef = new ivm.Reference((str) => decodeURI(str));

  // Set references in jail
  jail.setSync('_encodeURIComponent', encodeURIComponentRef);
  jail.setSync('_decodeURIComponent', decodeURIComponentRef);
  jail.setSync('_encodeURI', encodeURIRef);
  jail.setSync('_decodeURI', decodeURIRef);

  // Compile and inject wrapper functions for better performance
  const wrapperScript = await isolate.compileScript(`
    global.encodeURIComponent = function(str) {
      return _encodeURIComponent.apply(undefined, [str], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
    global.decodeURIComponent = function(str) {
      return _decodeURIComponent.apply(undefined, [str], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
    global.encodeURI = function(str) {
      return _encodeURI.apply(undefined, [str], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
    global.decodeURI = function(str) {
      return _decodeURI.apply(undefined, [str], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
  `);

  try {
    await wrapperScript.run(context);
  } finally {
    // Release script after use to free memory
    wrapperScript.release();
  }
}

async function injectURLSearchParams(isolate, context) {
  const jail = context.global;

  // Create a wrapper function that calls URLSearchParams with 'new'
  const urlSearchParamsFactory = (init) => {
    return new URLSearchParams(init);
  };

  jail.setSync('_URLSearchParams', new ivm.Reference(urlSearchParamsFactory));

  const urlSearchParamsScript = await isolate.compileScript(`
    global.URLSearchParams = function(init) {
      return _URLSearchParams.apply(undefined, [init], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
  `);

  try {
    await urlSearchParamsScript.run(context);
  } finally {
    urlSearchParamsScript.release();
  }
}

async function injectConsole(isolate, context, logs, isDebug = false) {
  const jail = context.global;

  // Create console method references
  const logRef = new ivm.Reference((...args) => {
    if (isDev) console.log(...args);
    if (isDebug) logs.push({ type: 'log', args: Array.from(args) });
  });

  const warnRef = new ivm.Reference((...args) => {
    if (isDev) console.warn(...args);
    if (isDebug) logs.push({ type: 'warn', args: Array.from(args) });
  });

  const errorRef = new ivm.Reference((...args) => {
    if (isDev) console.error(...args);
    if (isDebug) logs.push({ type: 'error', args: Array.from(args) });
  });

  // Set references in jail
  jail.setSync('_consoleLog', logRef);
  jail.setSync('_consoleWarn', warnRef);
  jail.setSync('_consoleError', errorRef);

  // Compile and inject console wrapper functions
  const consoleScript = await isolate.compileScript(`
    global.console = {
      log: function(...args) {
        return _consoleLog.apply(undefined, args, {
          arguments: { copy: true },
          result: { copy: true }
        });
      },
      warn: function(...args) {
        return _consoleWarn.apply(undefined, args, {
          arguments: { copy: true },
          result: { copy: true }
        });
      },
      error: function(...args) {
        return _consoleError.apply(undefined, args, {
          arguments: { copy: true },
          result: { copy: true }
        });
      }
    };
  `);

  try {
    await consoleScript.run(context);
  } finally {
    consoleScript.release();
  }
}

async function injectFetch(isolate, context) {
  const jail = context.global;

  const fetchImpl = async (url, options) => {
    try {
      const opts = options || {};
      const res = await fetch(url, opts);
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        body: text,
        headers: Object.fromEntries(res.headers.entries()),
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  jail.setSync('_fetch', new ivm.Reference(fetchImpl));

  const fetchScript = await isolate.compileScript(`
    global.fetch = async function(url, opt) {
      const o = opt || {};
      const json = await _fetch.apply(undefined, [url, o], {
        arguments: { copy: true },
        result: { promise: true, copy: true }
      });

      return {
        ok: json.ok,
        status: json.status,
        headers: new Map(Object.entries(json.headers || {})),
        text: async () => json.body,
        json: async () => {
          try {
            return JSON.parse(json.body);
          } catch (e) {
            throw new Error('Invalid JSON response: ' + e.message);
          }
        },
      };
    };
  `);

  try {
    await fetchScript.run(context);
  } finally {
    fetchScript.release();
  }
}

module.exports = { runUserFunction };
