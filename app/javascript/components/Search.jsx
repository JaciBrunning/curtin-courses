import React from 'react';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';

class Search extends React.Component {
  state = {
    loading: false,
    options: []
  };

  _search = (query) => {
    let url = `${this.props.searchUrl}?query=${encodeURIComponent(query)}`
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.setState({
          options: data.results,
          loading: false
        });
      });
  }

  _select = (e) => {
    let selection = e[0]
    let url = `${this.props.baseUrl.replace(/\/+$/, '')}/${selection.type}/${selection.code}`
    window.location.href = url
  }

  render() {
    return (
      <React.Fragment>
        <AsyncTypeahead
          id="MainSearch"
          isLoading={this.state.loading}
          options={this.state.options}
          labelKey={(option) => `${option.code} - ${option.name}`}
          minLength={3}
          onSearch={this._search}
          onChange={this._select}
          placeholder="Search..."

        />
      </React.Fragment>
    );
  }
}

export default Search;