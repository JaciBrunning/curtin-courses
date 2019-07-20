import React from 'react';

class Unit extends React.PureComponent {
  toggleLocked = () => this.props.onLock(!this.props.locked)
  toggleCompleted = () => this.props.onComplete(!this.props.completed)

  divClass = () => {
    let classes = ["unit-item"]
    if (this.props.isDragging) classes.push("dragging")

    if (this.props.locked) classes.push("locked")
    if (this.props.completed) classes.push("completed")
    if (this.props.highlight)
      classes.push("highlight-" + this.props.highlight)

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
                  <i className={"fas fa-" + (this.props.locked ? "lock-open" : "lock")}>&nbsp;</i>
                </a>
                &nbsp;
                <a className="button" onClick={this.toggleCompleted}>
                  <i className={"fas fa-" + (this.props.completed ? "times" : "check")}>&nbsp;</i>
                </a>
              </span>
          }
        </div>
      </div>
    )
  }
}

export default Unit;