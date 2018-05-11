const j = require('jscodeshift')
const json5Writer = require('../src/index.js')

it('writes an array to empty source', () => {
  const writer = json5Writer.load('')
  writer.write(['a'])
  expect(writer.toSource()).toBe(`['a']`)
})

it('writes an object to empty source', () => {
  const writer = json5Writer.load('')
  writer.write({ a: 'b' })
  expect(writer.toSource()).toBe(`{
  a: 'b',
}`)
})

it('updates the value of an object', () => {
  const writer = json5Writer.load('{ a: 5 }')
  writer.write({ a: '6' })
  expect(writer.toSource()).toBe(`{ a: '6' }`)
})

it(`writes multiple object key/values`, () => {
  const writer = json5Writer.load('{ a: 5 }')
  writer.write({ a: 6, b: '7' })
  expect(writer.toSource()).toBe(`{
  a: 6,
  b: '7',
}`)
})

it(`writes a nested object`, () => {
  const writer = json5Writer.load('')
  writer.write({ a: { b: 5 } })
  expect(writer.toSource()).toBe(`{
  a: {
    b: 5,
  },
}`)
})

it(`writes a nested array`, () => {
  const writer = json5Writer.load('')
  writer.write([[[[[5]]]]])
  expect(writer.toSource()).toBe(`[[[[[5]]]]]`)
})

it('uses written object key order', () => {
  const writer = json5Writer.load('{ a: 1, c: 3 }')
  writer.write({ a: 1, b: 2, c: 3 })
  expect(writer.toSource()).toBe(`{
  a: 1,
  b: 2,
  c: 3,
}`)
})

it('removes object values not present in the given object', () => {
  const writer = json5Writer.load('{ a: 5, b: 8 }')
  writer.write({ c: 7 })
  expect(writer.toSource()).toBe(`{
  c: 7,
}`)
})

it('removes array values not present in the given array', () => {
  const writer = json5Writer.load('[ 1, 2, 3 ]')
  writer.write([4])
  expect(writer.toSource()).toBe(`[4]`)
})

it(`writes over the existing source that doesn't match`, () => {
  const writer = json5Writer.load(`[ 1, 'seven', {} ]`)
  writer.write({ hi: 5 })
  expect(writer.toSource()).toBe(`{
  hi: 5,
}`)
})

it(`skips over undefined array values`, () => {
  const writer = json5Writer.load('[ 1, 2, 3 ]')
  writer.write([1, undefined, 3])
  expect(writer.toSource()).toBe(`[ 1, 2, 3 ]`)
})

it(`skips over undefined object values`, () => {
  const writer = json5Writer.load('{ a: 1, b: 2, c: 3 }')
  writer.write({ a: 1, b: undefined, c: 3 })
  expect(writer.toSource()).toBe(`{ a: 1, b: 2, c: 3 }`)
})

it('infers object key quote preference', () => {
  const writer = json5Writer.load(`[{ a: 1 }, { 'a': 1 }]`)
  writer.write([{ a: 1, b: 2 }, { a: 1, b: 2 }])
  expect(writer.toSource()).toBe(`[{
  a: 1,
  b: 2,
}, {
  'a': 1,
  'b': 2,
}]`)
})

it('uses quotes when object key has invalid characters', () => {
  const writer = json5Writer.load(`{ a: 1 }`)
  writer.write({ a: 1, 'b-b': 2 })
  expect(writer.toSource()).toBe(`{
  a: 1,
  'b-b': 2,
}`)
})

it('preserves comments and formatting', () => {
  const writer = json5Writer.load(`// don't remove me
{
  // another comment
  'a': 5,

  // comment 3
  'b': 6,
}
// trailing comment`)

  writer.write({ c: '8', a: 6, b: 7 })

  expect(writer.toSource()).toBe(`// don't remove me
{
  'c': '8',

  // another comment
  'a': 6,

  // comment 3
  'b': 7,
}
// trailing comment`)
})

it('outputs to source with options', () => {
  const writer = json5Writer.load('')
  writer.write({ 'car-type': 'honda' })
  expect(writer.toSource({ quote: 'double', trailingComma: false })).toBe(`{
  "car-type": "honda"
}`)
})

it('writes a complicated object', () => {
  const writer = json5Writer.load(`{
  // Game Data

  // skills
  'slash': {
    dmg: 7,
    effects: ['bleed'],
    area: [{ x: 1, y: 0 }],
  },

  // TODO: add effects

  // enemies
  'bear':  {
    health: 17,
    skills: ['slash'],
  },
}`)

  writer.write({
    slash: {
      dmg: 8,
      effects: [],
      area: [{ x: 1, y: 0 }, { x: 2, y: 0 }],
    },

    bear: {
      health: 14,
      skills: ['slash'],
    },

    pig: {
      health: 30,
      skills: [],
    },
  })

  expect(writer.toSource()).toBe(`{
  // Game Data

  // skills
  'slash': {
    dmg: 8,
    effects: [],
    area: [{ x: 1, y: 0 }, {
      x: 2,
      y: 0,
    }],
  },

  // TODO: add effects

  // enemies
  'bear':  {
    health: 14,
    skills: ['slash'],
  },

  'pig': {
    health: 30,
    skills: [],
  },
}`)
})

it('provides the AST', () => {
  const writer = json5Writer.load('{ a: 5 }')
  writer.ast.find(j.Property).forEach(path => {
    path.value.key = j.literal(path.value.key.name)
  })
  expect(writer.toSource()).toBe(`{ 'a': 5 }`)
})