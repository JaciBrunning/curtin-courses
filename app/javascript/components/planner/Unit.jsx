import React from 'react';
import { estimateAvailability } from '../../utils/PlannerUtils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

class Unit extends React.PureComponent {
  toggleLocked = () => this.props.onChange('locked', !this.props.locked)
  toggleCompleted = () => this.props.onChange('completed', !this.props.completed)

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
        {
            !this.available() ? 
            <OverlayTrigger placement="right" overlay={
              <Tooltip id={`tt-${this.props.unit.code}`}>
                This unit may be unavailable during this study period.
              </Tooltip>
            }>
              <span className="tip">Unavailable</span>
            </OverlayTrigger> : []
          }
        <div className="footer">
          <span><i className="fas fa-coins">&nbsp;</i> { this.props.unit.credits }</span>
      
          <span>
            <a className="button" onClick={this.toggleLocked}>
              <i className={"fas fa-" + (this.props.locked ? "lock-open" : "lock")}>&nbsp;</i>
            </a>
            &nbsp;
            <a className="button" onClick={this.toggleCompleted}>
              <i className={"fas fa-" + (this.props.completed ? "times" : "check")}>&nbsp;</i>
            </a>
          </span>
        </div>
      </div>
    )
  }
}

export default Unit;