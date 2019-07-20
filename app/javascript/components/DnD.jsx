import React from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';

export const EasyDraggable = (props) => (
  <Draggable
    {...props.draggable}
    draggableId={props.id}
    isDragDisabled={props.locked}
    index={props.index}>

      {
        (provided, snap) => (
          <div ref={provided.innerRef} {...(props.div ? props.div(snap) : {} )} {...provided.draggableProps} {...provided.dragHandleProps}>
            { props.children(provided, snap) }
          </div>
        )
      }
  </Draggable>
)

export const EasyDroppable = (props) => (
  <Droppable
    {...props.droppable}
    droppableId={props.id}
    direction={props.direction || 'vertical'}>

    {
      (provided, snap) => (
        <div ref={provided.innerRef} {...(props.div ? props.div(snap) : {} )} {...provided.droppableProps}>
          { props.children(provided, snap) }
        </div>
      )
    }
  </Droppable>
)

const droppableClass = (snap, extra) => {
  let arr = ["droppable"]
  if (snap.isDraggingOver) arr.push("draggedOver")

  if (extra) arr = arr.concat(extra)
  return arr.join(' ')
}

export const DroppableList = (props) => (
  <EasyDroppable
    id={props.id}
    direction={props.direction}
    div={ s => ({ className: droppableClass(s, props.className) }) }>
      { (provided, snapshot) => (
        <React.Fragment>
          { props.pre }
          <div className={"flex-container " + props.direction}>
            { props.children }
            { provided.placeholder }
          </div>
          { props.post }
        </React.Fragment>
      )}
  </EasyDroppable>
)