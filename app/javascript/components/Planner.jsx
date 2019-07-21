import React from 'react';
import './planner.scss'
import _ from 'lodash';
import update from 'immutability-helper';
import Unit from './planner/Unit';
import MultiUnit from './planner/MultiUnit';
import uuidv1 from 'uuid/v1';
import { DragDropContext } from 'react-beautiful-dnd';
import { EasyDraggable } from './DnD';
import { UnitCollection } from './planner/UnitCollection';
import { mapObject } from '../utils/CollectionUtils';
import { calcPrereqs, estimateAvailability } from '../utils/PlannerUtils';

const UnitDraggable = (props) => (
  <EasyDraggable
    id={props.unit.code}
    index={props.index}
    locked={props.locked}
  >
    { (provided, snapshot) => (
      props.unit.freeform ? 
        <MultiUnit
          {...props}
          isDragging={snapshot.isDragging}
          unit={props.unit} /> :
        <Unit
          {...props}
          isDragging={snapshot.isDragging}
          unit={props.unit} />
    )}
  </EasyDraggable>
)

const Period = (props) => (
  <UnitCollection
    editableTitle
    className={ "period " + props.class }
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

    let urlParams = new URLSearchParams(window.location.search)
    this.allUnits = _.keyBy(Object.values(this.props.units).map(u => u.unit), 'code')
    let part = _.partition(this.props.units, u => u.optional)
    let [optionals, non_optionals] = part;
    this.optionalChoices = _.groupBy(optionals, 'planned_period')

    if (urlParams.has('load')) {
      // TODO: Validate state
      this.state = JSON.parse(atob(urlParams.get('load')))
    } else {
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
        highlightAvail: [],
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

  getUnit = code => this.allUnits[code]

  getOptionalChoices = optionalCode => {
    let choices = this.optionalChoices[this.getUnit(optionalCode).freeform_period]
    if (choices) {
      return choices.map(c => c.unit)
    }
    return undefined
  }

  findAllUnitsByCode = code => {
    let found = []
    this.state.collections.concat('arena').forEach(period => {
      this.state[period].units.forEach((u, index) => {
        if (u.code == code)
          found.push({ period, index })
      })
    })
    return found
  }

  canChooseUnit = code => {
    return this.findAllUnitsByCode(code).length == 0
  }

  splitOptional = (period, index, selected) => {
    let optU = this.state[period].units[index]
    let optUnit = this.getUnit(optU.code)

    let nextCredits = ('credits' in optU ? optU.credits : optUnit.credits) - selected.credits

    const optUnitState = {
      credits: nextCredits,
      hidden: nextCredits <= 0,
      chosen: (optU.chosen || []).concat(selected.code)
    }

    // Add new unit
    const newU = {
      code: selected.code,
      optRef: {
        parent: optU.code
      }
    }

    const nextState = update(this.state, {
      [period]: {
        units: {
          $push: [newU],
          [index]: {
            $merge: optUnitState
          }
        }
      }
    })

    this.updateWithPrereqs(nextState)
  }

  removeOptional = (period, index) => {
    let us = this.state[period].units[index]
    let usUnit = this.getUnit(us.code)
    let parentCode = us.optRef.parent
    let parentRef = this.findAllUnitsByCode(parentCode)[0]
    let parentU = this.state[parentRef.period].units[parentRef.index]

    parentRef.chosenIdx = parentU.chosen.indexOf(us.code)

    // Remove from chosen list, update credits
    const nextStateRemoveChosen = update(this.state, {
      [parentRef.period]: {
        units: {
          [parentRef.index]: {
            chosen: {
              $splice: [[parentRef.chosenIdx, 1]]
            },
            hidden: { $set: false },
            credits: { $set: parentU.credits + usUnit.credits }
          }
        }
      }
    })

    // Remove unit
    const nextState = update(nextStateRemoveChosen, {
      [period]: {
        units: {
          $splice: [[index, 1]]
        }
      },
      highlights: { $set: {} },
      highlightAvail: { $set: [] }
    })

    this.updateWithPrereqs(nextState)
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
    const nextState = update(this.state, {
      [period]: {
        units: {
          [index]: {
            $merge: hash
          }
        }
      }
    })
    this.updateWithPrereqs(nextState)
  }

  getStateURL = () => {
    let query = btoa(JSON.stringify(this.state))
    return `${window.origin}${window.location.pathname}?load=${query}`
  }

  onDragStart = result => {
    this.setState({
      highlights: this.assignPrereqs(result.draggableId),
      highlightAvail: this.allUnits[result.draggableId].unit_availabilities
    })
  }

  onDragEnd = result => {
    let { source, destination } = result
    let srcPeriod = source.droppableId
    let srcIdx = source.index
    
    if (!destination) {
      if (this.state[srcPeriod].units[srcIdx].optRef) {
        // Optional dragged outside - remove it
        this.removeOptional(srcPeriod, srcIdx)
      } else {
        this.setState({ highlights: {}, highlightAvail: {} })
      }
      return;
    }

    let srcUnitCopy = this.state[srcPeriod].units.slice()

    let dstPeriod = destination.droppableId
    let dstIdx = destination.index

    if (source.droppableId == destination.droppableId) {
      // Reorder
      srcUnitCopy.splice(dstIdx, 0, srcUnitCopy.splice(srcIdx, 1)[0])

      let nextState = {
        [srcPeriod]: {
          ...this.state[srcPeriod],
          units: srcUnitCopy
        },
        highlights: {},
        highlightAvail: []
      }

      this.updateWithPrereqs(nextState)
    } else {
      // Move to another list
      let dstUnitCopy = this.state[dstPeriod].units.slice()

      let removed = srcUnitCopy.splice(srcIdx, 1)[0]
      dstUnitCopy.splice(dstIdx, 0, removed)

      let nextState = {
        [srcPeriod]: {
          ...this.state[srcPeriod],
          units: srcUnitCopy
        },
        [dstPeriod]: {
          ...this.state[dstPeriod],
          units: dstUnitCopy
        },
        highlights: {},
        highlightAvail: []
      }

      this.updateWithPrereqs(nextState)
    }
  }

  unitsFor = (container) => (
    container.units.map((u, index) => {
      if (u.hidden) return []

      let code = u.code
      let unit = this.getUnit(code)

      return (
        <UnitDraggable
          {...u}
          key={unit.code}
          index={index}
          unit={unit}
          getUnit={this.getUnit}
          getOptionalChoices={this.getOptionalChoices}
          canChooseUnit={this.canChooseUnit}
          splitOptional={(selected) => this.splitOptional(container.id, index, selected)}
          highlight={this.state.highlights[unit.code]}
          prereqStatus={this.state.prereqs[unit.code]}
          container={container}
          onChange={(arg) => this.onChange(container.id, index, arg)} />
      )
    })
  )

  addPeriod = () => {
    const id = `period-${uuidv1()}`
    const nextState = update(this.state, {
      [id]: {
        $set: {
          id: id,
          title: "Set Title...",
          canRemove: true,
          units: []
        }
      },
      collections: {
        $push: [ id ]
      }
    })

    this.setState(nextState)
  }

  removePeriod = (period) => {
    const nextState = update(this.state, {
      arena: {
        units: {
          $push: this.state[period].units
        },
      },
      collections: {
        $splice: [[ this.state.collections.indexOf(period), 1 ]]
      },
      [period]: {
        $set: undefined
      }
    })
    this.setState(nextState)
  }

  render() {
    return (
      <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
        <div className="flex-container flex-row planner-controls">
          <button className="btn btn-primary" onClick={this.flipOrientation}>
            <i className="fas fa-sync">&nbsp;</i>
            Flip Orientation
          </button>
          <button className="btn btn-success" onClick={this.addPeriod}>
            <i className="fas fa-plus"></i>
          </button>
          <input type="text" className="form-control save-load" value={this.getStateURL()} disabled />
        </div>

        <div className={ "flex-container " + this.state.orientation }>
          <Arena id="arena" title={this.state.arena.title} direction={this.state.orientationComplement}>
            { this.unitsFor(this.state.arena) }
          </Arena>

          <div className={ "flex-container " + this.state.orientationComplement }>
            {
              this.state.collections.map(k => {
                let v = this.state[k]

                return (
                  <Period 
                    key={k} id={k}
                    direction={this.state.orientation}
                    title={v.title}
                    canRemove={v.canRemove}
                    onRemove={this.removePeriod}
                    class={
                      estimateAvailability(v.title, this.state.highlightAvail) ? 
                        "period-avail-match" : ""
                    }
                    onTitleChange={d => this.changeTitle(k, d.title)}>
                    { this.unitsFor(v) }
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