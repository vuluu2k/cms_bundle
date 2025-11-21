const { BadRequestError } = require('../core/error.response');
const QuickJS = require('quickjs-emscripten');
const esbuild = require('esbuild');

class BundleService {
  async bundle(content) {
    if (!content) throw new BadRequestError('Content is required');
    // bundle content with esbuild
    const minify_content = await esbuild.build({
      stdin: {
        contents: content,
        resolveDir: process.cwd(),
        sourcefile: 'input.js',
        loader: 'js',
      },
      bundle: true,
      platform: 'neutral',
      format: 'iife',
      globalName: 'MyModule',
      write: false,
      keepNames: true,
    });

    return { content, minify_content: minify_content.outputFiles[0].text };
  }

  async executeFunction(minify_content, functionName, params) {
    if (!minify_content)
      throw new BadRequestError('Minify content is required');
    if (!functionName) throw new BadRequestError('Function name is required');
    if (!params) throw new BadRequestError('Params is required');

    const vm = await QuickJS.newAsyncContext();

    try {
      // Evaluate the bundled code
      const jsFetchFn = vm.newFunction('fetch', (url) =>
        vm.newPromise((resolve, reject) => {
          fetch(url)
            .then(res => res.json())
            .then(resolve)
            .catch(reject);
        })
      );

      // Nhét vào global
      vm.setProp(vm.global, 'fetch', jsFetchFn);
      const bundleResult = vm.evalCode(minify_content);
      console.log('bundleResult:::::::::::::', bundleResult);
      //   bundleResult.dispose();

      // Call the function
      const callCode = `MyModule.${functionName}({ params: ${JSON.stringify(params)} })`;
      const resultHandle = vm.evalCode(callCode);

      console.log('resultHandle:::::::::::::', resultHandle);

      //   // Check if there's an error
      //   if (resultHandle.error) {
      //     const error = vm.dump(resultHandle.error);
      //     resultHandle.error.dispose();
      //     throw new BadRequestError(`Execution failed: ${error}`);
      //   }

      //   // Unwrap the result
      //   const result = vm.unwrapResult(resultHandle);

      //   // Check if result is a Promise using getPromiseState
      //   const promiseState = vm.getPromiseState(result);

      //   // If it's not a promise, promiseState will have notAPromise: true
      //   if (promiseState.type === 'fulfilled' && promiseState.notAPromise) {
      //     // Not a Promise, just return the value directly
      //     const value = vm.dump(result);
      //     result.dispose();
      //     return { result: value };
      //   }

      //   // It's a Promise, resolve it
      //   // Note: resolvePromise works on promise-like values and will handle async execution
      //   const promiseResult = await vm.resolvePromise(result);
      //   result.dispose();

      //   if (promiseResult.error) {
      //     const error = vm.dump(promiseResult.error);
      //     promiseResult.error.dispose();
      //     throw new BadRequestError(`Promise rejected: ${error}`);
      //   }

      //   const resolvedValue = vm.dump(promiseResult.value);
      //   promiseResult.value.dispose();

      //   return { result: resolvedValue };
      return {};
    } catch (error) {
      throw new BadRequestError(`Execution failed: ${error.message}`);
    } finally {
      vm.dispose();
    }
  }
}

module.exports = new BundleService();
