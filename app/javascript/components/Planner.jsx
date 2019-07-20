import React from 'react';
import './planner.scss'
import { DragDropContext } from 'react-beautiful-dnd';
import { groupBy, sortBy, partition, mapValues, find, includes } from 'lodash';
import Unit from './planner/Unit';
import { EasyDraggable, DroppableList } from './DnD';
import { MaybeEditableTitle } from '../Title';

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
  <DroppableList
    {...props}
    className="period"
    pre={
      <React.Fragment>
        <MaybeEditableTitle
          editable
          title={props.title}
          onChange={props.onTitleChange} />
        
        <i className="fas fa-coins">&nbsp;</i> {
          props.units.map(u => u.credits).reduce((a, b) => a + b, 0)
        }
      </React.Fragment>
    } />
)

const Arena = (props) => (
  <DroppableList
    {...props}
    hideTitleWhenEmpty
    title="Unassigned Units"
    className="arena"
    pre={
      <MaybeEditableTitle
        title="Unassigned Units"
        hide={props.children.length == 0} />
    } />
)

class Planner extends React.Component {
  constructor(props) {
    super(props)
    this.periodId = 0

    let part = partition(this.props.units, u => u.optional)
    let [optionals, non_optionals] = part;
    
    let cu_periods = sortBy(non_optionals, 'planned_period')
    let periodUnits = mapValues(groupBy(cu_periods, 'planned_period'), v => {
      return { title: v[0].planned_period, units: v.map(u => u.unit) }
    })
    
    this.state = {
      orientation: 'horizontal',
      orientationComplement: 'vertical',
      periods: periodUnits,
      arena: []
    }
  }

  flipOrientation = () => {
    this.setState({ 
      orientation: this.state.orientationComplement,
      orientationComplement: this.state.orientation
    })
  }

  refreshUnits = () => {
    this.setState({ 
      arena: this.state.arena,
      periods: this.state.periods
    })
  }

  getList = name => {
    if (name == 'arena')
      return this.state.arena
    else
      return this.state.periods[name].units
  }

  reorder = (list, from, to) => {
    list.splice(to, 0, list.splice(from, 1)[0])
  }

  move = (srcList, destList, srcIndex, destIndex) => {
    destList.splice(destIndex, 0, srcList.splice(srcIndex, 1)[0])
  }

  forEachUnitInArray = (codes, array, f) => {
    array.forEach(v => {
      if (includes(codes, v.code))
        f(v)
    })
  }

  forEachUnitIn = (codes, f) => {
    this.forEachUnitInArray(codes, this.state.arena, f)
    Object.keys(this.state.periods).forEach(k => {
      this.forEachUnitInArray(codes, this.state.periods[k].units, f)
    })
  }

  prereqsFor = (code, f) => {
    let unit = find(this.props.units, u => u.unit.code == code).unit
    if (unit.prereqs) {
      this.forEachUnitIn(unit.prereqs.filter(x => x.length > 1), f)
    }
  }

  onDragStart = result => {
    // Set highlight
    this.prereqsFor(result.draggableId, u => {
      u.highlight = 'prereq'
    })

    this.refreshUnits()
  }

  onDragEnd = result => {
    let { source, destination } = result
    if (!destination) return;

    let sourceList = this.getList(source.droppableId)
    if (source.droppableId == destination.droppableId) {
      // Reorder
      this.reorder(sourceList, source.index, destination.index )
    } else {
      // Move to another list
      let destList = this.getList(destination.droppableId)
      this.move(sourceList, destList, source.index, destination.index)
    }

    // Clear highlight
    this.prereqsFor(result.draggableId, u => {
      u.highlight = undefined
    })

    this.refreshUnits()
  }

  render() {
    return (
      <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
        <button className="btn btn-primary" onClick={this.flipOrientation}>
          <i className="fas fa-sync">&nbsp;</i>
          Flip Orientation
        </button>

        <div className={ "flex-container " + this.state.orientation  }>
          <Arena id="arena" direction={this.state.orientationComplement}>
            {
              this.state.arena.map((unit, index) =>
                <UnitDraggable 
                  arena
                  key={unit.code}
                  unit={unit}
                  index={index}
                />
              )
            }
          </Arena>
          <div className={"flex-container " + this.state.orientationComplement}>
            {
              Object.keys(this.state.periods).map(k => {
                let v = this.state.periods[k]
                return <Period key={k} id={k} direction={this.state.orientation} title={v.title} units={v.units}>
                  {
                    v.units.length > 0 ? 
                      v.units.map((unit, index) =>
                          <UnitDraggable
                            key={unit.code}
                            unit={unit}
                            index={index}
                          />
                      ) : <div className="unit-item no-units"><p> No Units Selected </p></div>
                  }
                </Period>
              })
            }
          </div>
        </div>
      </DragDropContext>
    )
  }
}

export default Planner;