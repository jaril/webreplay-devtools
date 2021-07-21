import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SecondaryToolbox from "../SecondaryToolbox";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import { UIState } from "ui/state";
import SidePanel from "../SidePanel";

function DevView({
  updateTimelineDimensions,
  narrowMode,
  recordingTarget,
  showVideoPanel,
}: PropsFromRedux) {
  const handleMove = (num: number) => {
    updateTimelineDimensions();
    prefs.toolboxHeight = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  if (narrowMode) {
    return (
      <>
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={1}
          initialSize={prefs.toolboxHeight as string}
          minSize="20%"
          maxSize="80%"
          vert={false}
          onMove={handleMove}
          startPanel={
            <div className="horizontal-panels">
              <Toolbar />
              <Toolbox />
            </div>
          }
          endPanel={<SecondaryToolbox />}
          endPanelControl={false}
        />
        <div id="timeline-container">
          <Timeline />
        </div>
      </>
    );
  }

  if (recordingTarget == "node") {
    return (
      <div className="horizontal-panels">
        <Toolbar />
        <div style={{ flexDirection: "column", display: "flex", height: "100%", width: "100%" }}>
          <div className="vertical-panels">
            <div style={{ borderRight: "1px solid var(--theme-splitter-color)" }}>
              <SidePanel />
            </div>
            <SplitBox
              style={{ width: "100%", overflow: "hidden" }}
              splitterSize={1}
              initialSize={prefs.toolboxHeight as string}
              minSize="20%"
              maxSize="80%"
              vert={true}
              onMove={handleMove}
              startPanel={<Toolbox />}
              endPanel={<SecondaryToolbox />}
              endPanelControl={false}
            />
          </div>
          <div id="timeline-container">
            <Timeline />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="horizontal-panels">
      <Toolbar />
      <div className="vertical-panels">
        <div className="horizontal-panels">
          <div style={{ borderRight: "1px solid var(--theme-splitter-color)" }}>
            <SidePanel />
          </div>
          <SplitBox
            style={{ width: "100%", overflow: "hidden" }}
            splitterSize={1}
            initialSize={prefs.toolboxHeight as string}
            minSize="20%"
            maxSize="80%"
            vert={true}
            onMove={handleMove}
            startPanel={<Toolbox />}
            endPanel={showVideoPanel ? <Viewer /> : <SecondaryToolbox />}
            endPanelControl={false}
          />
        </div>
        <div id="timeline-container">
          <Timeline />
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    narrowMode: selectors.getNarrowMode(state),
    recordingTarget: selectors.getRecordingTarget(state),
    showVideoPanel: selectors.getShowVideoPanel(state),
  }),
  {
    updateTimelineDimensions,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(DevView);
