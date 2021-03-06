import React from "react";
import { actions } from "ui/actions";
import { connect } from "react-redux";
import { gql, useMutation } from "@apollo/client";
import hooks from "ui/hooks";

function Privacy({ isPrivate, toggleIsPrivate }) {
  if (isPrivate) {
    return (
      <div className="menu-item" onClick={toggleIsPrivate}>
        Make public
      </div>
    );
  }
  return (
    <div className="menu-item" onClick={toggleIsPrivate}>
      Make private
    </div>
  );
}

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  recording,
  toggleIsPrivate,
  isPrivate,
  setModal,
}) => {
  const deleteRecording = hooks.useDeleteRecording(["GetWorkspaceRecordings", "GetMyRecordings"]);

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId, deletedAt: new Date().toISOString() } });
  };

  const { recording_id } = recording;

  return (
    <div className="dropdown-panel">
      {!editingTitle ? (
        <div className="menu-item" onClick={() => setEditingTitle(true)}>
          Edit Title
        </div>
      ) : null}
      <div className="menu-item" onClick={() => onDeleteRecording(recording_id)}>
        Delete Recording
      </div>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={toggleIsPrivate} />
      <div className="menu-item" onClick={() => setModal("sharing", { recordingId: recording_id })}>
        Open sharing preferences
      </div>
    </div>
  );
};

export default connect(null, {
  setModal: actions.setModal,
})(DropdownPanel);
