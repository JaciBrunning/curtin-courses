import React from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import SearchUtils from '../utils/SearchUtils';

class Search extends React.Component {
  state = {
    loading: false,
    options: []
  };

  search = (query) => {
    SearchUtils.searchAll(query, (res) => this.setState({ options: res, loading: false }))
  }

  select = (e) => {
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
          labelKey={SearchUtils.labelKey}
          minLength={3}
          onSearch={this.search}
          onChange={this.select}
          placeholder="Search..."

        />
      </React.Fragment>
    );
  }
}

export default Search;