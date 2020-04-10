module.exports = function parseKV(kv, opts = {}) {
  let inSpace = true
  let afterKey = false
  let beforeValue = false
  let inKey = false
  let inValue = false
  let isQuote = false

  let currentKey = ''
  let currentValue = ''

  const output = {}

  const setKV = (quoted) => {
    let parsedValue = currentValue

    if (!opts.raw) {
      try {
        parsedValue = JSON.parse(quoted ? `"${currentValue}"` : currentValue)
      } catch {}
    }

    output[currentKey] = parsedValue
    currentKey = ''
    currentValue = ''
  }

  for (const ch of kv) {
    switch (ch) {
      case '"':
        if (inSpace) {
          inKey = true
          inSpace = false
        } else if (afterKey) {
          throw new Error(`Unexpected char ${ch} between key=value pair`)
        } else if (beforeValue) {
          inValue = true
          beforeValue = false
        } else if (inKey && isQuote) {
          afterKey = true
          inKey = false
        } else if (inValue && isQuote) {
          inSpace = true
          inValue = false
          setKV(true)
        } else if (inKey && currentKey && !isQuote) {
          throw new Error(`Unexpected char ${ch} in key`)
        } else if (inValue && currentValue && !isQuote) {
          currentValue += ch
          break
        }

        isQuote = !isQuote // TODO: Allow quote escaping.

        break
      case '=':
        if (inSpace) {
          inKey = true
          inSpace = false
        } else if (afterKey) {
          beforeValue = true
          afterKey = false
        } else if (beforeValue) {
          beforeValue = false
          inValue = true
          currentValue += ch
        } else if (inKey && isQuote) {
          currentKey += ch
        } else if (inKey && !isQuote) {
          beforeValue = true
          inKey = false
        } else if (inValue) {
          currentValue += ch
        }

        break
      default:
        if (inSpace) {
          inKey = true
          inSpace = false
          currentKey += ch
        } else if (afterKey) {
          throw new Error(`Unexpected char ${ch} between key=value pair`)
        } else if (beforeValue) {
          inValue = true
          beforeValue = false
          currentValue += ch
        } else if (inKey) {
          currentKey += ch
        } else if (inValue) {
          currentValue += ch
        }

        break
    }
  }

  if (currentKey && currentValue) setKV()

  return output
}
