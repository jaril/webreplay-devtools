import React from "react";
import { actions } from "ui/actions";
import { connect } from "react-redux";
import { gql, useMutation } from "@apollo/client";

const DELETE_RECORDING = gql`
  mutation DeleteRecording($recordingId: String) {
    delete_recordings(where: { recording_id: { _eq: $recordingId } }) {
      returning {
        id
      }
    }
  }
`;

const DropdownPanel = ({
  editingTitle,
  setEditingTitle,
  recordingId,
  toggleIsPrivate,
  isPrivate,
  setModal,
}) => {
  const [deleteRecording] = useMutation(DELETE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId } });
  };

  return (
    <div className="dropdown-panel">
      {!editingTitle ? (
        <div className="menu-item" onClick={() => setEditingTitle(true)}>
          Edit Title
        </div>
      ) : null}
      <div className="menu-item" onClick={() => onDeleteRecording(recordingId)}>
        Delete Recording
      </div>
      {isPrivate ? (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make public
        </div>
      ) : (
        <div className="menu-item" onClick={toggleIsPrivate}>
          Make private
        </div>
      )}
      <div className="menu-item" onClick={() => setModal("sharing")}>
        Open sharing preferences
      </div>
    </div>
  );
};

export default connect(null, {
  setModal: actions.setModal,
})(DropdownPanel);
