async function injectGlobalFunctions(isolate, context) {
  // Create custom URI encoding/decoding functions directly in isolate
  const wrapperScript = await isolate.compileScript(`
      // Custom encodeURIComponent implementation
      global.encodeURIComponent = function(str) {
        if (str === null || str === undefined) {
          return '';
        }
        str = String(str);
        let result = '';
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          const code = char.charCodeAt(0);
          // Characters that don't need encoding: A-Z, a-z, 0-9, -, _, ., !
          if (
            (code >= 65 && code <= 90) ||  // A-Z
            (code >= 97 && code <= 122) || // a-z
            (code >= 48 && code <= 57) ||  // 0-9
            code === 45 || // -
            code === 95 || // _
            code === 46 || // .
            code === 33    // !
          ) {
            result += char;
          } else {
            // Encode as %XX
            if (code < 128) {
              result += '%' + code.toString(16).toUpperCase().padStart(2, '0');
            } else if (code < 2048) {
              result += '%' + ((code >> 6) | 192).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + ((code & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
            } else {
              result += '%' + ((code >> 12) | 224).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + (((code >> 6) & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + ((code & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
            }
          }
        }
        return result;
      };
      
      // Custom decodeURIComponent implementation
      global.decodeURIComponent = function(str) {
        if (str === null || str === undefined) {
          return '';
        }
        str = String(str);
        let result = '';
        let i = 0;
        while (i < str.length) {
          if (str[i] === '%') {
            if (i + 2 >= str.length) {
              throw new URIError('Malformed URI sequence');
            }
            const hex = str.substring(i + 1, i + 3);
            const code = parseInt(hex, 16);
            if (isNaN(code)) {
              throw new URIError('Malformed URI sequence');
            }
            result += String.fromCharCode(code);
            i += 3;
          } else {
            result += str[i];
            i++;
          }
        }
        return result;
      };
      
      // Custom encodeURI implementation (doesn't encode: ; , / ? : @ & = + $ #)
      global.encodeURI = function(str) {
        if (str === null || str === undefined) {
          return '';
        }
        str = String(str);
        let result = '';
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          const code = char.charCodeAt(0);
          // Characters that don't need encoding in encodeURI
          if (
            (code >= 65 && code <= 90) ||  // A-Z
            (code >= 97 && code <= 122) || // a-z
            (code >= 48 && code <= 57) ||  // 0-9
            code === 45 || // -
            code === 95 || // _
            code === 46 || // .
            code === 33 || // !
            code === 126 || // ~
            code === 42 || // *
            code === 39 || // '
            code === 40 || // (
            code === 41 || // )
            code === 59 || // ;
            code === 47 || // /
            code === 63 || // ?
            code === 58 || // :
            code === 64 || // @
            code === 38 || // &
            code === 61 || // =
            code === 43 || // +
            code === 36 || // $
            code === 44 || // ,
            code === 35    // #
          ) {
            result += char;
          } else {
            // Encode as %XX
            if (code < 128) {
              result += '%' + code.toString(16).toUpperCase().padStart(2, '0');
            } else if (code < 2048) {
              result += '%' + ((code >> 6) | 192).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + ((code & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
            } else {
              result += '%' + ((code >> 12) | 224).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + (((code >> 6) & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
              result += '%' + ((code & 63) | 128).toString(16).toUpperCase().padStart(2, '0');
            }
          }
        }
        return result;
      };
      
      // Custom decodeURI implementation
      global.decodeURI = function(str) {
        if (str === null || str === undefined) {
          return '';
        }
        str = String(str);
        let result = '';
        let i = 0;
        while (i < str.length) {
          if (str[i] === '%') {
            if (i + 2 >= str.length) {
              throw new URIError('Malformed URI sequence');
            }
            const hex = str.substring(i + 1, i + 3);
            const code = parseInt(hex, 16);
            if (isNaN(code)) {
              throw new URIError('Malformed URI sequence');
            }
            result += String.fromCharCode(code);
            i += 3;
          } else {
            result += str[i];
            i++;
          }
        }
        return result;
      };
    `);

  try {
    await wrapperScript.run(context);
  } finally {
    wrapperScript.release();
  }
}

module.exports = { injectGlobalFunctions };
