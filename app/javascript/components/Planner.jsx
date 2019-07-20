import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import InlineEdit from 'react-edit-inline-ff';
import { groupBy, sortBy, partition, mapValues, find, includes } from 'lodash';
import './planner.scss'
import { list } from 'postcss';

class UnitItem extends React.Component {
  state = {
    locked: false,
    completed: false
  }

  toggleLocked = () => {
    let lock = !this.state.locked
    this.setState({ locked: lock })
    if (this.props.onLock) this.props.onLock(lock)
  }

  toggleCompleted = () => {
    let compl = !this.state.completed;
    this.setState({ completed: compl })
    if (this.props.onCompleted) this.props.onCompleted(compl)
  }

  divClass = () => {
    let classes = ["unit-item"]
    if (this.props.snapshot.isDragging) classes.push("dragging")

    if (this.state.locked) classes.push("locked")
    if (this.state.completed) classes.push("completed")
    if (this.props.unit.highlight)
      classes.push("highlight-" + this.props.unit.highlight)

    return classes.join(" ")
  }

  render() {
    return (
      <div className={this.divClass()}>
        <p className="unit-title">{ this.props.unit.code } { this.props.unit.abbrev ? ("(" + this.props.unit.abbrev + ")") : "" }</p>
        <p className="unit-subtitle">{ this.props.unit.name }</p>
        <div className="footer">
          <span><i className="fas fa-coins">&nbsp;</i> { this.props.unit.credits }</span>
          {
            this.props.showControls ? <React.Fragment /> :
              <span>
                <a className="button" onClick={this.toggleLocked}>
                  <i className={"fas fa-" + (this.state.locked ? "lock-open" : "lock")}>&nbsp;</i>
                </a>
                &nbsp;
                <a className="button" onClick={this.toggleCompleted}>
                  <i className={"fas fa-" + (this.state.completed ? "times" : "check")}>&nbsp;</i>
                </a>
              </span>
          }
        </div>
      </div>
    )
  }
}

class UnitDraggable extends React.Component {
  state = {
    dragDisabled: false
  }

  render() {
    return (
      <Draggable draggableId={this.props.unit.code} isDragDisabled={this.state.dragDisabled} index={this.props.index}>
        {
          (provided, snap) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
              <UnitItem 
                snapshot={snap}
                unit={this.props.unit}
                onLock={b => this.setState({ dragDisabled: b })}
                showControls={this.props.arena}
              />
            </div>
          )
        }
      </Draggable>
    )
  }
}

class DroppableList extends React.Component {
  state = {
    title: this.props.title || 'Set Title...'
  }

  droppableClass = (snapshot) => {
    let arr = ["droppable"]
    if (snapshot.isDraggingOver) arr.push("draggedOver")

    if (this.props.className) arr = arr.concat(this.props.className)
    return arr.join(' ')
  }

  render() {
    return (
      <Droppable droppableId={ this.props.id } direction={ this.props.direction }>
        {
          (provided, snapshot) => (
            <div className={this.droppableClass(snapshot)} ref={provided.innerRef} {...provided.droppableProps}>
              {
                this.props.children == 0 && this.props.hideTitleWhenEmpty ?
                  <React.Fragment />
                  : this.props.editableTitle ?
                    <React.Fragment>
                      <InlineEdit
                        className="title title-edit"
                        text={this.state.title}
                        paramName="title"
                        change={data => this.setState({title: data.title})}
                      />
                      <br />
                    </React.Fragment>
                    : <p className="title title-noedit">{ this.state.title }</p>

              }
              { this.props.pre }
              <div className={"flex-container " + this.props.direction}>
                { this.props.children }
                { provided.placeholder }
              </div>
              { this.props.post }
            </div>
          )
        }
      </Droppable>
    )
  }
}

const Period = (props) => (
  <DroppableList
    {...props}
    editableTitle
    className="period"
    pre={
      <React.Fragment>
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
    className="arena" />
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