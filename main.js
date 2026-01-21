/*
 * Copyright (c) 2014-2018 Minkyu Lee.
 * Modified: Getter, Setter + __construct generation
 */

/**
 * Change first character to upper case
 */
function firstUpperCase (name) {
  if (name.length > 0) {
    return name[0].toUpperCase() + name.substr(1)
  }
  return ''
}

/**
 * Force type name to lowercase (UML display)
 */
function normalizeType (umlType) {
  if (umlType && umlType.name) {
    umlType.name = umlType.name.toLowerCase()
  }
  return umlType
}

/**
 * Attribute is required if type does NOT start with '?'
 */
function isRequiredAttribute (attr) {
  return attr.type && attr.type.name && !attr.type.name.startsWith('?')
}

/**
 * Generate getter & setter
 *
 * @param {UMLAttribute} attr
 */
function generateGetterSetter (attr) {
  var _class = attr._parent
  var builder = app.repository.getOperationBuilder()

  builder.begin('generate getter & setter')

  // ===== Getter =====
  var _getter = new type.UMLOperation()
  _getter.name = 'get' + firstUpperCase(attr.name)
  _getter.visibility = type.UMLModelElement.VK_PUBLIC
  _getter._parent = _class

  var _getterReturn = new type.UMLParameter()
  _getterReturn.direction = type.UMLParameter.DK_RETURN
  _getterReturn.type = normalizeType(attr.type)
  _getterReturn._parent = _getter

  _getter.parameters.push(_getterReturn)

  builder.insert(_getter)
  builder.fieldInsert(_class, 'operations', _getter)

  // ===== Setter =====
  var _setter = new type.UMLOperation()
  _setter.name = 'set' + firstUpperCase(attr.name)
  _setter.visibility = type.UMLModelElement.VK_PUBLIC
  _setter._parent = _class

  var _setterParam = new type.UMLParameter()
  _setterParam.direction = type.UMLParameter.DK_IN
  _setterParam.name = '$' + attr.name
  _setterParam.type = normalizeType(attr.type)
  _setterParam._parent = _setter

  _setter.parameters.push(_setterParam)

  // return void
  var _setterReturn = new type.UMLParameter()
  _setterReturn.direction = type.UMLParameter.DK_RETURN
  _setterReturn._parent = _setter

  _setter.parameters.push(_setterReturn)

  builder.insert(_setter)
  builder.fieldInsert(_class, 'operations', _setter)

  builder.end()
  app.repository.doOperation(builder.getOperation())
}

/**
 * Generate "__construct" with required attributes only
 *
 * @param {UMLClassifier} _class
 */
function generateConstructor (_class) {
  var builder = app.repository.getOperationBuilder()
  builder.begin('generate constructor')

  var _ctor = new type.UMLOperation()
  _ctor.name = '__construct'
  _ctor.visibility = type.UMLModelElement.VK_PUBLIC
  _ctor._parent = _class

  _class.attributes.forEach(function (attr) {
    if (isRequiredAttribute(attr)) {
      var _param = new type.UMLParameter()
      _param.direction = type.UMLParameter.DK_IN
      _param.name = '$' + attr.name
      _param.type = normalizeType(attr.type)
      _param._parent = _ctor
      _ctor.parameters.push(_param)
    }
  })

  if (_ctor.parameters.length > 0) {
    builder.insert(_ctor)
    builder.fieldInsert(_class, 'operations', _ctor)
  }

  builder.end()
  app.repository.doOperation(builder.getOperation())
}

/**
 * Command Handler
 */
function _handleGenerate (base, path, options) {
  var selected = app.selections.getSelectedModels()

  selected.forEach(function (e) {
    if (e instanceof type.UMLAttribute) {
      generateGetterSetter(e)

    } else if (e instanceof type.UMLClassifier) {
      generateConstructor(e)
      e.attributes.forEach(function (attr) {
        generateGetterSetter(attr)
      })
    }
  })
}

function init () {
  app.commands.register('gettersetter:generate', _handleGenerate)
}

exports.init = init
