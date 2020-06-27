import { createFilter } from 'rollup-pluginutils';
import istanbul from 'istanbul-lib-instrument';
import { extname } from 'path';

function makeFilter(opts, extensions) {
  var filter = createFilter(opts.include, opts.exclude);

  extensions = opts.extensions || extensions;
  if (!extensions || extensions === '*') {
    return filter;
  }

  if (!Array.isArray(extensions)) {
    extensions = [extensions];
  }
  extensions = extensions.map(function (e) {
    return e[0] !== '.' ? '.' + e : e;
  });

  return function (id) {
    return filter(id) && extensions.indexOf(extname(id)) > -1;
  };
}

function index () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var filter = makeFilter(options, ['js', 'jsx', 'ts', 'tsx']),
      opts = Object.assign({ esModules: true, compact: options.compact !== false }, options.instrumenterConfig, { produceSourceMap: options.sourceMap !== false }),
      instrumenter = new (options.instrumenter || istanbul).createInstrumenter(opts);

  return {
    name: 'istanbul',
    transform: function transform(code, id) {
      if (!filter(id)) return;

      // getCombinedSourceMap: https://github.com/rollup/rollup/issues/2983

      var _getCombinedSourcemap = this.getCombinedSourcemap(),
          version = _getCombinedSourcemap.version,
          sources = _getCombinedSourcemap.sources,
          sourcesContent = _getCombinedSourcemap.sourcesContent,
          names = _getCombinedSourcemap.names,
          mappings = _getCombinedSourcemap.mappings;

      code = instrumenter.instrumentSync(code, id, { version: version, sources: sources, sourcesContent: sourcesContent, names: names, mappings: mappings });

      return { code: code, map: instrumenter.lastSourceMap() };
    }
  };
}

export default index;
