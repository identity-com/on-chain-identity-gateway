const assert = require('assert')
const truffleAssert = require('truffle-assertions')

module.exports = {
  notEmitted: truffleAssert.eventNotEmitted,
  emitted: truffleAssert.eventEmitted,
  reverted: truffleAssert.reverts,
  getResult: truffleAssert.createTransactionResult,
  passes: truffleAssert.passes,
  fails: truffleAssert.fails,
  equal: assert.strictEqual,
  notEqual: assert.notStrictEqual,
  isTrue: assert.isTrue,
  ok: assert.ok,
}
