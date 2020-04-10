const parseKV = require('./parse-kv')
const assert = require('assert')

;[
  ['foo=bar', {foo: 'bar'}],
  ['"foo"=bar', {foo: 'bar'}],
  ['baz="qux"', {baz: 'qux'}],
  ['foo==bar', {foo: '=bar'}],
  ['"baz="="=qux"', {'baz=': '=qux'}],
  ['"foo bar"==baz', {'foo bar': '=baz'}],
  ['qux="= quux"', {qux: '= quux'}],
  ['a=1', {a: 1}],
  ['a=1.2', {a: 1.2}],
  ['a=true', {a: true}],
  ['a=false', {a: false}],
  ['a=[1,2,3]', {a: [1, 2, 3]}],
  ['a="[1,2,3]"', {a: '[1,2,3]'}],
  ['a={"b":{"c":[1,2,{}]}}', {a: {b: {c: [1, 2, {}]}}}],
].forEach(([input, result]) => {
  assert.deepStrictEqual(parseKV(input), result)
})
