const { Types } = require('./constants')


class Binding {
  constructor( input ){
    const { properties, propertyName, value } = input 
    
    if (!propertyName || propertyName === "") throw new Error("Cannot construct binding.  Property name is null or empty")
    const property = properties[propertyName]
    if (!property) throw new Error(`Cannot construct binding.  The "${propertyName}" property does not exist.`)
    
    if (value) {
      const keys = Object.keys(value).filter(x => x !== "id" )
      if (keys.length !== 1) throw new Error("Cannot contruct binding.  The value must include one of the optional literal fields") 
      if (!Types[keys[0]]) throw new Error `Cannot construct binding. The argument type ${keys[0]} is not supported`
      if (keys[0] !== property.typeOf) throw new Error(`Cannot construct binding.  "${propertyName}" and "${value[keys[0]]}" have different types.`) 
      this.value = value[keys[0]]
    } else {
      this.value = Types[property.typeOf].defaultValue
    }
    this.typeOf = property.typeOf
    this.propertyName = propertyName
  }

  get id() { return `${this.propertyName}:${this.typeOf} = ${ this.value }`}
}

module.exports = {
  Binding
}