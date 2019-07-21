import React from 'react';
import { AbstractUnit } from './Unit';
import { Typeahead } from 'react-bootstrap-typeahead';
import { DropdownButton, Dropdown } from 'react-bootstrap';

class MultiUnit extends AbstractUnit {

  credits = () => (
    'credits' in this.props ? this.props.credits : this.props.unit.credits
  )

  render() {
    return (
      <div className="unit-item">
        {
          this.props.unit.freeform === 'optional' ?
          <DropdownButton id={this.props.unit.code + "-dd"} title="Select Opts" style={{position: 'unset'}}>
            {
              (this.props.getOptionalChoices(this.props.unit.code) || []).map(u => (
                (this.props.chosen && _.includes(this.props.chosen, u.code)) ? [] :
                <Dropdown.Item key={u.code} onSelect={() => this.props.splitOptional(u)}>{ u.code } - { u.name }</Dropdown.Item>
              ))
            }
          </DropdownButton>
          : []
        }
        { !this.available() ? this.availabilityTooltip() : [] }
        { this.footer(false) }
      </div>
    )
  }

}

export default MultiUnit