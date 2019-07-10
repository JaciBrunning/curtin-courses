import Paths from "./Paths.js";
import React from 'react';
import { Token, Highlighter } from 'react-bootstrap-typeahead';

class SearchUtils {
  static search = (type, query, cb) => {
    let path = Paths.search[type](query)
    fetch(path)
      .then(response => response.json())
      .then(data => cb(data.results))
  }

  static searchAll = (query, cb) => this.search('all', query, cb)
  static searchCourses = (query, cb) => this.search('courses', query, cb)
  static searchUnits = (query, cb) => this.search('units', query, cb)

  static labelKey = (option) => {
    return option.abbrev ? `${option.code} - ${option.abbrev} ${option.name}` : `${option.code} - ${option.name}`
  }
  static renderTypeaheadToken = (option, props, index) => {
    return <Token key={index} onRemove={props.onRemove}>
      { option.abbrev ? `${option.code} ${option.abbrev}` : option.code }
    </Token>
  }
}

export default SearchUtils;