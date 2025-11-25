'use strict';
const ivm = require('isolated-vm');
const { createIsolate } = require('./sandbox');
const fs = require('fs');
const { BadRequestError } = require('../core/error.response');

const isDev = process.env.NODE_ENV === 'development';

async function runUserFunction(
  site_id,
  file_id,
  functionName,
  params,
  isDebug = false
) {
  const { isolate, context, jail } = await createIsolate();
  try {
    // set a global vm for isolated-vm
    const logs = [];
    jail.setSync('global', jail.derefInto());
    await injectGlobalFunctions(context, jail);
    await injectURLSearchParams(context);
    await injectConsole(context, logs, isDebug);
    await injectFetch(context);

    const bundledCode = fs.readFileSync(
      `bundle/${site_id}/${file_id}.js`,
      'utf8'
    );

    await context.eval(bundledCode);

    const testScript = await isolate.compileScript(`
      (async () => {
        const result = await MyModule.${functionName}({ params: ${JSON.stringify(params)} });
        return JSON.stringify(result);
      })()
    `);

    const result = await testScript.run(context, { promise: true });
    return { result: JSON.parse(result), logs };
  } catch (err) {
    throw new BadRequestError(`Execution failed: ${err.message}`);
  } finally {
    isolate.dispose();
  }
}

async function injectGlobalFunctions(context, jail) {
  const encodeURIComponentRef = new ivm.Reference((str) => {
    return encodeURIComponent(str);
  });
  const decodeURIComponentRef = new ivm.Reference((str) => {
    return decodeURIComponent(str);
  });
  const encodeURIRef = new ivm.Reference((str) => {
    return encodeURI(str);
  });
  const decodeURIRef = new ivm.Reference((str) => {
    return decodeURI(str);
  });

  jail.setSync('_encodeURIComponent', encodeURIComponentRef);
  jail.setSync('_decodeURIComponent', decodeURIComponentRef);
  jail.setSync('_encodeURI', encodeURIRef);
  jail.setSync('_decodeURI', decodeURIRef);

  // Wrap them to work as functions in the isolate
  await context.eval(`
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
}

async function injectURLSearchParams(context) {
  const jail = context.global;
  jail.setSync('_URLSearchParams', new ivm.Reference(URLSearchParams));

  await context.eval(`
    global.URLSearchParams = function(init) {
      return _URLSearchParams.apply(undefined, [init], {
        arguments: { copy: true },
        result: { copy: true }
      });
    };
  `);
}

async function injectConsole(context, logs, isDebug = false) {
  const jail = context.global;
  await context.eval('if (!global.console) global.console = {};');
  const consoleHandle = await jail.get('console');

  await consoleHandle.set('log', (...args) => {
    if (isDev) console.log(...args);
    if (isDebug) logs.push({ type: 'log', args: args });
  });
  await consoleHandle.set('warn', (...args) => {
    if (isDev) console.warn(...args);
    if (isDebug)
      logs.push({
        type: 'warn',
        args: args,
      });
  });
  await consoleHandle.set('error', (...args) => {
    if (isDev) console.error(...args);
    if (isDebug) logs.push({ type: 'error', args: args });
  });
}

async function injectFetch(context) {
  const jail = context.global;

  const fetchImpl = async (url, optionStr) => {
    try {
      const options = optionStr || {};
      const res = await fetch(url, options);
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

  await context.eval(`
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
        json: async () => JSON.parse(json.body),
      };
    }
  `);
}

module.exports = { runUserFunction };
