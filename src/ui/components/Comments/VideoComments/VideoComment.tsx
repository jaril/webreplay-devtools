import React from "react";
import { selectors } from "ui/reducers";
import classnames from "classnames";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";
import { ChatAltIcon } from "@heroicons/react/solid";

const MARKER_DIAMETER = 28;
const MARKER_RADIUS = 14;

function VideoComment({
  comment,
  canvas,
  selectedComment,
  setHoveredComment,
  setSelectedComment,
}: PropsFromRedux) {
  if (!canvas || !comment) {
    return null;
  }

  const { scale } = canvas;
  const position = comment.position;

  const isSelected = "id" in comment && selectedComment && selectedComment.id === comment.id;

  return (
    <div
      className={`canvas-comment`}
      style={{
        top: position.y * scale - MARKER_RADIUS,
        left: position.x * scale - MARKER_RADIUS,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
      >
        <span
          className={classnames(
            `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 pointer-events-none`,
            !selectedComment ? "bg-blue-400" : isSelected ? "bg-blue-400" : "bg-gray-400"
          )}
        />
        <span
          className={classnames(
            "rounded-full relative inline-flex transition duration-300 ease-in-out cursor-pointer",
            !selectedComment ? "bg-blue-500" : isSelected ? "bg-blue-500" : "bg-gray-500"
          )}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
          onClick={() => setSelectedComment(comment)}
          style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
        />
        <ChatAltIcon className="w-5 h-5 absolute text-white pointer-events-none	" />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    canvas: selectors.getCanvas(state),
    selectedComment: selectors.getSelectedComment(state),
  }),
  { setHoveredComment: actions.setHoveredComment, setSelectedComment: actions.setSelectedComment }
);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  comment: any;
};
export default connector(VideoComment);
