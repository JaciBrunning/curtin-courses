import _ from 'lodash'

const calcOperand = (us, them, themObj, levelOf) => {
  if (themObj.completed)
    return { completed: true }
  else if (themObj.bad)
    return { bad: true }
  else if (levelOf(them) >= levelOf(us)) {
    // They are above us - therefore invalid
    return { bad: true }
  }
  // Everything works out
  return { good: true }
}

const tryResolveToOperand = (code, a, out, internalUnits, levelOf, isCompleted) => {
  let aObj = a
  if (typeof a === 'string' && a in internalUnits) {
    if (!(a in out)) calcPrereqs(a, out, internalUnits, levelOf, isCompleted)
    aObj = out[a]
  }

  if (typeof aObj === 'object')
    return calcOperand(code, a, aObj, levelOf)
  return undefined
}

export function estimateAvailability(containerTitle, avails) {
  return _.some(avails, a => containerTitle.toLowerCase().includes(a.period.toLowerCase()))
}

export function calcPrereqs(code, out, internalUnits, levelOf, isCompleted) {
  let unit = internalUnits[code]

  if (unit && !(code in out)) {
    let prereqs = unit.prereqs
    if (isCompleted(code)) {
      // Unit has already been completed
      out[code] = { completed: true }
    } else if (prereqs) {
      // Unit has prereqs - evaluate postfix
      let stack = []
      prereqs.forEach(p => {
        if (p == '|' || p == '&') {
          let a = stack.pop()
          let b = stack.pop()

          let operands = []
          let opA = tryResolveToOperand(code, a, out, internalUnits, levelOf, isCompleted)
          let opB = tryResolveToOperand(code, b, out, internalUnits, levelOf, isCompleted)

          if (opA) operands.push(opA)
          if (opB) operands.push(opB)

          if (operands.length == 0) {
            // Both are external. Just ignore - the next pop will not have all its elements
          } else if (p == '|') {
            if (_.some(operands, x => x.completed))
              stack.push({ completed: true })
            else if (_.some(operands, x => x.good))
              stack.push({ good: true })
            else {
              // console.log("PREREQ - BAD [OR] ", code, a, b, JSON.stringify(operands))
              stack.push({ bad: true })
            }
          } else if (p == '&') {
            if (_.every(operands, x => x.completed))
              stack.push({ completed: true })
            else if (_.every(operands, x => x.completed || x.good))
              stack.push({ good: true })
            else {
              // console.log("PREREQ - BAD [AND] ", code, a, b, JSON.stringify(operands))
              stack.push({ bad: true })
            }
          }
        } else if (p == '?') {
          // ????
        } else {
          stack.push(p)
        }
      })

      if (stack.length == 0)
        out[code] = { readyToEnrol: true }
      else {
        let top = stack.pop()
        if (typeof top === 'string') {
          // Single dependency
          let op = tryResolveToOperand(code, top, out, internalUnits, levelOf, isCompleted)
          if (op) {
            if (op.completed)
              out[code] = { readyToEnrol: true }
            else out[code] = op
          } else {
            out[code] = { readyToEnrol: true }
          }
        } else {
          if (top.completed && !isCompleted(code))
            out[code] = { readyToEnrol: true }
          else out[code] = top
        }
      }
    } else {
      // Unit has no prereqs
      out[code] = { readyToEnrol: true }
    }
  }
}

// export function removeUnitFrom(state, period, index) {
//   let unitCopy = state[period].units.slice()
//   unitCopy.splice(index, 1)[0]
//   return {

//   }
// }