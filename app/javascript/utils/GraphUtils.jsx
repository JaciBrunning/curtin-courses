import truncate from "truncate";
import md5 from "md5";

const colour_external = "#949494"
const colour_node = "#e18efa"
const colour_or = "#fa70ff"
const colour_and = "#998efa"
const colour_optional = "#ff9f29"
const colour_error = "#fa8e8e"

class GraphGenerator {
  constructor(units) {
    this.reset()
    this.units = units
  }  

  reset = () => {
    this.nodes = {}
    this.hiddenNodes = {} // Nodes that are hidden
    this.islandNodes = {} // Nodes that are alone - no dependencies or dependants
    this.edges = []
  }

  generateGraph = (showHidden, optimizeIterations=5) => {
    let opid = 0
    let stack = []

    this.units.forEach(this._assignInternal)
    this.units.forEach(u => this._processPrereqs(u, showHidden))
    for (let i = 0; i < optimizeIterations; i++) {
      console.log("Optimize " + i)
      this._clearUnusedEdges()
      this._optimize()
    }

    return {
      nodes: this.nodes,
      edges: this.edges,
      hidden: this.hiddenNodes,
      island: this.islandNodes
    }
  }

  _assignInternal = (u) => {
    let unit = u.unit
    let colour = u.optional ? colour_optional : unit.error ? colour_error : colour_node
    this.nodes[unit.code] = {
      id: unit.code,
      label: truncate(`${unit.code}\n${unit.name}`, 25),
      name: unit.name,
      url: unit.url,
      hidden: false,
      type: 'internal',
      color: {
        background: colour,
        border: colour
      }
    }
  }

  _assignAggregation = (id, agg) => {
    let colour = (agg == "OR" ? colour_or : colour_and)
    this.nodes[id] = {
      id: id,
      label: agg,
      type: 'aggregate',
      hidden: false,
      shape: 'box',
      color: {
        background: colour,
        border: colour
      }
    }
  }

  _assignExternal = (unit_id, hide) => {
    if (!(unit_id in this.nodes)) {
      if (this.units.filter(u => (u.unit.code == unit_id)).length != 0)
        console.error("EXTERNAL: " + unit_id)
      let target = hide ? this.hiddenNodes : this.nodes
      target[unit_id] = {
        id: unit_id,
        label: unit_id,
        type: 'external',
        hidden: hide,
        color: {
          background: colour_external,
          border: colour_external
        }
      }
    }
  }

  _hashKey = (obj) => md5(JSON.stringify(obj)).substr(0, 6)
  _aggKey = (sym, a, b) => sym + "-" + this._hashKey(a) + "-" + this._hashKey(b)

  _processPrereqs = (u, showHidden) => {
    let stack = []
    let unit = u.unit
    if (unit.prereqs) {
      unit.prereqs.forEach(dep => {
        if (dep == '|' || dep == '&') {
          // Is an operation node, pop the stack for the operands
          // and add the new graph node
          let sym = dep == '|' ? "OR" : "AND"
          let a = stack.pop()
          let b = stack.pop()
          let id = this._aggKey(sym, a, b)

          this._assignAggregation(id, sym)

          this.edges.push({ from: a, to: id })
          this.edges.push({ from: b, to: id })
          stack.push(id)
        } else {
          // Is a unit node, give it a "external" (hidden) node if
          // it doesn't already have one, and add it to the stack
          this._assignExternal(dep, !showHidden)
          stack.push(dep)
        }
      })

      // Attach any stragglers
      while (stack.length > 0)
        this.edges.push({ from: stack.pop(), to: unit.code })
    }
  }

  _clearUnusedEdges = () => {
    let keys = {}
    this.edges = this.edges.filter(x => {
      let hc = this._hashKey(x.from) + this._hashKey(x.to)
      let accept = (x.from in this.nodes) 
              && !this.nodes[x.from].hidden 
              && (x.to in this.nodes)
              && !this.nodes[x.to].hidden
              && !(hc in keys)
      if (accept)
        keys[hc] = true
      return accept
    })
  }

  // Optimize the graph, by removing any lone aggregations,
  // removing ANDs, cascading ORs, and any other optimizations
  _optimize = () => {
    let nodeSet = this.nodes
    this.nodes = {}

    Object.keys(nodeSet).forEach((key) => {
      let node = nodeSet[key]
      let outgoing = this.edges.filter(x => (x.from == node.id))
      let incoming = this.edges.filter(x => (x.to   == node.id))
      let optimized = false

      if (node.type == 'aggregate') {
        // Aggregation type
        if (incoming.length == 0 || outgoing.length == 0) {
          // No-op aggregation - optimize out
          optimized = true
        } else if (incoming.length == 1) {
          // We only have one operand - skip over this node
          outgoing.forEach(e => (e.from = incoming[0].from))
          optimized = true
        } else if (node.label == "AND") {
          // ANDs can be simplified to go directly to target,
          // as long as the target is not OR
          let orPaths = outgoing.filter(o => (nodeSet[o.to].type == 'aggregate' && nodeSet[o.to].label == 'OR'))
          if (orPaths.length == 0) {
            // Optimize
            outgoing.forEach(o => {
              let target = o.to
              incoming.forEach(i => {
                let source = i.from
                this.edges.push({ from: source, to: target })
              })
            })
            optimized = true
          }
        } else if (node.label == "OR") {
          // Cascading ORs can be optimized
          incoming.forEach(i => {
            let source = nodeSet[i.from]
            if (source != undefined && source.label == "OR") {
              // Coming from an OR - check if we're its only target
              let source_outgoing = this.edges.filter(x => x.from == source.id)
              if (source_outgoing.length == 1) {
                // If we're the only target, remap its edges and don't use the node
                let source_incoming = this.edges.filter(x => x.to == source.id)
                source_incoming.forEach(e => (e.to = node.id))
              } else {
                // OR has multiple targets, put it back into the node set
                this.nodes[source.id] = source
              }
            } else if (source != undefined) {
              // Is not an OR, put it back into the node set
              // TODO: this an error?
              this.nodes[source.id] = source
            }
          })
        } else {
          // We don't know what this is - keep the node and don't optimize
          console.error("UNKNOWN NODE", node)
        }
      } else {
        // Unit type
        // Optimization: island
        if (incoming.length == 0 && outgoing.length == 0) {
          this.islandNodes[node.id] = node
          optimized = true
        }
      }

      if (!optimized) this.nodes[node.id] = node
    })
  }

  // TODO: Don't need?
  filterObj(obj, pred) {
    return Object.keys(obj)
          .filter( key => pred(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} )
  }
  
}

export default GraphGenerator;