/* Copyright 2020 Record Replay Inc. */

// Harness used for local testing.

dump(`TestHarnessStart\n`);

#include "header.js"

// env is declared in the scope this is evaluated in.
const url = env.get("RECORD_REPLAY_TEST_URL");

(async function() {
  await openUrlInTab(url, "localhost");

  if (env.RECORD_REPLAY_RECORD_EXAMPLE) {
    await clickRecordingButton;
    await waitForMessage("RecordingFinished");
    await clickRecordingButton;
  }

  if (!env.RECORD_REPLAY_DONT_RECORD_VIEWER) {
    await waitForDevtools();
    await clickRecordingButton();
  }

  await waitForMessage("TestFinished");
  finishTest();
})();
