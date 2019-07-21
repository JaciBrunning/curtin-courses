import React from 'react';
import { AbstractUnit } from './Unit';
import { Typeahead } from 'react-bootstrap-typeahead';
import { DropdownButton, Dropdown } from 'react-bootstrap';

class MultiUnit extends AbstractUnit {

  credits = () => (
    'credits' in this.props ? this.props.credits : this.props.unit.credits
  )

  canChooseUnit = (code) => {
    if (!this.props.canChooseUnit(code)) return false
    if (this.props.chosen && _.includes(this.props.chosen, code)) return false;
    return true;
  }

  render() {
    return (
      <div className="unit-item">
        {
          this.props.unit.freeform === 'optional' ?
            <DropdownButton id={this.props.unit.code + "-dd"} title="Select Opts" style={{position: 'unset'}}>
              {
                (this.props.getOptionalChoices(this.props.unit.code) || []).map(u => (
                  (!this.canChooseUnit(u.code)) ? [] :
                  <Dropdown.Item key={u.code} onSelect={() => this.props.splitOptional(u)}>{ u.code } - { u.name }</Dropdown.Item>
                ))
              }
            </DropdownButton>
            :
            <span>
              <p className="unit-title"> Elective Unit(s) </p>
              <p className="unit-subtitle"> Support coming soon </p>
            </span>
        }
        { !this.available() ? this.availabilityTooltip() : [] }
        { this.footer(false) }
      </div>
    )
  }

}

export default MultiUnit