export const mapObject = (obj, f) => {
  let newObj = {}
  Object.keys(obj).forEach(k => ( newObj[k] = f(k, obj[k]) ))
  return newObj
}