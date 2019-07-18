import React from 'react';
import Graph from 'react-graph-vis';
import { Collapse } from 'react-collapse';
import { isNumber } from 'util';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import GraphGenerator from '../utils/GraphUtils';
import SearchUtils from '../utils/SearchUtils';

const colour_outside = "#949494"
const colour_node = "#e18efa"
const colour_or = "#fa70ff"
const colour_and = "#998efa"
const colour_optional = "#ff9f29"
const colour_error = "#fa8e8e"
const colour_selected = "#00d420"

const hierarchical_full = "Pure Hierarchical"
const hierarchical_noauto = "Hybrid Hierarchical"
const hierarchical_none = "Blob"

class UnitGraph extends React.Component {
  constructor(props) {
    super(props)
    this.generator = new GraphGenerator(this.props.units)
    this.state = {
      lists: null,
      filter: {
        loading: false,
        options: [],
        selected: []
      },
      graphKey: 0   // When changing layouts, sometimes we need to reinit the graph
    }
    Object.assign(this.state, this.generateGraph(!this.props.hide_external, hierarchical_full))
  }

  generateGraph = (showHidden, hierarchical) => {
    this.generator.reset()
    this.generator.setIgnored(this.state.filter.selected)
    
    let result = this.generator.generateGraph(showHidden, hierarchical == hierarchical_full)

    return {
      graph: {
        nodes: Object.values(result.nodes),
        edges: result.edges
      },
      showHidden: showHidden,
      hidden: Object.values(result.hidden),
      singular: Object.values(result.island),
      hierarchical: hierarchical,
      graphKey: this.state.graphKey + 1
    }
  }

  refreshGraph = (showHidden=this.state.showHidden, hierarchical=this.state.hierarchical) => {
    this.setState(this.generateGraph(showHidden, hierarchical))
  }

  filterSearch = (query) => {
    SearchUtils.searchUnits(query, (res) => {
      this.state.filter.options = res
      this.state.filter.loading = false
      this.setState({ filter: this.state.filter })
    })
  }

  filterSelect = (e) => {
    this.state.filter.selected = e.map(x => x.code)
    this.setState({ filter: this.state.filter })
    this.refreshGraph()
  }

  toggleStandalone = (e) => {
    e.preventDefault()
    this.setState({ lists: (this.state.lists == "standalone" ? null : "standalone") })
  }

  toggleHidden = (e) => {
    e.preventDefault()
    this.setState({ lists: (this.state.lists == "hidden" ? null : "hidden") })
  }

  toggleHiddenGraph = (e) => {
    e.preventDefault()
    this.refreshGraph(!this.state.showHidden, this.state.hierarchical)
  }

  nextHierarchicalOption = () => {
    return this.state.hierarchical == hierarchical_full ? hierarchical_noauto : this.state.hierarchical == hierarchical_noauto ? hierarchical_none : hierarchical_full
  }

  toggleHierarchical = (e) => {
    e.preventDefault()
    let next = this.nextHierarchicalOption()
    this.refreshGraph(this.state.showHidden, next)
  }

  showStandalone = () => { return this.state.lists == "standalone" }
  showHidden = () => { return this.state.lists == "hidden" }
  showHiddenGraph = () => { return this.state.showHidden }

  nodeDoubleClick = (e) => {
    let {nodes, edges} = e
    if (nodes.length == 1 && !isNumber(nodes[0])) {
      window.location.href = this.props.unit_base_url.replace(/\:code/, nodes[0])
    }
  }

  render() {
    return (
      <React.Fragment>
        <div>
          {
            this.state.singular.length > 0 ? <button className={ "btn mx-1 " + (this.showStandalone() ? "btn-danger" : "btn-primary") } onClick={this.toggleStandalone}> { this.showStandalone() ? "Hide" : "Show" } Standalone Units </button> : <React.Fragment />
          }
          {
            this.state.hidden.length > 0 ? <button className={ "btn mx-1 " + (this.showHidden() ? "btn-danger" : "btn-primary") } onClick={this.toggleHidden}> { this.showHidden() ? "Hide" : "Show" } External Units </button> : <React.Fragment />
          }
          {
            this.props.hide_external ? <button className={ "btn mx-1 " + (this.showHiddenGraph() ? "btn-dark" : "btn-secondary") } onClick={this.toggleHiddenGraph}> { this.showHiddenGraph() ? "Hide" : "Show" } External in Graph</button> : <React.Fragment />
          }
          <button className="btn btn-secondary mx-1" onClick={this.toggleHierarchical}> { this.nextHierarchicalOption() } </button>
        </div>
        <Collapse isOpened={this.state.lists == "standalone"}>
          <ul className="list-group">
            {
              this.state.singular.map(n => {
                return <li key={n.id} className="list-group-item"><a href={`${this.props.unit_base_url.replace(/\:code/, n.id)}`}> {n.id} - {n.name} </a></li>
              })
            }
          </ul>
        </Collapse>
        <Collapse isOpened={this.state.lists == "hidden"}>
          <ul className="list-group">
            {
              this.state.hidden.map(n => {
                return <li key={n.id} className="list-group-item"><a href={`${this.props.unit_base_url.replace(/\:code/, n.id)}`}>{ n.id }</a></li>
              })
            }
          </ul>
        </Collapse>

        <AsyncTypeahead
          id="FilterSearch"
          className="m-1"
          isLoading={this.state.filter.loading}
          options={this.state.filter.options}
          labelKey={SearchUtils.labelKey}
          renderToken={SearchUtils.renderTypeaheadToken}
          minLength={3}
          multiple={true}
          onSearch={this.filterSearch}
          onChange={this.filterSelect}
          placeholder="Ignored Units..."
        />

        {
          this.state.graph.nodes.length == 0 ? 
          <React.Fragment>
            <br />
            <h2> This unit has no dependencies. </h2>
          </React.Fragment> :
          <div style={{ left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', maxWith: '100vw', position: 'relative', right: '50%' }}>
            <Graph
              key={this.state.graphKey}
              graph={this.state.graph}
              options={{
                edges: {
                  smooth: true,
                  color: {
                    highlight: colour_selected
                  }
                },
                nodes: {
                  color: {
                    highlight: {
                      border: colour_selected,
                      background: colour_selected
                    }
                  }
                },
                autoResize: true,
                interaction: {
                  multiselect: true
                },
                layout: { 
                  hierarchical: { 
                    enabled: this.state.hierarchical != hierarchical_none, 
                    direction: 'LR',
                    treeSpacing: 20,
                    nodeSpacing: 80,
                    levelSeparation: 200,
                  }
                },
                physics: {
                  enabled: true,
                  stabilization: {
                    enabled: true,
                    iterations: 1000
                  },
                  hierarchicalRepulsion: {
                    nodeDistance: 80,
                    springLength: 50
                  },
                  repulsion: {
                    springLength: 120,
                    nodeDistance: 150
                  }
                }
              }}
              getNodes={n => this.nodeset = n}
              getNetwork={n => this.network = n}
              events={{
                doubleClick: this.nodeDoubleClick
              }}
              style={{ width: this.props.width || '100vw', height: this.props.height || '70vh' }}
            />
          </div>
        }
      </React.Fragment>
    )
  }
}

export default UnitGraph;