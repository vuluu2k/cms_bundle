const { BadRequestError } = require('../core/error.response');
const { newQuickJSAsyncWASMModule } = require('quickjs-emscripten');
const esbuild = require('esbuild');
const { runUserFunction } = require('../utils/run');

class BundleService {
  async bundle(content, site_id, file_id) {
    if (!content) throw new BadRequestError('Content is required');

    // Bundle content với esbuild - tối ưu cho isolated-vm
    const buildResult = await esbuild.build({
      stdin: {
        contents: content,
        resolveDir: process.cwd(),
        sourcefile: `${file_id}.js`,
        loader: 'js',
      },
      entryNames: `${file_id}`,
      outdir: `bundle/${site_id}`,
      bundle: true,
      platform: 'neutral',
      format: 'iife',
      globalName: 'MyModule',
      keepNames: true,
      minify: false,
      target: 'es2020',
    });

    if (buildResult.errors.length > 0) {
      throw new BadRequestError('Build failed: ' + buildResult.errors[0].text);
    }

    return {
      content,
      buildResult,
    };
  }

  async executeFunction(minify_content, functionName, params) {
    if (!minify_content)
      throw new BadRequestError('Minify content is required');
    if (!functionName) throw new BadRequestError('Function name is required');
    if (!params) throw new BadRequestError('Params is required');
    const response = {};

    const module = await newQuickJSAsyncWASMModule();
    const runtime = module.newRuntime();
    const vm = runtime.newContext();

    try {
      const jsFetchFn = vm.newAsyncifiedFunction('fetch', fetch);
      jsFetchFn.consume((fn) => vm.setProp(vm.global, 'fetch', fn));

      const bundleResult = vm.unwrapResult(vm.evalCode(minify_content));
      bundleResult.dispose();

      // Call the function
      const callCode = `MyModule.${functionName}({ params: ${JSON.stringify(params)} })`;
      const result = await vm.evalCodeAsync(callCode);
      // eslint-disable-next-line no-console
      response.result = vm.dump(result.value);

      return response;
    } catch (error) {
      throw new BadRequestError(`Execution failed: ${error.message}`);
    } finally {
      vm.dispose();
    }
  }

  async executeFunctionIsolatedVM(functionName, params, site_id, file_id) {
    if (!site_id) throw new BadRequestError('Site ID is required');
    if (!file_id) throw new BadRequestError('File ID is required');
    if (!functionName) throw new BadRequestError('Function name is required');
    if (!params) throw new BadRequestError('Params is required');

    const result = await runUserFunction(
      site_id,
      file_id,
      functionName,
      params
    );

    return result;
  }
}

module.exports = new BundleService();
