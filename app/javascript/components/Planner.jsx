import React from 'react';
import './planner.scss'
import _ from 'lodash';
import Unit from './planner/Unit';
import { DragDropContext } from 'react-beautiful-dnd';
import { EasyDraggable } from './DnD';
import { UnitCollection } from './planner/UnitCollection';
import { mapObject } from '../utils/CollectionUtils';
import { calcPrereqs } from '../utils/PlannerUtils';

const UnitDraggable = (props) => (
  <EasyDraggable
    id={props.unit.code}
    index={props.index}
    locked={props.locked}
  >
    { (provided, snapshot) => (
      <Unit
        {...props}
        isDragging={snapshot.isDragging}
        unit={props.unit} />
    )}
  </EasyDraggable>
)

const Period = (props) => (
  <UnitCollection
    showTotalCredits
    editableTitle
    className="period"
    {...props} />
)

const Arena = (props) => (
  <UnitCollection
    className="arena"
    hideTitle={ !props.children || props.children.length == 0 }
    {...props} />
)

class Planner extends React.Component {
  constructor(props) {
    super(props)
    this.periodId = 0

    let urlParams = new URLSearchParams(window.location.search)
    this.allUnits = _.keyBy(Object.values(this.props.units).map(u => u.unit), 'code')

    if (urlParams.has('load')) {
      // TODO: Validate state
      this.state = JSON.parse(atob(urlParams.get('load')))
    } else {
      let part = _.partition(this.props.units, u => u.optional)
      let [optionals, non_optionals] = part;
      
      let periodMap = mapObject(_.groupBy(non_optionals, 'planned_period'), (k, v) => {
        return {
          id: k,
          title: k,
          units: v.map(u => ({ code: u.unit.code }))
        }
      })

      this.state = this.getStateWithPrereqs({
        orientation: 'horizontal', orientationComplement: 'vertical',
        collections: Object.keys(periodMap).sort(),
        highlights: {},
        prereqs: {},
        arena: {
          id: 'arena',
          title: "Unassigned Units",
          units: []
        },
        ...periodMap
      })
    }
  }

  flipOrientation = () => {
    this.setState({ 
      orientation: this.state.orientationComplement,
      orientationComplement: this.state.orientation
    })
  }

  assignPrereqs = (code, highlights={}, level=0) => {
    let unit = this.allUnits[code]
    if (level < 5 && unit) {
      let prereqs = unit.prereqs
      if (prereqs) {
        prereqs.forEach(u => {
          if (u.length > 1) {
            highlights[u] = (level == 0 ? "prereq" : "prereq-transitive")
            this.assignPrereqs(u, highlights, level + 1)
          }
        })
      }
    }
    return highlights
  }

  levelOf = (code, state=this.state) => {
    for (let [idx, k] of state.collections.entries()) {
      let found = _.find(state[k].units, x => x.code == code)
      if (found)
        return idx
    }
    return -1
  }

  isCompleted = (code, state=this.state) => {
    for (let k of state.collections) {
      let found = _.find(state[k].units, x => x.code == code)
      if (found && found.completed) return true
    }
    return false
  }

  getStateWithPrereqs = (nextState) => {
    let mergedState = { ...this.state, ...nextState }
    // For each unit, determine whether its prereqs are possible or already completed
    let prereqs = {}
    Object.keys(this.allUnits).forEach(code => {
      calcPrereqs(code, prereqs, this.allUnits, x => this.levelOf(x, mergedState), x => this.isCompleted(x, mergedState))
    })

    return {
      ...nextState,
      prereqs
    }
  }

  updateWithPrereqs = (nextState) => this.setState(this.getStateWithPrereqs(nextState))

  changeTitle = (period, title) => {
    this.setState({
      [period]: {
        ...this.state[period],
        title: title
      }
    })
  }

  onChange = (period, index, hash) => {
    let unitsSlice = this.state[period].units
    unitsSlice[index] = {
      ...unitsSlice[index],
      ...hash
    }

    this.updateWithPrereqs({
      [period]: {
        ...this.state[period],
        units: unitsSlice
      }
    })
  }

  getStateURL = () => {
    let query = btoa(JSON.stringify(this.state))
    return `${window.origin}${window.location.pathname}?load=${query}`
  }

  onDragStart = result => {
    this.setState({ highlights: this.assignPrereqs(result.draggableId) })
  }

  onDragEnd = result => {
    let { source, destination } = result
    if (!destination) return;

    if (source.droppableId == destination.droppableId) {
      // Reorder
      let srcUnitCopy = this.state[source.droppableId].units.slice()
      srcUnitCopy.splice(destination.index, 0, srcUnitCopy.splice(source.index, 1)[0])

      this.updateWithPrereqs({ 
        [source.droppableId]: {
          ...this.state[source.droppableId],
          units: srcUnitCopy
        },
        highlights: {}
      })
    } else {
      // Move to another list
      let srcUnitCopy = this.state[source.droppableId].units.slice()
      let removed = srcUnitCopy.splice(source.index, 1)[0]
      let dstUnitCopy = this.state[destination.droppableId].units.slice()
      dstUnitCopy.splice(destination.index, 0, removed)

      this.updateWithPrereqs({
        [source.droppableId]: {
          ...this.state[source.droppableId],
          units: srcUnitCopy
        },
        [destination.droppableId]: {
          ...this.state[destination.droppableId],
          units: dstUnitCopy
        },
        highlights: {}
      })
    }
  }

  render() {
    return (
      <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
        <div className="flex-container flex-row planner-controls">
          <button className="btn btn-primary" onClick={this.flipOrientation}>
            <i className="fas fa-sync">&nbsp;</i>
            Flip Orientation
          </button>
          <input type="text" className="form-control save-load" value={this.getStateURL()} disabled />
        </div>

        <div className={ "flex-container " + this.state.orientation }>
          <Arena id="arena" title={this.state.arena.title} direction={this.state.orientationComplement}>
            {
              this.state.arena.units.map((u, index) => {
                let code = u.code
                let unit = this.allUnits[code]
                return (
                  <UnitDraggable
                    {...u}
                    key={unit.code}
                    unit={unit}
                    index={index}
                    highlight={this.state.highlights[unit.code]}
                    prereqStatus={this.state.prereqs[unit.code]}
                    container={this.state.arena}
                    onChange={(k,v) => this.onChange('arena', index, { [k]: v })} />
                )
              })
            }
          </Arena>

          <div className={ "flex-container " + this.state.orientationComplement }>
            {
              this.state.collections.map(k => {
                let v = this.state[k]
                let units = v.units.map(u => ({ unit: this.allUnits[u.code], ...u }))

                return (
                  <Period
                    key={k}
                    id={k}
                    direction={this.state.orientation}
                    title={v.title}
                    units={units}
                    onTitleChange={d => this.changeTitle(k, d.title)}>

                    {
                      units.length > 0 ?
                        units.map((unit, index) =>
                          <UnitDraggable
                            {...unit}
                            key={unit.code}
                            index={index}
                            highlight={this.state.highlights[unit.code]}
                            prereqStatus={this.state.prereqs[unit.code]}
                            container={v}
                            onChange={(kh,vh) => this.onChange(k, index, { [kh]: vh })} />
                        ) : <div className="unit-item no-units"><p>No Units Selected</p></div>
                    }
                  </Period>
                )
              })
            }
          </div>
        </div>
      </DragDropContext>
    )
  }
}

export default Planner;