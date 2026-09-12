const fs = require('node:fs')
const path = require('node:path')
const { transformSync } = require('next/dist/build/swc')

exports.loadModule = function loadModule(file, mocks = {}) {
  const filename = path.resolve(file)
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, jsc: { parser: { syntax: 'typescript', tsx: filename.endsWith('.tsx') }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  })
  const loaded = { exports: {} }
  const localRequire = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id]
    if (id.startsWith('@/') || id.startsWith('.')) {
      const resolved = id.startsWith('@/') ? path.resolve(id.slice(2)) : path.resolve(path.dirname(filename), id)
      for (const extension of ['.ts', '.tsx']) {
        if (fs.existsSync(resolved + extension)) return loadModule(resolved + extension, mocks)
      }
    }
    return require(id)
  }
  new Function('require', 'module', 'exports', code)(localRequire, loaded, loaded.exports)
  return loaded.exports
}
