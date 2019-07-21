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
      </React.Fragment>
    }
    />
)