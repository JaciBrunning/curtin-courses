import React from 'react';
import { estimateAvailability } from '../../utils/PlannerUtils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export class AbstractUnit extends React.PureComponent {
  changeMerge = (obj) => this.props.onChange(obj)
  change = (name, val) => this.changeMerge({ [name]: val })
  toggleLocked = () => this.change('locked', !this.props.locked)
  toggleCompleted = () => this.change('completed', !this.props.completed)

  available = () => true
  credits = () => this.props.unit.credits

  availabilityTooltip = () => (
    <OverlayTrigger placement="left" overlay={
      <Tooltip id={`tt-${this.props.unit.code}`}>
        This unit may be unavailable during this study period.
        (Available periods: { _.uniq(this.props.unit.unit_availabilities.map(x => x.period)).join(", ") })
      </Tooltip>
    }>
      <span className="tip">Unavailable</span>
    </OverlayTrigger>
  )

  footer = (showControls=true) => (
    <div className="footer">
      <span><i className="fas fa-coins">&nbsp;</i> { this.credits() }</span>
  
      {
        !showControls ? [] :
          <span>
          <a className="button" onClick={this.toggleLocked}>
            <i className={"fas fa-" + (this.props.locked ? "lock-open" : "lock")}>&nbsp;</i>
          </a>
          &nbsp;
          <a className="button" onClick={this.toggleCompleted}>
            <i className={"fas fa-" + (this.props.completed ? "times" : "check")}>&nbsp;</i>
          </a>
        </span>
      }
    </div>
  )
}

export class Unit extends AbstractUnit {
  available = () => {
    return this.props.container.id === 'arena' || estimateAvailability(this.props.container.title, this.props.unit.unit_availabilities)
  }

  divClass = () => {
    let classes = ["unit-item"]
    if (this.props.isDragging) classes.push("dragging")

    if (this.props.locked) classes.push("locked")
    if (this.props.completed) classes.push("completed")
    if (this.props.highlight) classes.push("highlight-" + this.props.highlight)
    if (this.props.prereqStatus) {
      let pr = this.props.prereqStatus
      if (pr.readyToEnrol) classes.push("prereq-ready")
      if (pr.bad) classes.push("prereq-bad")
    }

    if (!this.available()) 
      classes.push("avail-bad")

    return classes.join(" ")
  }

  render() {
    return (
      <div className={this.divClass()}>
        <p className="unit-title">{ this.props.unit.code } { this.props.unit.abbrev ? ("(" + this.props.unit.abbrev + ")") : "" }</p>
        <p className="unit-subtitle">{ this.props.unit.name }</p>
        { !this.available() ? this.availabilityTooltip() : [] }
        { this.footer() }
      </div>
    )
  }
}

export default Unit;