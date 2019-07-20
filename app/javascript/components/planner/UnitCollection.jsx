import React from 'react';
import { DroppableList } from '../DnD';
import { MaybeEditableTitle } from '../Title';

export const UnitCollection = (props) => (
  <DroppableList
    {...props}
    pre={
      <React.Fragment>
        <MaybeEditableTitle
          editable={props.editableTitle}
          title={props.title}
          onChange={props.onTitleChange}
          hide={props.hideTitle} />
        
        {
          props.showTotalCredits ?
            <React.Fragment>
              <i className="fas fa-coins">&nbsp;</i>
              { props.units.map(u => u.unit.credits).reduce((a, b) => a + b, 0) }
            </React.Fragment> : []
        }
      </React.Fragment>
    }
    />
)