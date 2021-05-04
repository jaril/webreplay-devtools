import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";

import TranscriptFilter from "ui/components/Transcript/TranscriptFilter";
import "./Transcript.css";
import UploadScreen from "../UploadScreen";

import { UIState } from "ui/state";
import { Event, Comment, PendingNewComment } from "ui/state/comments";
import CommentCard from "./CommentCard";

type Entry = Comment | Event;

function createEntries(comments: Comment[], clickEvents: Event[], shouldShowLoneEvents: boolean) {
  let entries = clickEvents.map(event => ({ ...event }));

  let nonNestedComments = comments.reduce((acc: Comment[], comment: Comment) => {
    const matchingEntryIndex = entries.findIndex(entry => entry.point == comment.point);
    if (matchingEntryIndex >= 0) {
      entries[matchingEntryIndex].comment = comment;
      return acc;
    } else {
      return [...acc, comment];
    }
  }, []);

  // If lone events are supposed to be hidden, filter them out.
  if (!shouldShowLoneEvents) {
    entries = entries.filter(entry => entry.comment);
  }

  return [...entries, ...nonNestedComments];
}

function Transcript({ recordingId, pendingComment, clearPendingComment }: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);
  const { recording, loading } = hooks.useGetRecording(recordingId!);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;
  const [focusedCommentId, setFocusedCommentId] = useState<null | string>(null);

  const setFocused = (id: string | null) => {
    clearPendingComment();
    setFocusedCommentId(id);
  };

  if (loading) {
    return null;
  }

  // Only show the initialization screen if the replay is not being opened
  // for testing purposes.
  if (isAuthor && !recording?.isInitialized && !isTest()) {
    return <UploadScreen />;
  }

  const displayedComments: (Comment | PendingNewComment)[] = [...comments];

  if (pendingComment?.type == "new_comment") {
    displayedComments.push(pendingComment.comment);
  }

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Comments</div>
        <TranscriptFilter />
      </div>
      <div className="transcript-panel">
        <div className="transcript-list space-y-4">
          {sortBy(displayedComments, ["time"]).map((entry, i) => {
            return <CommentCard comment={entry} key={i} />;
          })}
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
