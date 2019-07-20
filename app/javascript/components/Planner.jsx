import React from 'react';
import './planner.scss'
import _ from 'lodash';
import Unit from './planner/Unit';
import { DragDropContext } from 'react-beautiful-dnd';
import { EasyDraggable } from './DnD';
import { UnitCollection } from './planner/UnitCollection';
import { mapObject } from '../utils/CollectionUtils';

class UnitDraggable extends React.Component {
  state = {
    locked: false,
    completed: false
  }

  render() {
    return (
      <EasyDraggable
        id={this.props.unit.code}
        index={this.props.index}
        locked={this.state.locked}
      >
        { (provided, snapshot) => (
          <Unit
            {...this.state}
            highlight={this.props.highlight}
            isDragging={snapshot.isDragging}
            unit={this.props.unit}
            onLock={b => this.setState({locked: b})}
            onComplete={b => this.setState({completed: b})}
            showControls={this.props.arena} />
        )}
      </EasyDraggable>
    )
  }
}

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

    this.allUnits = _.keyBy(Object.values(this.props.units).map(u => u.unit), 'code')

    let part = _.partition(this.props.units, u => u.optional)
    let [optionals, non_optionals] = part;
    
    let periodMap = mapObject(_.groupBy(non_optionals, 'planned_period'), (k, v) => {
      return {
        title: k,
        units: v.map(u => u.unit.code)
      }
    })

    this.state = {
      orientation: 'horizontal', orientationComplement: 'vertical',
      collections: Object.keys(periodMap),
      highlights: {},
      arena: {
        title: "Unassigned Units",
        units: []
      },
      ...periodMap
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
      let prereqs = this.allUnits[code].prereqs
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

      this.setState({ 
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

      this.setState({
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
        <button className="btn btn-primary" onClick={this.flipOrientation}>
          <i className="fas fa-sync">&nbsp;</i>
          Flip Orientation
        </button>

        <div className={ "flex-container " + this.state.orientation }>
          <Arena id="arena" title={this.state.arena.title} direction={this.state.orientationComplement}>
            {
              this.state.arena.units.map((code, index) => {
                let unit = this.allUnits[code]
                return (
                  <UnitDraggable
                    key={unit.code}
                    unit={unit}
                    index={index}
                    highlight={this.state.highlights[unit.code]} />
                )
              })
            }
          </Arena>

          <div className={ "flex-container " + this.state.orientationComplement }>
            {
              this.state.collections.map(k => {
                let v = this.state[k]
                let units = v.units.map(code => this.allUnits[code])

                return (
                  <Period
                    key={k}
                    id={k}
                    direction={this.state.orientation}
                    title={v.title}
                    units={units}>

                    {
                      units.length > 0 ?
                        units.map((unit, index) =>
                          <UnitDraggable
                            key={unit.code}
                            unit={unit}
                            index={index}
                            highlight={this.state.highlights[unit.code]} />
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