const ivm = require('isolated-vm');

async function injectFetch(isolate, context) {
  const jail = context.global;

  const fetchImpl = async (url, options) => {
    try {
      const opts = options || {};
      const res = await fetch(url, opts);
      const text = await res.text();
      return {
        ok: res.ok,
        statusText: res.statusText,
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
          statusText: json.statusText,
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

module.exports = { injectFetch };
