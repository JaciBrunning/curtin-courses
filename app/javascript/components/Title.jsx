import React from 'react';
import InlineEdit from 'react-edit-inline-ff';

export const MaybeEditableTitle = (props) => (
  props.hide ? <React.Fragment /> :
    props.editable ? <React.Fragment>
      <InlineEdit
        className="title title-edit"
        text={props.title}
        paramName="title"
        change={props.onChange}/>
      <br />
    </React.Fragment> :
    <p className="title title-noedit">{ props.title }</p>
)