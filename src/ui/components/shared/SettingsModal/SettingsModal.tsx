import React, { useState } from "react";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings, SelectedTab } from "./types";

import "./SettingsModal.css";

const settings: Settings = [
  {
    title: "Experimental",
    icon: "biotech",
    items: [
      {
        label: "Enable the Elements pane",
        key: "show_elements",
        description: "Inspect HTML markup and CSS styling",
        disabled: false,
      },
      {
        label: "Enable React DevTools",
        key: "show_react",
        description: "Inspect the React component tree",
        disabled: false,
      },
    ],
  },
  {
    title: "Invitations",
    icon: "stars",
    items: [],
  },
  {
    title: "Support",
    icon: "support",
    items: [],
  },
];

export default function SettingsModal() {
  // No need to handle loading state here as it's already cached from the useGetUserSettings
  // query in the DevTools component
  const { userSettings, loading } = hooks.useGetUserSettings();

  const [selectedTab, setSelectedTab] = useState<SelectedTab>(settings[0].title);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  if (loading) {
    return (
      <div className="settings-modal">
        <Modal></Modal>
      </div>
    );
  }

  return (
    <div className="settings-modal">
      <Modal>
        <SettingsNavigation {...{ settings, selectedTab, setSelectedTab }} />
        <SettingsBody {...{ selectedSetting, userSettings }} />
      </Modal>
    </div>
  );
}
