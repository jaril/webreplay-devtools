import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { PendingComment, Event, Comment, Reply, FloatingItem } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import isEqual from "lodash/isEqual";
import { setSelectedPrimaryPanel } from "./app";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment | null };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type SetSelectedComment = Action<"set_selected_comment"> & { comment: any };
type SetShouldShowLoneEvents = Action<"set_should_show_lone_events"> & { value: boolean };
type SetFloatingItem = Action<"set_floating_item"> & {
  floatingItem: FloatingItem | null;
};

export type CommentsAction =
  | SetPendingComment
  | SetHoveredComment
  | SetShouldShowLoneEvents
  | SetFloatingItem
  | SetSelectedComment;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function setSelectedComment(comment: any): SetSelectedComment {
  return { type: "set_selected_comment", comment };
}

export function clearPendingComment(): SetPendingComment {
  return { type: "set_pending_comment", comment: null };
}

export function setFloatingItem(floatingItem: FloatingItem | null): SetFloatingItem {
  return { type: "set_floating_item", floatingItem };
}

export function toggleShowLoneEvents(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const newValue = !selectors.getShouldShowLoneEvents(getState());
    dispatch({ type: "set_should_show_lone_events", value: newValue });
  };
}

export function showFloatingItem(): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const initialFloatingItem = selectors.getFloatingItem(getState());

    const newFloatingItem: FloatingItem = {
      itemType: "pause",
      time: selectors.getCurrentTime(getState()),
      point: ThreadFront.currentPoint,
      hasFrames: ThreadFront.currentPointHasFrames,
      location: await ThreadFront.getCurrentPauseSourceLocation(),
    };

    const currentFloatingItem = selectors.getFloatingItem(getState());

    // We should bail if the newFloatingItem is now stale. This happens in cases where
    // the state's floatingItem changes while we wait for the newFloatingItem to resolve.
    if (initialFloatingItem !== currentFloatingItem) {
      return;
    }

    if (isEqual(currentFloatingItem, newFloatingItem)) {
      return;
    }

    dispatch(setFloatingItem(newFloatingItem));
  };
}

export function hideFloatingItem(): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch(setFloatingItem(null));
  };
}

export function createComment(
  time: number,
  point: string,
  position: { x: number; y: number } | null
): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch(setSelectedPrimaryPanel("comments"));

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        time,
        point,
        hasFrames: ThreadFront.currentPointHasFrames,
        sourceLocation: (await ThreadFront.getCurrentPauseSourceLocation()) || null,
        position,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}

export function editItem(item: Comment | Reply): UIThunkAction {
  return async ({ dispatch }) => {
    const { point, time, hasFrames } = item;

    dispatch(seekToComment(item));

    if (!("replies" in item)) {
      const { content, sourceLocation, parentId, position, id } = item;

      // Editing a reply.
      const pendingComment: PendingComment = {
        type: "edit_reply",
        comment: { content, time, point, hasFrames, sourceLocation, parentId, position, id },
      };
      dispatch(setPendingComment(pendingComment));
    } else {
      const { content, sourceLocation, id, position } = item;

      // Editing a comment.
      const pendingComment: PendingComment = {
        type: "edit_comment",
        comment: {
          content,
          time,
          point,
          hasFrames,
          sourceLocation,
          id,
          position,
        },
      };
      dispatch(setPendingComment(pendingComment));
    }
  };
}

export function seekToComment(item: Comment | Reply | Event | FloatingItem): UIThunkAction {
  return ({ dispatch, getState }) => {
    dispatch(clearPendingComment());

    let cx = selectors.getThreadContext(getState());
    const hasFrames = "hasFrames" in item ? item.hasFrames : false;
    dispatch(actions.seek(item.point, item.time, hasFrames));
    if ("sourceLocation" in item && item.sourceLocation) {
      cx = selectors.getThreadContext(getState());
      dispatch(actions.selectLocation(cx, item.sourceLocation));
    }
  };
}

export function replyToComment(comment: Comment): UIThunkAction {
  return ({ dispatch }) => {
    const { time, point, hasFrames, id } = comment;
    const pendingComment: PendingComment = {
      type: "new_reply",
      comment: {
        content: "",
        time,
        point,
        hasFrames,
        sourceLocation: null,
        parentId: id,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}
