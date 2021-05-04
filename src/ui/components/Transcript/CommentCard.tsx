import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import NewCommentEditor from "../Comments/TranscriptComments/CommentEditor/NewCommentEditor";
import {
  Comment,
  PendingComment,
  PendingNewComment,
  PendingNewReply,
  Reply,
} from "ui/state/comments";
import ExistingCommentEditor from "../Comments/TranscriptComments/CommentEditor/ExistingCommentEditor";
import CommentActions from "../Comments/TranscriptComments/CommentActions";
import CommentSource from "./CommentSource";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

function _Comment({
  pendingComment,
  comment,
}: {
  pendingComment: PendingComment | null;
  comment: Comment | Reply;
}) {
  if (
    pendingComment &&
    (pendingComment.type == "edit_reply" || pendingComment.type == "edit_comment") &&
    "id" in comment &&
    pendingComment.comment.id == comment.id
  ) {
    return <ExistingCommentEditor comment={pendingComment.comment} type={pendingComment.type} />;
  }

  let relativeDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div>
      <div className="space-y-6 px-4 pt-4">
        <div className="flex space-x-3 items-center">
          <img
            className="h-10 w-10 rounded-full"
            src={comment.user.picture}
            alt={comment.user.name}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{comment.user.name}</h3>
              <CommentActions comment={comment} isRoot={true} />
            </div>
            <p className="text-lg text-gray-500">{relativeDate}</p>
          </div>
        </div>
      </div>
      <div className="space-y-6 px-4 pt-4 pb-4 text-lg">{comment.content}</div>
    </div>
  );
}

type PropsFromParent = {
  comment: Comment | PendingNewComment;
};
type CommentCardProps = PropsFromRedux & PropsFromParent;

function CommentCard({
  comment,
  currentTime,
  executionPoint,
  seekToComment,
  replyToComment,
  pendingComment,
}: CommentCardProps) {
  const isPaused = comment.time === currentTime && executionPoint === comment.point;
  const isEditing =
    pendingComment?.comment.time === currentTime &&
    pendingComment?.comment.point === executionPoint;

  const onReply = (e: React.MouseEvent) => {
    e.stopPropagation();

    if ("id" in comment) {
      replyToComment(comment);
    }
  };

  // If the comment for this card doesn't have an ID, it's because it's the corresponding
  // comment for a pending new comment.
  if (!("id" in comment)) {
    console.log(">>rendering fake");
    return (
      <div className={`mx-auto w-full group`}>
        <div className={classNames("bg-white rounded-xl border border-blue-400 shadow-lg")}>
          {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
          <NewCommentEditor comment={comment} type={"new_comment"} />
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full group`} onClick={() => seekToComment(comment)}>
      <div
        className={classNames("bg-white rounded-xl border border-gray-300 hover:border-blue-400", {
          "border-blue-400 shadow-lg": isPaused,
          "cursor-pointer": !isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <_Comment comment={comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div className="border-t border-gray-200" key={i}>
            <_Comment comment={reply} pendingComment={pendingComment} />
          </div>
        ))}
        {isPaused && !isEditing ? (
          pendingComment && pendingComment.type.includes("new") ? (
            <div className="border-t border-gray-200">
              <NewCommentEditor
                comment={pendingComment.comment as PendingNewReply}
                type={"new_reply"}
              />
            </div>
          ) : (
            <div
              className="mt-6 border-t border-gray-200 px-4 py-4 text-lg text-gray-400"
              onClick={onReply}
            >
              Write a reply...
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    replyToComment: actions.replyToComment,
    seekToComment: actions.seekToComment,
    editItem: actions.editItem,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
