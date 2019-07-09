import React from 'react';
import Graph from 'react-graph-vis';
import truncate from 'truncate';
import { Collapse } from 'react-collapse';
import { isNumber } from 'util';
import GraphGenerator from '../utils/GraphUtils';

const colour_outside = "#949494"
const colour_node = "#e18efa"
const colour_or = "#fa70ff"
const colour_and = "#998efa"
const colour_optional = "#ff9f29"
const colour_error = "#fa8e8e"
const colour_selected = "#00d420"

class UnitGraph extends React.Component {
  constructor(props) {
    super(props)
    this.generator = new GraphGenerator(this.props.units)
    this.state = {
      lists: null,
      hierarchical: true
    }
    Object.assign(this.state, this.generateGraph(!this.props.hide_external, false))
  }

  generateGraph = (showHidden) => {
    this.generator.reset()
    let result = this.generator.generateGraph(showHidden)
    return {
      graph: {
        nodes: Object.values(result.nodes),
        edges: result.edges
      },
      showHidden: showHidden,
      hidden: Object.values(result.hidden),
      singular: Object.values(result.island)
    }
  }

  generateGraphOld = (showHidden, showSingular) => {
    // Process units graph
    let nodes = {}
    let edges = []
    let hiddenNodes = {}

    let op_id = 0
    let stack = []

    this.props.units.forEach(u => {
      let unit = u.unit
      nodes[unit.code] = nodes[unit.code] || {
        id: unit.code,
        label: truncate(`${unit.code}\n${unit.name}`, 25),
        title: unit.name,
        name: unit.name,
        url: unit.url,
        hidden: false
      }

      nodes[unit.code].status = 'internal'
      let colour = u.optional ? colour_optional : unit.error ? colour_error : colour_node
      nodes[unit.code].color = {
        background: colour,
        border: colour
      }

      if (unit.prereqs != null) {
        unit.prereqs.forEach(dep => {
          if (dep == '|' || dep == '&') {
            // Pop stack, add op node
            let a = stack.pop()
            let b = stack.pop()
            let i = op_id++

            colour = (dep == '|' ? colour_or : colour_and)
            nodes[i] = {
              id: i,
              label: (dep == '|' ? "OR" : "AND"),
              status: 'op',
              hidden: false,
              shape: 'box'
            }
            nodes[i].color = {
              background: colour,
              border: colour
            }

            edges.push({ from: a, to: i })
            edges.push({ from: b, to: i })
            stack.push(i)
          } else {
            // Add unit to stack, give it a node if it doesn't have one
            stack.push(dep)
            nodes[dep] = nodes[dep] || {
              id: dep,
              label: dep,
              status: 'external',
              hidden: !showHidden,
              color: {
                background: colour_outside,
                border: colour_outside
              }
            }
            hiddenNodes[dep] = nodes[dep]
          }
        });
      }

      if (stack.length > 0)
        edges.push({ from: stack.pop(), to: unit.code })
    });

    let singular_nodes = {}
    let nodes_arr = Object.values(nodes).filter(n => { return !n.hidden })
    for (let i = 0; i < 5; i++) {
      let arr_cache = nodes_arr
      nodes_arr = []

      // Delete all edges where one node is hidden
      edges = edges.filter(x => {
        return !nodes[x.from].hidden && !nodes[x.to].hidden
      })

      arr_cache.forEach(node => {
        let outgoing = edges.filter(x => { return x.from == node.id })
        let incoming = edges.filter(x => { return x.to   == node.id })

        if (node.status == 'op') {
          if (outgoing.length == 0 || incoming.length == 0) {
            // Hide any no-ops
            node.hidden = true
          } else if (incoming.length == 1) {
            // If we're the only target, skip over us and go to the next one
            outgoing.forEach(e => {
              e.to = incoming[0].to
            })
            node.hidden = true
          } else if (node.label == "AND") {
            // ANDs can be simplfied to go directly to the target
            node.hidden = true
            outgoing.forEach(o => {
              let target = o.to
              incoming.forEach(i => {
                let source = i.from
                edges.push({ from: source, to: target })
              })
            })
          } else if (node.label == "OR") {
            // Try to optimize cascading ORs
            // TODO: Optimize this in postfix expression
            incoming.forEach(edge => {
              let source = nodes[edge.from]
              if (source != undefined && source.label == "OR") {
                let source_incoming = edges.filter(x => { return x.to == source.id })
                let source_outgoing = edges.filter(x => { return x.from == source.id })
              
                if (source_outgoing.length == 1) {
                  // Cascades - can merge nodes
                  source.hidden = true
                  source_incoming.forEach(e => {
                    e.to = node.id
                  })
                }
              }
            })
            nodes_arr.push(node)
          } else {
            // Unknown, cannot optimize, push it back
            nodes_arr.push(node)
          }
        } else {
          if (outgoing.length == 0 && incoming.length == 0) {
            singular_nodes[node.id] = node
            if (showSingular) nodes_arr.push(node)
          } else {
            nodes_arr.push(node)
          }
        }
      })
    }

    return {
      graph: { 
        nodes: nodes_arr,
        edges: edges
      },
      hidden: Object.values(hiddenNodes),
      showHidden: showHidden,
      showSingular: showSingular,
      singular: Object.values(singular_nodes)
    }
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
    this.setState(this.generateGraph(!this.state.showHidden, this.state.showSingular))
  }

  toggleHierarchical = (e) => {
    e.preventDefault()
    this.setState({ hierarchical: !this.state.hierarchical })
  }

  showStandalone = () => { return this.state.lists == "standalone" }
  showHidden = () => { return this.state.lists == "hidden" }
  showHiddenGraph = () => { return this.state.showHidden }
  isHierarchical = () => { return this.state.hierarchical }

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
          <button className="btn btn-secondary mx-1" onClick={this.toggleHierarchical}> { this.isHierarchical() ? "Blob" : "Hierarchical" } </button>
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
        {
          this.state.graph.nodes.length == 0 ? 
          <React.Fragment>
            <br />
            <h2> This unit has no dependencies. </h2>
          </React.Fragment> :
          <Graph
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
                  enabled: this.state.hierarchical, 
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
            style={{ width: this.props.width || '85vw', height: this.props.height || '70vh' }}
          />
        }
        
      </React.Fragment>
    )
  }
}

export default UnitGraph;