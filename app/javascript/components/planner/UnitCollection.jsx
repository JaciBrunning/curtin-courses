import React from 'react';
import { DroppableList } from '../DnD';
import { MaybeEditableTitle } from '../Title';

export const UnitCollection = (props) => (
  <DroppableList
    {...props}
    pre={
      <React.Fragment>
        {
          !props.canRemove ? [] :
          <a onClick={e => props.onRemove(props.id)}><i className="fas fa-times">&nbsp;</i></a>
        }
        <MaybeEditableTitle
          editable={props.editableTitle}
          title={props.title}
          onChange={props.onTitleChange}
          hide={props.hideTitle} />
      </React.Fragment>
    }
    />
)