const { BadRequestError } = require('../core/error.response');

class BundleService {
  async bundle(content) {
    if (!content) throw new BadRequestError('Content is required');
    const wasmCode = await WebAssembly.compile(new Buffer.from(content));
    console.log(wasmCode);

    return content;
  }

  async executeFunction(content, functionName, args) {
    if (!content) throw new BadRequestError('Content is required');
    if (!functionName) throw new BadRequestError('Function name is required');
    if (!args) throw new BadRequestError('Args is required');

    const wasmCode = await WebAssembly.compile(new Buffer.from(content));
    console.log(wasmCode);

    return content;
  }
}

module.exports = new BundleService();
