const { OK } = require('../core/success.response');
const bundleService = require('../services/bundle.service');

class BundleController {
  async bundle(req, res) {
    const { content, site_id, file_id } = req.body;

    new OK({
      message: 'Bundle created successfully',
      metadata: await bundleService.bundle(content, site_id, file_id),
    }).send(res);
  }

  async execute(req, res) {
    const { functionName, params, site_id, file_id } = req.body;

    new OK({
      message: 'Function executed successfully',
      metadata: await bundleService.executeFunctionIsolatedVM(
        functionName,
        params,
        site_id,
        file_id
      ),
    }).send(res);
  }

  async debug(req, res) {
    const { functionName, params, site_id, file_id } = req.body;

    new OK({
      message: 'Debug executed successfully',
      metadata: await bundleService.executeFunctionIsolatedVM({
        functionName,
        params,
        site_id,
        file_id,
        isDebug: true,
      }),
    });
  }
}

module.exports = new BundleController();
